import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CreateLaunchRequest } from '../types/launch.js';

// Mock RocketService for testing LaunchService in isolation
class MockRocketService {
  private rockets: Map<string, any> = new Map([
    ['rocket-1', { id: 'rocket-1', name: 'Test Rocket', range: 'orbital', capacity: 5 }],
    ['rocket-2', { id: 'rocket-2', name: 'Mars Rocket', range: 'mars', capacity: 10 }],
  ]);

  getRocketById(id: string): any | undefined {
    return this.rockets.get(id);
  }
}

// LaunchService class for testing
class LaunchService {
  private launches: Map<string, any> = new Map();
  private nextId = 1;
  private rocketService: any;

  constructor(rocketService: any) {
    this.rocketService = rocketService;
  }

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

  validateLaunchData(data: Partial<CreateLaunchRequest>): any[] {
    const errors: any[] = [];

    // Validate rocketId
    if (data.rocketId === undefined || data.rocketId === null || data.rocketId.trim() === '') {
      errors.push({ field: 'rocketId', message: 'Rocket ID is required' });
    } else {
      const rocket = this.rocketService.getRocketById(data.rocketId);
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
      const hasRocketCapacityError = errors.some(e => e.field === 'minPassengers' && e.message.includes('rocket capacity'));
      if (!hasRocketCapacityError && data.minPassengers < 1) {
        errors.push({ field: 'minPassengers', message: 'Minimum passengers must be at least 1' });
      }
    }

    return errors;
  }

  createLaunch(data: CreateLaunchRequest): any {
    const errors = this.validateLaunchData(data);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    const rocket = this.rocketService.getRocketById(data.rocketId);
    if (!rocket) {
      throw new Error('Rocket not found');
    }

    const launch = {
      id: this.generateId(),
      rocketId: data.rocketId,
      launchDateTime: data.launchDateTime,
      price: data.price,
      minPassengers: data.minPassengers,
      availableSeats: rocket.capacity,
    };

    this.launches.set(launch.id, launch);
    return launch;
  }

  getAllLaunches(): any[] {
    return Array.from(this.launches.values());
  }

  getLaunchById(id: string): any | undefined {
    return this.launches.get(id);
  }

  updateLaunch(id: string, data: any): any {
    const existingLaunch = this.launches.get(id);
    if (!existingLaunch) {
      throw new Error('Launch not found');
    }

    const updatedData: CreateLaunchRequest = {
      rocketId: existingLaunch.rocketId,
      launchDateTime: data.launchDateTime ?? existingLaunch.launchDateTime,
      price: data.price ?? existingLaunch.price,
      minPassengers: data.minPassengers ?? existingLaunch.minPassengers,
    };

    const errors = this.validateLaunchData(updatedData);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    const rocket = this.rocketService.getRocketById(existingLaunch.rocketId);
    if (!rocket) {
      throw new Error('Rocket not found');
    }

    const updatedLaunch = {
      ...existingLaunch,
      launchDateTime: updatedData.launchDateTime,
      price: updatedData.price,
      minPassengers: updatedData.minPassengers,
      availableSeats: rocket.capacity,
    };

    this.launches.set(id, updatedLaunch);
    return updatedLaunch;
  }

  deleteLaunch(id: string): boolean {
    return this.launches.delete(id);
  }
}

describe('LaunchService', () => {
  let service: LaunchService;
  let mockRocketService: MockRocketService;
  let futureDate: string;

  beforeEach(() => {
    mockRocketService = new MockRocketService();
    service = new LaunchService(mockRocketService);
    
    // Create a future date for testing
    const future = new Date();
    future.setDate(future.getDate() + 7);
    futureDate = future.toISOString();
  });

  describe('validateLaunchData', () => {
    it('should return no errors for valid data', () => {
      // Arrange
      const validData: CreateLaunchRequest = {
        rocketId: 'rocket-1',
        launchDateTime: futureDate,
        price: 1000000,
        minPassengers: 3,
      };

      // Act
      const errors = service.validateLaunchData(validData);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should return error when rocketId references non-existent rocket', () => {
      // Arrange
      const invalidData = {
        rocketId: 'non-existent-rocket',
        launchDateTime: futureDate,
        price: 1000000,
        minPassengers: 3,
      };

      // Act
      const errors = service.validateLaunchData(invalidData);

      // Assert
      expect(errors.some(e => e.field === 'rocketId' && e.message === 'Rocket reference is invalid')).toBe(true);
    });

    it('should return error when minPassengers exceeds rocket capacity', () => {
      // Arrange (rocket-1 has capacity of 5)
      const invalidData = {
        rocketId: 'rocket-1',
        launchDateTime: futureDate,
        price: 1000000,
        minPassengers: 6,
      };

      // Act
      const errors = service.validateLaunchData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('minPassengers');
      expect(errors[0].message).toContain('rocket capacity');
    });

    it('should return error when launchDateTime is in the past', () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const invalidData = {
        rocketId: 'rocket-1',
        launchDateTime: pastDate.toISOString(),
        price: 1000000,
        minPassengers: 3,
      };

      // Act
      const errors = service.validateLaunchData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('launchDateTime');
      expect(errors[0].message).toContain('must be in the future');
    });

    it('should return error when launchDateTime format is invalid', () => {
      // Arrange
      const invalidData = {
        rocketId: 'rocket-1',
        launchDateTime: '2024-13-45T99:99:99',
        price: 1000000,
        minPassengers: 3,
      };

      // Act
      const errors = service.validateLaunchData(invalidData);

      // Assert
      expect(errors.some(e => e.field === 'launchDateTime')).toBe(true);
    });

    it('should return error when price is zero', () => {
      // Arrange
      const invalidData = {
        rocketId: 'rocket-1',
        launchDateTime: futureDate,
        price: 0,
        minPassengers: 3,
      };

      // Act
      const errors = service.validateLaunchData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('price');
      expect(errors[0].message).toBe('Price must be a positive number');
    });

    it('should return error when price is negative', () => {
      // Arrange
      const invalidData = {
        rocketId: 'rocket-1',
        launchDateTime: futureDate,
        price: -1000,
        minPassengers: 3,
      };

      // Act
      const errors = service.validateLaunchData(invalidData);

      // Assert
      expect(errors.some(e => e.field === 'price')).toBe(true);
    });

    it('should return error when minPassengers is less than 1', () => {
      // Arrange
      const invalidData = {
        rocketId: 'rocket-1',
        launchDateTime: futureDate,
        price: 1000000,
        minPassengers: 0,
      };

      // Act
      const errors = service.validateLaunchData(invalidData);

      // Assert
      expect(errors.some(e => e.field === 'minPassengers')).toBe(true);
    });

    it('should return error when minPassengers is not an integer', () => {
      // Arrange
      const invalidData = {
        rocketId: 'rocket-1',
        launchDateTime: futureDate,
        price: 1000000,
        minPassengers: 3.5,
      };

      // Act
      const errors = service.validateLaunchData(invalidData);

      // Assert
      expect(errors.some(e => e.field === 'minPassengers')).toBe(true);
    });

    it('should return multiple errors for multiple invalid fields', () => {
      // Arrange
      const invalidData = {
        rocketId: '',
        launchDateTime: 'invalid-date',
        price: -100,
        minPassengers: 0,
      };

      // Act
      const errors = service.validateLaunchData(invalidData);

      // Assert
      expect(errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('createLaunch', () => {
    it('should create a launch with valid data', () => {
      // Arrange
      const data: CreateLaunchRequest = {
        rocketId: 'rocket-1',
        launchDateTime: futureDate,
        price: 2000000,
        minPassengers: 4,
      };

      // Act
      const launch = service.createLaunch(data);

      // Assert
      expect(launch).toBeDefined();
      expect(launch.id).toBe('launch-1');
      expect(launch.rocketId).toBe('rocket-1');
      expect(launch.price).toBe(2000000);
      expect(launch.minPassengers).toBe(4);
      expect(launch.availableSeats).toBe(5); // rocket-1 capacity
    });

    it('should set availableSeats to rocket capacity', () => {
      // Arrange (rocket-2 has capacity of 10)
      const data: CreateLaunchRequest = {
        rocketId: 'rocket-2',
        launchDateTime: futureDate,
        price: 5000000,
        minPassengers: 8,
      };

      // Act
      const launch = service.createLaunch(data);

      // Assert
      expect(launch.availableSeats).toBe(10);
    });

    it('should generate sequential IDs', () => {
      // Arrange
      const data1: CreateLaunchRequest = {
        rocketId: 'rocket-1',
        launchDateTime: futureDate,
        price: 1000000,
        minPassengers: 2,
      };
      const data2: CreateLaunchRequest = {
        rocketId: 'rocket-2',
        launchDateTime: futureDate,
        price: 2000000,
        minPassengers: 5,
      };

      // Act
      const launch1 = service.createLaunch(data1);
      const launch2 = service.createLaunch(data2);

      // Assert
      expect(launch1.id).toBe('launch-1');
      expect(launch2.id).toBe('launch-2');
    });

    it('should throw error with validation errors for invalid data', () => {
      // Arrange
      const invalidData = {
        rocketId: 'rocket-1',
        launchDateTime: futureDate,
        price: -1000,
        minPassengers: 3,
      };

      // Act & Assert
      expect(() => service.createLaunch(invalidData)).toThrow();
      
      try {
        service.createLaunch(invalidData);
      } catch (error: any) {
        const errors = JSON.parse(error.message);
        expect(errors.some((e: any) => e.field === 'price')).toBe(true);
      }
    });
  });

  describe('getAllLaunches', () => {
    it('should return empty array when no launches exist', () => {
      // Act
      const launches = service.getAllLaunches();

      // Assert
      expect(launches).toHaveLength(0);
    });

    it('should return all created launches', () => {
      // Arrange
      const future1 = new Date();
      future1.setDate(future1.getDate() + 7);
      const future2 = new Date();
      future2.setDate(future2.getDate() + 14);

      service.createLaunch({ 
        rocketId: 'rocket-1', 
        launchDateTime: future1.toISOString(), 
        price: 1000000, 
        minPassengers: 2 
      });
      service.createLaunch({ 
        rocketId: 'rocket-2', 
        launchDateTime: future2.toISOString(), 
        price: 2000000, 
        minPassengers: 5 
      });

      // Act
      const launches = service.getAllLaunches();

      // Assert
      expect(launches).toHaveLength(2);
    });
  });

  describe('getLaunchById', () => {
    it('should return launch when it exists', () => {
      // Arrange
      const created = service.createLaunch({ 
        rocketId: 'rocket-1', 
        launchDateTime: futureDate, 
        price: 1000000, 
        minPassengers: 3 
      });

      // Act
      const found = service.getLaunchById(created.id);

      // Assert
      expect(found).toBeDefined();
      expect(found?.rocketId).toBe('rocket-1');
    });

    it('should return undefined when launch does not exist', () => {
      // Act
      const found = service.getLaunchById('non-existent-id');

      // Assert
      expect(found).toBeUndefined();
    });
  });

  describe('updateLaunch', () => {
    it('should update launch with valid data', () => {
      // Arrange
      const created = service.createLaunch({ 
        rocketId: 'rocket-1', 
        launchDateTime: futureDate, 
        price: 1000000, 
        minPassengers: 2 
      });

      const newFuture = new Date();
      newFuture.setDate(newFuture.getDate() + 14);

      // Act
      const updated = service.updateLaunch(created.id, { 
        price: 1500000,
        launchDateTime: newFuture.toISOString()
      });

      // Assert
      expect(updated.price).toBe(1500000);
      expect(updated.launchDateTime).toBe(newFuture.toISOString());
      expect(updated.minPassengers).toBe(2); // unchanged
      expect(updated.rocketId).toBe('rocket-1'); // rocketId never changes
    });

    it('should not allow rocketId change', () => {
      // Arrange
      const created = service.createLaunch({ 
        rocketId: 'rocket-1', 
        launchDateTime: futureDate, 
        price: 1000000, 
        minPassengers: 2 
      });

      // Act
      const updated = service.updateLaunch(created.id, { rocketId: 'rocket-2' });

      // Assert
      expect(updated.rocketId).toBe('rocket-1'); // should remain original
    });

    it('should throw error when updating non-existent launch', () => {
      // Act & Assert
      expect(() => service.updateLaunch('non-existent-id', { price: 2000000 }))
        .toThrow('Launch not found');
    });

    it('should throw error when update results in invalid data', () => {
      // Arrange
      const created = service.createLaunch({ 
        rocketId: 'rocket-1', 
        launchDateTime: futureDate, 
        price: 1000000, 
        minPassengers: 3 
      });

      // Act & Assert
      expect(() => service.updateLaunch(created.id, { price: -1000 })).toThrow();
    });

    it('should preserve fields not included in update', () => {
      // Arrange
      const created = service.createLaunch({ 
        rocketId: 'rocket-1', 
        launchDateTime: futureDate, 
        price: 1000000, 
        minPassengers: 4 
      });

      // Act
      const updated = service.updateLaunch(created.id, { minPassengers: 5 });

      // Assert
      expect(updated.rocketId).toBe('rocket-1');
      expect(updated.launchDateTime).toBe(futureDate);
      expect(updated.price).toBe(1000000);
      expect(updated.minPassengers).toBe(5);
    });
  });

  describe('deleteLaunch', () => {
    it('should delete existing launch and return true', () => {
      // Arrange
      const created = service.createLaunch({ 
        rocketId: 'rocket-1', 
        launchDateTime: futureDate, 
        price: 1000000, 
        minPassengers: 2 
      });

      // Act
      const result = service.deleteLaunch(created.id);

      // Assert
      expect(result).toBe(true);
      expect(service.getLaunchById(created.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent launch', () => {
      // Act
      const result = service.deleteLaunch('non-existent-id');

      // Assert
      expect(result).toBe(false);
    });
  });
});
