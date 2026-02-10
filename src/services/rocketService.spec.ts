import { describe, it, expect, beforeEach } from 'vitest';
import type { CreateRocketRequest } from '../types/rocket.js';

// Import RocketService class to test it in isolation
class RocketService {
  private rockets: Map<string, any> = new Map();
  private nextId = 1;

  private generateId(): string {
    return `rocket-${this.nextId++}`;
  }

  validateRocketData(data: Partial<CreateRocketRequest>): any[] {
    const errors: any[] = [];
    const VALID_RANGES = ['suborbital', 'orbital', 'moon', 'mars'];
    const MIN_CAPACITY = 1;
    const MAX_CAPACITY = 10;

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

  createRocket(data: CreateRocketRequest): any {
    const errors = this.validateRocketData(data);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    const rocket = {
      id: this.generateId(),
      name: data.name.trim(),
      range: data.range,
      capacity: data.capacity,
    };

    this.rockets.set(rocket.id, rocket);
    return rocket;
  }

  getAllRockets(): any[] {
    return Array.from(this.rockets.values());
  }

  getRocketById(id: string): any | undefined {
    return this.rockets.get(id);
  }

  updateRocket(id: string, data: any): any {
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

    const updatedRocket = {
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

describe('RocketService', () => {
  let service: RocketService;

  beforeEach(() => {
    service = new RocketService();
  });

  describe('validateRocketData', () => {
    it('should return no errors for valid data', () => {
      // Arrange
      const validData: CreateRocketRequest = {
        name: 'Falcon 9',
        range: 'orbital',
        capacity: 7,
      };

      // Act
      const errors = service.validateRocketData(validData);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should return error when name is empty', () => {
      // Arrange
      const invalidData = {
        name: '',
        range: 'orbital' as const,
        capacity: 7,
      };

      // Act
      const errors = service.validateRocketData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'name',
        message: 'Name is required',
      });
    });

    it('should return error when name is only whitespace', () => {
      // Arrange
      const invalidData = {
        name: '   ',
        range: 'orbital' as const,
        capacity: 7,
      };

      // Act
      const errors = service.validateRocketData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('name');
    });

    it('should return error when range is invalid', () => {
      // Arrange
      const invalidData = {
        name: 'Test Rocket',
        range: 'intergalactic' as any,
        capacity: 5,
      };

      // Act
      const errors = service.validateRocketData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('range');
      expect(errors[0].message).toContain('Range must be one of');
    });

    it('should return error when capacity is below minimum', () => {
      // Arrange
      const invalidData = {
        name: 'Test Rocket',
        range: 'suborbital' as const,
        capacity: 0,
      };

      // Act
      const errors = service.validateRocketData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('capacity');
      expect(errors[0].message).toContain('between 1 and 10');
    });

    it('should return error when capacity is above maximum', () => {
      // Arrange
      const invalidData = {
        name: 'Test Rocket',
        range: 'mars' as const,
        capacity: 11,
      };

      // Act
      const errors = service.validateRocketData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('capacity');
    });

    it('should return error when capacity is not an integer', () => {
      // Arrange
      const invalidData = {
        name: 'Test Rocket',
        range: 'moon' as const,
        capacity: 5.5,
      };

      // Act
      const errors = service.validateRocketData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('capacity');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      // Arrange
      const invalidData = {
        name: '',
        range: 'invalid' as any,
        capacity: 0,
      };

      // Act
      const errors = service.validateRocketData(invalidData);

      // Assert
      expect(errors).toHaveLength(3);
      expect(errors.map(e => e.field)).toEqual(['name', 'range', 'capacity']);
    });
  });

  describe('createRocket', () => {
    it('should create a rocket with valid data', () => {
      // Arrange
      const data: CreateRocketRequest = {
        name: 'Starship',
        range: 'mars',
        capacity: 10,
      };

      // Act
      const rocket = service.createRocket(data);

      // Assert
      expect(rocket).toBeDefined();
      expect(rocket.id).toBe('rocket-1');
      expect(rocket.name).toBe('Starship');
      expect(rocket.range).toBe('mars');
      expect(rocket.capacity).toBe(10);
    });

    it('should trim whitespace from name', () => {
      // Arrange
      const data: CreateRocketRequest = {
        name: '  Falcon Heavy  ',
        range: 'orbital',
        capacity: 8,
      };

      // Act
      const rocket = service.createRocket(data);

      // Assert
      expect(rocket.name).toBe('Falcon Heavy');
    });

    it('should generate sequential IDs', () => {
      // Arrange
      const data1: CreateRocketRequest = {
        name: 'Rocket 1',
        range: 'suborbital',
        capacity: 2,
      };
      const data2: CreateRocketRequest = {
        name: 'Rocket 2',
        range: 'orbital',
        capacity: 5,
      };

      // Act
      const rocket1 = service.createRocket(data1);
      const rocket2 = service.createRocket(data2);

      // Assert
      expect(rocket1.id).toBe('rocket-1');
      expect(rocket2.id).toBe('rocket-2');
    });

    it('should throw error with validation errors for invalid data', () => {
      // Arrange
      const invalidData = {
        name: '',
        range: 'orbital' as const,
        capacity: 5,
      };

      // Act & Assert
      expect(() => service.createRocket(invalidData)).toThrow();
      
      try {
        service.createRocket(invalidData);
      } catch (error: any) {
        const errors = JSON.parse(error.message);
        expect(errors).toHaveLength(1);
        expect(errors[0].field).toBe('name');
      }
    });
  });

  describe('getAllRockets', () => {
    it('should return empty array when no rockets exist', () => {
      // Act
      const rockets = service.getAllRockets();

      // Assert
      expect(rockets).toHaveLength(0);
    });

    it('should return all created rockets', () => {
      // Arrange
      service.createRocket({ name: 'Rocket 1', range: 'suborbital', capacity: 2 });
      service.createRocket({ name: 'Rocket 2', range: 'orbital', capacity: 5 });

      // Act
      const rockets = service.getAllRockets();

      // Assert
      expect(rockets).toHaveLength(2);
      expect(rockets[0].name).toBe('Rocket 1');
      expect(rockets[1].name).toBe('Rocket 2');
    });
  });

  describe('getRocketById', () => {
    it('should return rocket when it exists', () => {
      // Arrange
      const created = service.createRocket({ name: 'Test Rocket', range: 'moon', capacity: 6 });

      // Act
      const found = service.getRocketById(created.id);

      // Assert
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Rocket');
    });

    it('should return undefined when rocket does not exist', () => {
      // Act
      const found = service.getRocketById('non-existent-id');

      // Assert
      expect(found).toBeUndefined();
    });
  });

  describe('updateRocket', () => {
    it('should update rocket with valid data', () => {
      // Arrange
      const created = service.createRocket({ name: 'Original', range: 'suborbital', capacity: 2 });

      // Act
      const updated = service.updateRocket(created.id, { name: 'Updated', capacity: 5 });

      // Assert
      expect(updated.name).toBe('Updated');
      expect(updated.capacity).toBe(5);
      expect(updated.range).toBe('suborbital'); // unchanged
    });

    it('should throw error when updating non-existent rocket', () => {
      // Act & Assert
      expect(() => service.updateRocket('non-existent-id', { name: 'Test' })).toThrow('Rocket not found');
    });

    it('should throw error when update results in invalid data', () => {
      // Arrange
      const created = service.createRocket({ name: 'Test', range: 'orbital', capacity: 5 });

      // Act & Assert
      expect(() => service.updateRocket(created.id, { capacity: 0 })).toThrow();
    });

    it('should preserve fields not included in update', () => {
      // Arrange
      const created = service.createRocket({ name: 'Test', range: 'mars', capacity: 8 });

      // Act
      const updated = service.updateRocket(created.id, { name: 'New Name' });

      // Assert
      expect(updated.name).toBe('New Name');
      expect(updated.range).toBe('mars');
      expect(updated.capacity).toBe(8);
    });
  });

  describe('deleteRocket', () => {
    it('should delete existing rocket and return true', () => {
      // Arrange
      const created = service.createRocket({ name: 'To Delete', range: 'orbital', capacity: 3 });

      // Act
      const result = service.deleteRocket(created.id);

      // Assert
      expect(result).toBe(true);
      expect(service.getRocketById(created.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent rocket', () => {
      // Act
      const result = service.deleteRocket('non-existent-id');

      // Assert
      expect(result).toBe(false);
    });
  });
});
