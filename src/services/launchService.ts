import type {
    CreateLaunchRequest,
    Launch,
    LaunchStatus,
    TransitionLaunchRequest,
    UpdateLaunchRequest,
    ValidationError,
} from '../types/launch.js';
import { logger } from '../utils/logger.js';
import { rocketService } from './rocketService.js';

const LAUNCH_NOT_FOUND_ERROR = 'Launch not found';
const ROCKET_NOT_FOUND_ERROR = 'Rocket not found';
const INVALID_TRANSITION_ERROR = 'Invalid launch status transition';
const LOG_CONTEXT = 'LaunchService';
const ISO_DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

const ALLOWED_STATUS_TRANSITIONS: Record<LaunchStatus, readonly LaunchStatus[]> = {
  scheduled: ['confirmed', 'cancelled'],
  confirmed: ['successful', 'suspended', 'cancelled'],
  suspended: ['confirmed', 'cancelled'],
  successful: [],
  cancelled: [],
};

const BOOKABLE_LAUNCH_STATUSES = new Set<LaunchStatus>(['scheduled', 'confirmed']);

class LaunchService {
  private launches: Map<string, Launch> = new Map();
  private nextId = 1;

  private generateId(): string {
    return `launch-${this.nextId++}`;
  }

  private isValidISODateTime(dateString: string): boolean {
    if (!dateString || typeof dateString !== 'string') {
      return false;
    }

    if (!ISO_DATE_TIME_REGEX.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private isPastDate(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  }

  private getRocketOrThrow(rocketId: string) {
    const rocket = rocketService.getRocketById(rocketId);
    if (!rocket) {
      throw new Error(ROCKET_NOT_FOUND_ERROR);
    }
    return rocket;
  }

  private throwValidationErrors(errors: ValidationError[]): never {
    throw new Error(JSON.stringify(errors));
  }

  private hasMinPassengersCapacityError(errors: ValidationError[]): boolean {
    return errors.some(
      (error) => error.field === 'minPassengers' && error.message.includes('rocket capacity'),
    );
  }

  private getTransitionValidationErrors(
    currentStatus: LaunchStatus,
    request: TransitionLaunchRequest,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!request.targetStatus) {
      errors.push({ field: 'targetStatus', message: 'Target status is required' });
      return errors;
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(request.targetStatus)) {
      errors.push({
        field: 'targetStatus',
        message: `${INVALID_TRANSITION_ERROR}: ${currentStatus} -> ${request.targetStatus}`,
      });
    }

    if (request.reason !== undefined) {
      if (typeof request.reason !== 'string') {
        errors.push({ field: 'reason', message: 'Reason must be a string' });
      } else if (request.reason.trim() === '') {
        errors.push({ field: 'reason', message: 'Reason cannot be empty' });
      }
    }

    return errors;
  }

  private buildUpdateData(existingLaunch: Launch, data: UpdateLaunchRequest): CreateLaunchRequest {
    return {
      rocketId: existingLaunch.rocketId,
      launchDateTime: data.launchDateTime ?? existingLaunch.launchDateTime,
      price: data.price ?? existingLaunch.price,
      minPassengers: data.minPassengers ?? existingLaunch.minPassengers,
    };
  }

  validateLaunchData(data: Partial<CreateLaunchRequest>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate rocketId
    if (data.rocketId === undefined || data.rocketId === null || data.rocketId.trim() === '') {
      errors.push({ field: 'rocketId', message: 'Rocket ID is required' });
    } else {
      const rocket = rocketService.getRocketById(data.rocketId);
      if (!rocket) {
        errors.push({ field: 'rocketId', message: 'Rocket reference is invalid' });
      } else {
        // Validate minPassengers against rocket capacity if provided
        if (data.minPassengers !== undefined && data.minPassengers !== null) {
          if (!Number.isInteger(data.minPassengers) || data.minPassengers < 1 || data.minPassengers > rocket.capacity) {
            errors.push({ 
              field: 'minPassengers', 
              message: `Minimum passengers must be an integer between 1 and ${rocket.capacity} (rocket capacity)` 
            });
          }
        }
      }
    }

    // Validate launchDateTime
    if (data.launchDateTime === undefined || data.launchDateTime === null || data.launchDateTime.trim() === '') {
      errors.push({ field: 'launchDateTime', message: 'Launch date and time is required' });
    } else if (!this.isValidISODateTime(data.launchDateTime)) {
      errors.push({ field: 'launchDateTime', message: 'Launch date and time must be a valid ISO 8601 format' });
    } else if (this.isPastDate(data.launchDateTime)) {
      errors.push({ field: 'launchDateTime', message: 'Launch date and time must be in the future' });
    }

    // Validate price
    if (data.price === undefined || data.price === null) {
      errors.push({ field: 'price', message: 'Price is required' });
    } else if (typeof data.price !== 'number' || data.price <= 0) {
      errors.push({ field: 'price', message: 'Price must be a positive number' });
    }

    // Validate minPassengers (basic validation if rocket not found)
    if (data.minPassengers === undefined || data.minPassengers === null) {
      errors.push({ field: 'minPassengers', message: 'Minimum passengers is required' });
    } else if (!Number.isInteger(data.minPassengers) || data.minPassengers < 1) {
      // Only check if it's at least 1 if rocket not found (capacity check done above)
      const hasRocketCapacityError = this.hasMinPassengersCapacityError(errors);
      if (!hasRocketCapacityError && data.minPassengers < 1) {
        errors.push({ field: 'minPassengers', message: 'Minimum passengers must be at least 1' });
      }
    }

    return errors;
  }

  createLaunch(data: CreateLaunchRequest): Launch {
    logger.info(LOG_CONTEXT, 'Creating launch', { rocketId: data.rocketId });
    const errors = this.validateLaunchData(data);
    if (errors.length > 0) {
      logger.error(LOG_CONTEXT, 'Validation failed', { errors });
      throw new Error(JSON.stringify(errors));
    }

    const rocket = this.getRocketOrThrow(data.rocketId);

    const launch: Launch = {
      id: this.generateId(),
      rocketId: data.rocketId,
      launchDateTime: data.launchDateTime,
      price: data.price,
      minPassengers: data.minPassengers,
      availableSeats: rocket.capacity,
      status: 'scheduled',
      statusUpdatedAt: new Date().toISOString(),
    };

    this.launches.set(launch.id, launch);
    logger.info(LOG_CONTEXT, 'Launch created', { id: launch.id });
    return launch;
  }

  getAllLaunches(): Launch[] {
    logger.info(LOG_CONTEXT, 'Getting all launches');
    const launches = Array.from(this.launches.values());
    logger.info(LOG_CONTEXT, 'Retrieved all launches', { count: launches.length });
    return launches;
  }

  getLaunchById(id: string): Launch | undefined {
    logger.info(LOG_CONTEXT, 'Getting launch by id', { id });
    const launch = this.launches.get(id);
    if (launch) {
      logger.info(LOG_CONTEXT, 'Launch found', { id });
    } else {
      logger.warn(LOG_CONTEXT, 'Launch not found', { id });
    }
    return launch;
  }

  updateLaunch(id: string, data: UpdateLaunchRequest): Launch {
    logger.info(LOG_CONTEXT, 'Updating launch', { id });
    const existingLaunch = this.launches.get(id);
    if (!existingLaunch) {
      logger.error(LOG_CONTEXT, 'Launch not found for update', { id });
      throw new Error(LAUNCH_NOT_FOUND_ERROR);
    }

    // Build the updated data, preserving rocketId as it's not updatable
    const updatedData = this.buildUpdateData(existingLaunch, data);

    const errors = this.validateLaunchData(updatedData);
    if (errors.length > 0) {
      logger.error(LOG_CONTEXT, 'Validation failed on update', { errors });
      throw new Error(JSON.stringify(errors));
    }

    this.getRocketOrThrow(existingLaunch.rocketId);

    const updatedLaunch: Launch = {
      ...existingLaunch,
      launchDateTime: updatedData.launchDateTime,
      price: updatedData.price,
      minPassengers: updatedData.minPassengers,
      availableSeats: data.availableSeats ?? existingLaunch.availableSeats,
    };

    this.launches.set(id, updatedLaunch);
    logger.info(LOG_CONTEXT, 'Launch updated', { id });
    return updatedLaunch;
  }

  transitionLaunchStatus(id: string, request: TransitionLaunchRequest): Launch {
    logger.info(LOG_CONTEXT, 'Transitioning launch status', { id, targetStatus: request.targetStatus });
    const existingLaunch = this.launches.get(id);
    if (!existingLaunch) {
      logger.error(LOG_CONTEXT, 'Launch not found for status transition', { id });
      throw new Error(LAUNCH_NOT_FOUND_ERROR);
    }

    const errors = this.getTransitionValidationErrors(existingLaunch.status, request);
    if (errors.length > 0) {
      logger.warn(LOG_CONTEXT, 'Invalid launch status transition', {
        id,
        currentStatus: existingLaunch.status,
        targetStatus: request.targetStatus,
        errors,
      });
      this.throwValidationErrors(errors);
    }

    const updatedLaunch: Launch = {
      ...existingLaunch,
      status: request.targetStatus,
      statusUpdatedAt: new Date().toISOString(),
    };

    this.launches.set(id, updatedLaunch);
    logger.info(LOG_CONTEXT, 'Launch status transitioned', {
      id,
      from: existingLaunch.status,
      to: updatedLaunch.status,
    });

    return updatedLaunch;
  }

  isLaunchBookable(status: LaunchStatus): boolean {
    return BOOKABLE_LAUNCH_STATUSES.has(status);
  }

  deleteLaunch(id: string): boolean {
    logger.info(LOG_CONTEXT, 'Deleting launch', { id });
    const deleted = this.launches.delete(id);
    if (deleted) {
      logger.info(LOG_CONTEXT, 'Launch deleted', { id });
    } else {
      logger.warn(LOG_CONTEXT, 'Launch not found for deletion', { id });
    }
    return deleted;
  }
}

export const launchService = new LaunchService();
