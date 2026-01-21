import type { CreateRocketRequest, Rocket, RocketRange, UpdateRocketRequest, ValidationError } from '../types/rocket.js';
import { logger } from '../utils/logger.js';

const VALID_RANGES: readonly RocketRange[] = ['suborbital', 'orbital', 'moon', 'mars'] as const;
const MIN_CAPACITY = 1;
const MAX_CAPACITY = 10;
const ROCKET_NOT_FOUND_ERROR = 'Rocket not found';

class RocketService {
  private rockets: Map<string, Rocket> = new Map();
  private nextId = 1;

  private generateId(): string {
    return `rocket-${this.nextId++}`;
  }

  validateRocketData(data: Partial<CreateRocketRequest>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (data.name === undefined || data.name === null || data.name.trim() === '') {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    if (data.range === undefined || data.range === null) {
      errors.push({ field: 'range', message: 'Range is required' });
    } else if (!VALID_RANGES.includes(data.range)) {
      errors.push({ 
        field: 'range', 
        message: `Range must be one of: ${VALID_RANGES.join(', ')}` 
      });
    }

    if (data.capacity === undefined || data.capacity === null) {
      errors.push({ field: 'capacity', message: 'Capacity is required' });
    } else if (!Number.isInteger(data.capacity) || data.capacity < MIN_CAPACITY || data.capacity > MAX_CAPACITY) {
      errors.push({ 
        field: 'capacity', 
        message: `Capacity must be an integer between ${MIN_CAPACITY} and ${MAX_CAPACITY} (inclusive)` 
      });
    }

    return errors;
  }

  createRocket(data: CreateRocketRequest): Rocket {
    logger.info('RocketService', 'Creating rocket', { name: data.name });
    const errors = this.validateRocketData(data);
    if (errors.length > 0) {
      logger.error('RocketService', 'Validation failed', { errors });
      throw new Error(JSON.stringify(errors));
    }

    const rocket: Rocket = {
      id: this.generateId(),
      name: data.name.trim(),
      range: data.range,
      capacity: data.capacity,
    };

    this.rockets.set(rocket.id, rocket);
    logger.info('RocketService', 'Rocket created', { id: rocket.id });
    return rocket;
  }

  getAllRockets(): Rocket[] {
    logger.info('RocketService', 'Getting all rockets');
    const rockets = Array.from(this.rockets.values());
    logger.info('RocketService', 'Retrieved all rockets', { count: rockets.length });
    return rockets;
  }

  getRocketById(id: string): Rocket | undefined {
    logger.info('RocketService', 'Getting rocket by id', { id });
    const rocket = this.rockets.get(id);
    if (rocket) {
      logger.info('RocketService', 'Rocket found', { id });
    } else {
      logger.warn('RocketService', 'Rocket not found', { id });
    }
    return rocket;
  }

  updateRocket(id: string, data: UpdateRocketRequest): Rocket {
    logger.info('RocketService', 'Updating rocket', { id });
    const existingRocket = this.rockets.get(id);
    if (!existingRocket) {
      logger.error('RocketService', 'Rocket not found for update', { id });
      throw new Error(ROCKET_NOT_FOUND_ERROR);
    }

    const updatedData: CreateRocketRequest = {
      name: data.name ?? existingRocket.name,
      range: data.range ?? existingRocket.range,
      capacity: data.capacity ?? existingRocket.capacity,
    };

    const errors = this.validateRocketData(updatedData);
    if (errors.length > 0) {
      logger.error('RocketService', 'Validation failed on update', { errors });
      throw new Error(JSON.stringify(errors));
    }

    const updatedRocket: Rocket = {
      ...existingRocket,
      name: updatedData.name.trim(),
      range: updatedData.range,
      capacity: updatedData.capacity,
    };

    this.rockets.set(id, updatedRocket);
    logger.info('RocketService', 'Rocket updated', { id });
    return updatedRocket;
  }

  deleteRocket(id: string): boolean {
    logger.info('RocketService', 'Deleting rocket', { id });
    const deleted = this.rockets.delete(id);
    if (deleted) {
      logger.info('RocketService', 'Rocket deleted', { id });
    } else {
      logger.warn('RocketService', 'Rocket not found for deletion', { id });
    }
    return deleted;
  }
}

export const rocketService = new RocketService();
