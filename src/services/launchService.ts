import type { CreateLaunchRequest, Launch, UpdateLaunchRequest, ValidationError } from '../types/launch.js';
import { logger } from '../utils/logger.js';
import { rocketService } from './rocketService.js';

const MIN_PRICE = 0;

class LaunchService {
  private launches: Map<string, Launch> = new Map();
  private nextId = 1;

  private generateId(): string {
    return `launch-${this.nextId++}`;
  }

  private getRocketCapacity(rocketId: string): number | null {
    const rocket = rocketService.getRocketById(rocketId);
    return rocket ? rocket.capacity : null;
  }

  validateLaunchData(data: Partial<CreateLaunchRequest>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (data.rocketId === undefined || data.rocketId === null || data.rocketId.trim() === '') {
      errors.push({ field: 'rocketId', message: 'Rocket ID is required' });
    } else {
      const capacity = this.getRocketCapacity(data.rocketId);
      if (capacity === null) {
        errors.push({ field: 'rocketId', message: 'Rocket not found' });
      }
    }

    if (data.launchDateTime === undefined || data.launchDateTime === null || data.launchDateTime.trim() === '') {
      errors.push({ field: 'launchDateTime', message: 'Launch date time is required' });
    } else {
      const launchDate = new Date(data.launchDateTime);
      if (Number.isNaN(launchDate.getTime())) {
        errors.push({ field: 'launchDateTime', message: 'Launch date time must be a valid ISO timestamp' });
      } else if (launchDate <= new Date()) {
        errors.push({ field: 'launchDateTime', message: 'Launch date time must be in the future' });
      }
    }

    if (data.price === undefined || data.price === null) {
      errors.push({ field: 'price', message: 'Price is required' });
    } else if (typeof data.price !== 'number' || data.price <= MIN_PRICE) {
      errors.push({ field: 'price', message: 'Price must be a positive number' });
    }

    if (data.minPassengers === undefined || data.minPassengers === null) {
      errors.push({ field: 'minPassengers', message: 'Minimum passengers is required' });
    } else if (!Number.isInteger(data.minPassengers)) {
      errors.push({ field: 'minPassengers', message: 'Minimum passengers must be an integer' });
    } else {
      const capacity = this.getRocketCapacity(data.rocketId ?? '');
      if (capacity !== null && (data.minPassengers < 1 || data.minPassengers > capacity)) {
        errors.push({ 
          field: 'minPassengers', 
          message: `Minimum passengers must be between 1 and ${capacity} (inclusive)` 
        });
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

    const capacity = this.getRocketCapacity(data.rocketId);
    if (capacity === null) {
      const error = [{ field: 'rocketId', message: 'Rocket not found' }];
      logger.error('LaunchService', 'Rocket not found', { rocketId: data.rocketId });
      throw new Error(JSON.stringify(error));
    }

    const launch: Launch = {
      id: this.generateId(),
      rocketId: data.rocketId,
      launchDateTime: data.launchDateTime,
      price: data.price,
      minPassengers: data.minPassengers,
      availableSeats: capacity,
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
    const launch = this.launches.get(id);
    if (!launch) {
      logger.error('LaunchService', 'Launch not found for update', { id });
      throw new Error(JSON.stringify([{ field: 'id', message: 'Launch not found' }]));
    }

    const mergedData: CreateLaunchRequest = {
      rocketId: data.rocketId ?? launch.rocketId,
      launchDateTime: data.launchDateTime ?? launch.launchDateTime,
      price: data.price ?? launch.price,
      minPassengers: data.minPassengers ?? launch.minPassengers,
    };

    const errors = this.validateLaunchData(mergedData);
    if (errors.length > 0) {
      logger.error('LaunchService', 'Validation failed on update', { errors });
      throw new Error(JSON.stringify(errors));
    }

    const capacity = this.getRocketCapacity(mergedData.rocketId);
    if (capacity === null) {
      const error = [{ field: 'rocketId', message: 'Rocket not found' }];
      logger.error('LaunchService', 'Rocket not found on update', { rocketId: mergedData.rocketId });
      throw new Error(JSON.stringify(error));
    }

    const updatedLaunch: Launch = {
      ...launch,
      rocketId: mergedData.rocketId,
      launchDateTime: mergedData.launchDateTime,
      price: mergedData.price,
      minPassengers: mergedData.minPassengers,
      availableSeats: capacity,
    };

    this.launches.set(id, updatedLaunch);
    logger.info('LaunchService', 'Launch updated', { id });
    return updatedLaunch;
  }

  deleteLaunch(id: string): void {
    logger.info('LaunchService', 'Deleting launch', { id });
    const launch = this.launches.get(id);
    if (!launch) {
      logger.error('LaunchService', 'Launch not found for deletion', { id });
      throw new Error(JSON.stringify([{ field: 'id', message: 'Launch not found' }]));
    }

    this.launches.delete(id);
    logger.info('LaunchService', 'Launch deleted', { id });
  }
}

export const launchService = new LaunchService();
