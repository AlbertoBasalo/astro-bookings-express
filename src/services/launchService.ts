import type { CreateLaunchRequest, Launch, UpdateLaunchRequest, ValidationError } from '../types/launch.js';
import { logger } from '../utils/logger.js';
import { rocketService } from './rocketService.js';

const LAUNCH_NOT_FOUND_ERROR = 'Launch not found';

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
    
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!isoDateRegex.test(dateString)) {
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
      const hasRocketCapacityError = errors.some(e => e.field === 'minPassengers' && e.message.includes('rocket capacity'));
      if (!hasRocketCapacityError && data.minPassengers < 1) {
        errors.push({ field: 'minPassengers', message: 'Minimum passengers must be at least 1' });
      }
    }

    return errors;
  }

  createLaunch(data: CreateLaunchRequest): Launch {
    logger.info('LaunchService', 'Creating launch', { rocketId: data.rocketId });
    const errors = this.validateLaunchData(data);
    if (errors.length > 0) {
      logger.error('LaunchService', 'Validation failed', { errors });
      throw new Error(JSON.stringify(errors));
    }

    const rocket = rocketService.getRocketById(data.rocketId);
    if (!rocket) {
      throw new Error('Rocket not found'); // Should not happen after validation
    }

    const launch: Launch = {
      id: this.generateId(),
      rocketId: data.rocketId,
      launchDateTime: data.launchDateTime,
      price: data.price,
      minPassengers: data.minPassengers,
      availableSeats: rocket.capacity,
    };

    this.launches.set(launch.id, launch);
    logger.info('LaunchService', 'Launch created', { id: launch.id });
    return launch;
  }

  getAllLaunches(): Launch[] {
    logger.info('LaunchService', 'Getting all launches');
    const launches = Array.from(this.launches.values());
    logger.info('LaunchService', 'Retrieved all launches', { count: launches.length });
    return launches;
  }

  getLaunchById(id: string): Launch | undefined {
    logger.info('LaunchService', 'Getting launch by id', { id });
    const launch = this.launches.get(id);
    if (launch) {
      logger.info('LaunchService', 'Launch found', { id });
    } else {
      logger.warn('LaunchService', 'Launch not found', { id });
    }
    return launch;
  }

  updateLaunch(id: string, data: UpdateLaunchRequest): Launch {
    logger.info('LaunchService', 'Updating launch', { id });
    const existingLaunch = this.launches.get(id);
    if (!existingLaunch) {
      logger.error('LaunchService', 'Launch not found for update', { id });
      throw new Error(LAUNCH_NOT_FOUND_ERROR);
    }

    // Build the updated data, preserving rocketId as it's not updatable
    const updatedData: CreateLaunchRequest = {
      rocketId: existingLaunch.rocketId,
      launchDateTime: data.launchDateTime ?? existingLaunch.launchDateTime,
      price: data.price ?? existingLaunch.price,
      minPassengers: data.minPassengers ?? existingLaunch.minPassengers,
    };

    const errors = this.validateLaunchData(updatedData);
    if (errors.length > 0) {
      logger.error('LaunchService', 'Validation failed on update', { errors });
      throw new Error(JSON.stringify(errors));
    }

    const rocket = rocketService.getRocketById(existingLaunch.rocketId);
    if (!rocket) {
      throw new Error('Rocket not found'); // Should not happen
    }

    const updatedLaunch: Launch = {
      ...existingLaunch,
      launchDateTime: updatedData.launchDateTime,
      price: updatedData.price,
      minPassengers: updatedData.minPassengers,
      availableSeats: rocket.capacity, // Recalculate based on rocket capacity
    };

    this.launches.set(id, updatedLaunch);
    logger.info('LaunchService', 'Launch updated', { id });
    return updatedLaunch;
  }

  deleteLaunch(id: string): boolean {
    logger.info('LaunchService', 'Deleting launch', { id });
    const deleted = this.launches.delete(id);
    if (deleted) {
      logger.info('LaunchService', 'Launch deleted', { id });
    } else {
      logger.warn('LaunchService', 'Launch not found for deletion', { id });
    }
    return deleted;
  }
}

export const launchService = new LaunchService();
