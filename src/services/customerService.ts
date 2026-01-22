import type { CreateCustomerRequest, Customer, UpdateCustomerRequest, ValidationError } from '../types/customer.js';
import { logger } from '../utils/logger.js';

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const EMAIL_REGEX = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[\d\s\-()]+$/;
const CUSTOMER_NOT_FOUND_ERROR = 'Customer not found';
const EMAIL_EXISTS_ERROR = 'Email already exists';

class CustomerService {
  private customers: Map<string, Customer> = new Map();

  validateCustomerData(data: Partial<CreateCustomerRequest>, isUpdate = false, currentEmail?: string): ValidationError[] {
    const errors: ValidationError[] = [];

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

  createCustomer(data: CreateCustomerRequest): Customer {
    logger.info('CustomerService', 'Creating customer', { email: data.email });
    const errors = this.validateCustomerData(data);
    if (errors.length > 0) {
      logger.error('CustomerService', 'Validation failed', { errors });
      throw new Error(JSON.stringify(errors));
    }

    const customer: Customer = {
      email: data.email.trim(),
      name: data.name.trim(),
      phone: data.phone.trim(),
    };

    this.customers.set(customer.email, customer);
    logger.info('CustomerService', 'Customer created', { email: customer.email });
    return customer;
  }

  getAllCustomers(): Customer[] {
    logger.info('CustomerService', 'Getting all customers');
    const customers = Array.from(this.customers.values());
    logger.info('CustomerService', 'Retrieved all customers', { count: customers.length });
    return customers;
  }

  getCustomerByEmail(email: string): Customer | undefined {
    logger.info('CustomerService', 'Getting customer by email', { email });
    const customer = this.customers.get(email);
    if (customer) {
      logger.info('CustomerService', 'Customer found', { email });
    } else {
      logger.warn('CustomerService', 'Customer not found', { email });
    }
    return customer;
  }

  updateCustomer(email: string, data: UpdateCustomerRequest): Customer {
    logger.info('CustomerService', 'Updating customer', { email });
    const existingCustomer = this.customers.get(email);
    if (!existingCustomer) {
      logger.error('CustomerService', 'Customer not found for update', { email });
      throw new Error(CUSTOMER_NOT_FOUND_ERROR);
    }

    const updatedData: CreateCustomerRequest = {
      email: data.email ?? existingCustomer.email,
      name: data.name ?? existingCustomer.name,
      phone: data.phone ?? existingCustomer.phone,
    };

    const errors = this.validateCustomerData(updatedData, true, email);
    if (errors.length > 0) {
      logger.error('CustomerService', 'Validation failed on update', { errors });
      throw new Error(JSON.stringify(errors));
    }

    const updatedCustomer: Customer = {
      email: updatedData.email.trim(),
      name: updatedData.name.trim(),
      phone: updatedData.phone.trim(),
    };

    if (email !== updatedCustomer.email) {
      this.customers.delete(email);
    }
    this.customers.set(updatedCustomer.email, updatedCustomer);
    logger.info('CustomerService', 'Customer updated', { email: updatedCustomer.email });
    return updatedCustomer;
  }

  deleteCustomer(email: string): boolean {
    logger.info('CustomerService', 'Deleting customer', { email });
    const deleted = this.customers.delete(email);
    if (deleted) {
      logger.info('CustomerService', 'Customer deleted', { email });
    } else {
      logger.warn('CustomerService', 'Customer not found for deletion', { email });
    }
    return deleted;
  }
}

export const customerService = new CustomerService();
