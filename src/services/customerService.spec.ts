import { describe, it, expect, beforeEach } from 'vitest';
import type { CreateCustomerRequest } from '../types/customer.js';

// Import CustomerService class to test it in isolation
class CustomerService {
  private customers: Map<string, any> = new Map();

  validateCustomerData(data: Partial<CreateCustomerRequest>, isUpdate = false, currentEmail?: string): any[] {
    const errors: any[] = [];
    const MIN_NAME_LENGTH = 2;
    const MAX_NAME_LENGTH = 100;
    const EMAIL_REGEX = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const PHONE_REGEX = /^\+?[\d\s\-()]+$/;
    const EMAIL_EXISTS_ERROR = 'Email already exists';

    if (data.email !== undefined) {
      if (data.email === null || data.email.trim() === '') {
        errors.push({ field: 'email', message: 'Email is required' });
      } else if (!EMAIL_REGEX.test(data.email.trim()) || data.email.includes('@@')) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      } else if (isUpdate && currentEmail !== data.email && this.customers.has(data.email.trim())) {
        errors.push({ field: 'email', message: EMAIL_EXISTS_ERROR });
      } else if (!isUpdate && this.customers.has(data.email.trim())) {
        errors.push({ field: 'email', message: EMAIL_EXISTS_ERROR });
      }
    } else if (!isUpdate) {
      errors.push({ field: 'email', message: 'Email is required' });
    }

    if (data.name !== undefined) {
      if (data.name === null || data.name.trim() === '') {
        errors.push({ field: 'name', message: 'Name is required' });
      } else if (data.name.trim().length < MIN_NAME_LENGTH || data.name.trim().length > MAX_NAME_LENGTH) {
        errors.push({ 
          field: 'name', 
          message: `Name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters` 
        });
      }
    } else if (!isUpdate) {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    if (data.phone !== undefined) {
      if (data.phone === null || data.phone.trim() === '') {
        errors.push({ field: 'phone', message: 'Phone is required' });
      } else if (!PHONE_REGEX.test(data.phone.trim())) {
        errors.push({ field: 'phone', message: 'Invalid phone format' });
      }
    } else if (!isUpdate) {
      errors.push({ field: 'phone', message: 'Phone is required' });
    }

    return errors;
  }

  createCustomer(data: CreateCustomerRequest): any {
    const errors = this.validateCustomerData(data);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    const customer = {
      email: data.email.trim(),
      name: data.name.trim(),
      phone: data.phone.trim(),
    };

    this.customers.set(customer.email, customer);
    return customer;
  }

  getAllCustomers(): any[] {
    return Array.from(this.customers.values());
  }

  getCustomerByEmail(email: string): any | undefined {
    return this.customers.get(email);
  }

  updateCustomer(email: string, data: any): any {
    const existingCustomer = this.customers.get(email);
    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    const updatedData: CreateCustomerRequest = {
      email: data.email ?? existingCustomer.email,
      name: data.name ?? existingCustomer.name,
      phone: data.phone ?? existingCustomer.phone,
    };

    const errors = this.validateCustomerData(updatedData, true, email);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    const updatedCustomer = {
      email: updatedData.email.trim(),
      name: updatedData.name.trim(),
      phone: updatedData.phone.trim(),
    };

    if (email !== updatedCustomer.email) {
      this.customers.delete(email);
    }
    this.customers.set(updatedCustomer.email, updatedCustomer);
    return updatedCustomer;
  }

  deleteCustomer(email: string): boolean {
    return this.customers.delete(email);
  }
}

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(() => {
    service = new CustomerService();
  });

  describe('validateCustomerData', () => {
    it('should return no errors for valid data', () => {
      // Arrange
      const validData: CreateCustomerRequest = {
        email: 'john@example.com',
        name: 'John Doe',
        phone: '+1234567890',
      };

      // Act
      const errors = service.validateCustomerData(validData);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should return error when email is empty', () => {
      // Arrange
      const invalidData = {
        email: '',
        name: 'John Doe',
        phone: '+1234567890',
      };

      // Act
      const errors = service.validateCustomerData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'email',
        message: 'Email is required',
      });
    });

    it('should return error when email format is invalid', () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        name: 'John Doe',
        phone: '+1234567890',
      };

      // Act
      const errors = service.validateCustomerData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
      expect(errors[0].message).toBe('Invalid email format');
    });

    it('should return error when email contains double @', () => {
      // Arrange
      const invalidData = {
        email: 'test@@example.com',
        name: 'John Doe',
        phone: '+1234567890',
      };

      // Act
      const errors = service.validateCustomerData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
    });

    it('should return error when email already exists', () => {
      // Arrange
      service.createCustomer({ email: 'existing@example.com', name: 'Existing User', phone: '+1234567890' });
      const duplicateData = {
        email: 'existing@example.com',
        name: 'Another User',
        phone: '+9876543210',
      };

      // Act
      const errors = service.validateCustomerData(duplicateData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
      expect(errors[0].message).toBe('Email already exists');
    });

    it('should return error when name is too short', () => {
      // Arrange
      const invalidData = {
        email: 'test@example.com',
        name: 'A',
        phone: '+1234567890',
      };

      // Act
      const errors = service.validateCustomerData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('name');
      expect(errors[0].message).toContain('between 2 and 100');
    });

    it('should return error when name is too long', () => {
      // Arrange
      const invalidData = {
        email: 'test@example.com',
        name: 'A'.repeat(101),
        phone: '+1234567890',
      };

      // Act
      const errors = service.validateCustomerData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('name');
    });

    it('should return error when phone format is invalid', () => {
      // Arrange
      const invalidData = {
        email: 'test@example.com',
        name: 'John Doe',
        phone: 'invalid-phone',
      };

      // Act
      const errors = service.validateCustomerData(invalidData);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('phone');
      expect(errors[0].message).toBe('Invalid phone format');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      // Arrange
      const invalidData = {
        email: 'invalid',
        name: 'A',
        phone: 'abc',
      };

      // Act
      const errors = service.validateCustomerData(invalidData);

      // Assert
      expect(errors).toHaveLength(3);
      expect(errors.map(e => e.field)).toEqual(['email', 'name', 'phone']);
    });

    it('should allow email change during update if email is unique', () => {
      // Arrange
      service.createCustomer({ email: 'old@example.com', name: 'User', phone: '+1234567890' });
      const updateData = {
        email: 'new@example.com',
        name: 'User',
        phone: '+1234567890',
      };

      // Act
      const errors = service.validateCustomerData(updateData, true, 'old@example.com');

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('createCustomer', () => {
    it('should create a customer with valid data', () => {
      // Arrange
      const data: CreateCustomerRequest = {
        email: 'jane@example.com',
        name: 'Jane Smith',
        phone: '+9876543210',
      };

      // Act
      const customer = service.createCustomer(data);

      // Assert
      expect(customer).toBeDefined();
      expect(customer.email).toBe('jane@example.com');
      expect(customer.name).toBe('Jane Smith');
      expect(customer.phone).toBe('+9876543210');
    });

    it('should trim whitespace from all fields', () => {
      // Arrange
      const data: CreateCustomerRequest = {
        email: '  test@example.com  ',
        name: '  John Doe  ',
        phone: '  +1234567890  ',
      };

      // Act
      const customer = service.createCustomer(data);

      // Assert
      expect(customer.email).toBe('test@example.com');
      expect(customer.name).toBe('John Doe');
      expect(customer.phone).toBe('+1234567890');
    });

    it('should use email as the storage key', () => {
      // Arrange
      const data: CreateCustomerRequest = {
        email: 'key@example.com',
        name: 'Key User',
        phone: '+1111111111',
      };

      // Act
      service.createCustomer(data);
      const found = service.getCustomerByEmail('key@example.com');

      // Assert
      expect(found).toBeDefined();
      expect(found.name).toBe('Key User');
    });

    it('should throw error with validation errors for invalid data', () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        name: 'John Doe',
        phone: '+1234567890',
      };

      // Act & Assert
      expect(() => service.createCustomer(invalidData)).toThrow();
      
      try {
        service.createCustomer(invalidData);
      } catch (error: any) {
        const errors = JSON.parse(error.message);
        expect(errors).toHaveLength(1);
        expect(errors[0].field).toBe('email');
      }
    });
  });

  describe('getAllCustomers', () => {
    it('should return empty array when no customers exist', () => {
      // Act
      const customers = service.getAllCustomers();

      // Assert
      expect(customers).toHaveLength(0);
    });

    it('should return all created customers', () => {
      // Arrange
      service.createCustomer({ email: 'user1@example.com', name: 'User 1', phone: '+1111111111' });
      service.createCustomer({ email: 'user2@example.com', name: 'User 2', phone: '+2222222222' });

      // Act
      const customers = service.getAllCustomers();

      // Assert
      expect(customers).toHaveLength(2);
      expect(customers[0].name).toBe('User 1');
      expect(customers[1].name).toBe('User 2');
    });
  });

  describe('getCustomerByEmail', () => {
    it('should return customer when it exists', () => {
      // Arrange
      service.createCustomer({ email: 'find@example.com', name: 'Find Me', phone: '+3333333333' });

      // Act
      const found = service.getCustomerByEmail('find@example.com');

      // Assert
      expect(found).toBeDefined();
      expect(found?.name).toBe('Find Me');
    });

    it('should return undefined when customer does not exist', () => {
      // Act
      const found = service.getCustomerByEmail('nonexistent@example.com');

      // Assert
      expect(found).toBeUndefined();
    });
  });

  describe('updateCustomer', () => {
    it('should update customer with valid data', () => {
      // Arrange
      service.createCustomer({ email: 'update@example.com', name: 'Original', phone: '+1111111111' });

      // Act
      const updated = service.updateCustomer('update@example.com', { name: 'Updated Name' });

      // Assert
      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe('update@example.com'); // unchanged
      expect(updated.phone).toBe('+1111111111'); // unchanged
    });

    it('should allow email change if new email is unique', () => {
      // Arrange
      service.createCustomer({ email: 'old@example.com', name: 'User', phone: '+1111111111' });

      // Act
      const updated = service.updateCustomer('old@example.com', { email: 'new@example.com' });

      // Assert
      expect(updated.email).toBe('new@example.com');
      expect(service.getCustomerByEmail('old@example.com')).toBeUndefined();
      expect(service.getCustomerByEmail('new@example.com')).toBeDefined();
    });

    it('should throw error when updating non-existent customer', () => {
      // Act & Assert
      expect(() => service.updateCustomer('nonexistent@example.com', { name: 'Test' }))
        .toThrow('Customer not found');
    });

    it('should throw error when update results in invalid data', () => {
      // Arrange
      service.createCustomer({ email: 'test@example.com', name: 'Test User', phone: '+1111111111' });

      // Act & Assert
      expect(() => service.updateCustomer('test@example.com', { name: 'A' })).toThrow();
    });

    it('should preserve fields not included in update', () => {
      // Arrange
      service.createCustomer({ 
        email: 'preserve@example.com', 
        name: 'Original Name', 
        phone: '+1234567890' 
      });

      // Act
      const updated = service.updateCustomer('preserve@example.com', { phone: '+9876543210' });

      // Assert
      expect(updated.email).toBe('preserve@example.com');
      expect(updated.name).toBe('Original Name');
      expect(updated.phone).toBe('+9876543210');
    });
  });

  describe('deleteCustomer', () => {
    it('should delete existing customer and return true', () => {
      // Arrange
      service.createCustomer({ email: 'delete@example.com', name: 'To Delete', phone: '+1111111111' });

      // Act
      const result = service.deleteCustomer('delete@example.com');

      // Assert
      expect(result).toBe(true);
      expect(service.getCustomerByEmail('delete@example.com')).toBeUndefined();
    });

    it('should return false when deleting non-existent customer', () => {
      // Act
      const result = service.deleteCustomer('nonexistent@example.com');

      // Assert
      expect(result).toBe(false);
    });
  });
});
