import type { Rocket, CreateRocketRequest, UpdateRocketRequest, ValidationError } from '../types/rocket.js';

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

    const validRanges: string[] = ['suborbital', 'orbital', 'moon', 'mars'];
    if (data.range === undefined || data.range === null) {
      errors.push({ field: 'range', message: 'Range is required' });
    } else if (!validRanges.includes(data.range)) {
      errors.push({ 
        field: 'range', 
        message: `Range must be one of: ${validRanges.join(', ')}` 
      });
    }

    if (data.capacity === undefined || data.capacity === null) {
      errors.push({ field: 'capacity', message: 'Capacity is required' });
    } else if (!Number.isInteger(data.capacity) || data.capacity < 1 || data.capacity > 10) {
      errors.push({ 
        field: 'capacity', 
        message: 'Capacity must be an integer between 1 and 10 (inclusive)' 
      });
    }

    return errors;
  }

  createRocket(data: CreateRocketRequest): Rocket {
    const errors = this.validateRocketData(data);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    const rocket: Rocket = {
      id: this.generateId(),
      name: data.name.trim(),
      range: data.range,
      capacity: data.capacity,
    };

    this.rockets.set(rocket.id, rocket);
    return rocket;
  }

  getAllRockets(): Rocket[] {
    return Array.from(this.rockets.values());
  }

  getRocketById(id: string): Rocket | undefined {
    return this.rockets.get(id);
  }

  updateRocket(id: string, data: UpdateRocketRequest): Rocket {
    const existingRocket = this.rockets.get(id);
    if (!existingRocket) {
      throw new Error('Rocket not found');
    }

    const updatedData: CreateRocketRequest = {
      name: data.name ?? existingRocket.name,
      range: data.range ?? existingRocket.range,
      capacity: data.capacity ?? existingRocket.capacity,
    };

    const errors = this.validateRocketData(updatedData);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    const updatedRocket: Rocket = {
      ...existingRocket,
      name: updatedData.name.trim(),
      range: updatedData.range,
      capacity: updatedData.capacity,
    };

    this.rockets.set(id, updatedRocket);
    return updatedRocket;
  }

  deleteRocket(id: string): boolean {
    return this.rockets.delete(id);
  }
}

export const rocketService = new RocketService();
