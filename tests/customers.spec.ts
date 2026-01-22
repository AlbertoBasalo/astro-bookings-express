import { expect, test } from '@playwright/test';

test.describe('Customers API - Acceptance Criteria', () => {
  test.describe('POST /customers', () => {
    test('AC1: should create a new customer with valid data and return 201', async ({ request }) => {
      const response = await request.post('/customers', {
        data: {
          email: 'john.doe@example.com',
          name: 'John Doe',
          phone: '+1234567890'
        }
      });

      expect(response.status()).toBe(201);
      const customer = await response.json();
      expect(customer).toHaveProperty('email', 'john.doe@example.com');
      expect(customer).toHaveProperty('name', 'John Doe');
      expect(customer).toHaveProperty('phone', '+1234567890');
    });

    test('AC2: should return 400 when creating customer with duplicate email', async ({ request }) => {
      const customerData = {
        email: 'duplicate@example.com',
        name: 'First Customer',
        phone: '+1111111111'
      };

      // Create first customer
      await request.post('/customers', { data: customerData });

      // Try to create duplicate
      const response = await request.post('/customers', {
        data: {
          email: 'duplicate@example.com',
          name: 'Second Customer',
          phone: '+2222222222'
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const emailError = error.errors.find((e: any) => e.field === 'email');
      expect(emailError).toBeDefined();
      expect(emailError.message).toContain('Email already exists');
    });

    test('AC3: should return 400 with all validation errors for invalid data', async ({ request }) => {
      const response = await request.post('/customers', {
        data: {
          email: 'invalid-email',
          name: 'A',
          phone: 'invalid'
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      expect(error.errors.length).toBeGreaterThan(0);
      
      const fields = error.errors.map((e: any) => e.field);
      expect(fields).toContain('email');
      expect(fields).toContain('name');
    });

    test('should return 400 when email is missing', async ({ request }) => {
      const response = await request.post('/customers', {
        data: {
          name: 'Test Customer',
          phone: '+1234567890'
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      const emailError = error.errors.find((e: any) => e.field === 'email');
      expect(emailError).toBeDefined();
      expect(emailError.message).toContain('Email is required');
    });

    test('should return 400 when name is missing', async ({ request }) => {
      const response = await request.post('/customers', {
        data: {
          email: 'test@example.com',
          phone: '+1234567890'
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      const nameError = error.errors.find((e: any) => e.field === 'name');
      expect(nameError).toBeDefined();
      expect(nameError.message).toContain('Name is required');
    });

    test('should return 400 when phone is missing', async ({ request }) => {
      const response = await request.post('/customers', {
        data: {
          email: 'test@example.com',
          name: 'Test Customer'
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      const phoneError = error.errors.find((e: any) => e.field === 'phone');
      expect(phoneError).toBeDefined();
      expect(phoneError.message).toContain('Phone is required');
    });

    test('AC9: should reject invalid email formats', async ({ request }) => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test @example.com',
        'test@@example.com'
      ];

      for (const email of invalidEmails) {
        const response = await request.post('/customers', {
          data: {
            email,
            name: 'Test Customer',
            phone: '+1234567890'
          }
        });

        expect(response.status()).toBe(400);
        const error = await response.json();
        expect(error.errors.some((e: any) => e.field === 'email')).toBe(true);
      }
    });

    test('AC9: should accept valid email formats', async ({ request }) => {
      const validEmails = [
        'simple@example.com',
        'test.user@example.com',
        'test+tag@example.co.uk',
        'user123@test-domain.com'
      ];

      for (const email of validEmails) {
        const response = await request.post('/customers', {
          data: {
            email,
            name: 'Test Customer',
            phone: '+1234567890'
          }
        });

        expect(response.status()).toBe(201);
      }
    });

    test('should return 400 when name is too short', async ({ request }) => {
      const response = await request.post('/customers', {
        data: {
          email: 'short@example.com',
          name: 'A',
          phone: '+1234567890'
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      const nameError = error.errors.find((e: any) => e.field === 'name');
      expect(nameError).toBeDefined();
      expect(nameError.message).toContain('between 2 and 100 characters');
    });

    test('should return 400 when name is too long', async ({ request }) => {
      const response = await request.post('/customers', {
        data: {
          email: 'long@example.com',
          name: 'A'.repeat(101),
          phone: '+1234567890'
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      const nameError = error.errors.find((e: any) => e.field === 'name');
      expect(nameError).toBeDefined();
      expect(nameError.message).toContain('between 2 and 100 characters');
    });

    test('should accept valid phone formats', async ({ request }) => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+1 (234) 567-8900',
        '+44 20 1234 5678',
        '123-456-7890'
      ];

      for (const phone of validPhones) {
        const response = await request.post('/customers', {
          data: {
            email: `phone${Date.now()}${Math.random()}@example.com`,
            name: 'Test Customer',
            phone
          }
        });

        expect(response.status()).toBe(201);
      }
    });
  });

  test.describe('GET /customers', () => {
    test('AC4: should return 200 with array of all customer records', async ({ request }) => {
      // Create some customers first
      await request.post('/customers', {
        data: {
          email: 'customer1@example.com',
          name: 'Customer One',
          phone: '+1111111111'
        }
      });

      await request.post('/customers', {
        data: {
          email: 'customer2@example.com',
          name: 'Customer Two',
          phone: '+2222222222'
        }
      });

      const response = await request.get('/customers');

      expect(response.status()).toBe(200);
      const customers = await response.json();
      expect(Array.isArray(customers)).toBe(true);
      expect(customers.length).toBeGreaterThanOrEqual(2);
      
      const emails = customers.map((c: any) => c.email);
      expect(emails).toContain('customer1@example.com');
      expect(emails).toContain('customer2@example.com');
    });

    test('should return empty array when no customers exist', async ({ request }) => {
      const response = await request.get('/customers');

      expect(response.status()).toBe(200);
      const customers = await response.json();
      expect(Array.isArray(customers)).toBe(true);
    });
  });

  test.describe('GET /customers/:email', () => {
    test('AC5: should return 200 with customer data when email exists', async ({ request }) => {
      const customerData = {
        email: 'existing@example.com',
        name: 'Existing Customer',
        phone: '+9999999999'
      };

      // Create customer
      await request.post('/customers', { data: customerData });

      // Get customer by email
      const response = await request.get(`/customers/${encodeURIComponent(customerData.email)}`);

      expect(response.status()).toBe(200);
      const customer = await response.json();
      expect(customer).toHaveProperty('email', customerData.email);
      expect(customer).toHaveProperty('name', customerData.name);
      expect(customer).toHaveProperty('phone', customerData.phone);
    });

    test('AC6: should return 404 when email does not exist', async ({ request }) => {
      const response = await request.get('/customers/nonexistent@example.com');

      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toContain('Customer not found');
    });

    test('should handle URL-encoded emails with special characters', async ({ request }) => {
      const customerData = {
        email: 'test+special@example.com',
        name: 'Special Email Customer',
        phone: '+8888888888'
      };

      // Create customer
      await request.post('/customers', { data: customerData });

      // Get customer with encoded email
      const response = await request.get(`/customers/${encodeURIComponent(customerData.email)}`);

      expect(response.status()).toBe(200);
      const customer = await response.json();
      expect(customer.email).toBe(customerData.email);
    });
  });

  test.describe('PUT /customers/:email', () => {
    test('AC7: should update customer and return 200 with updated data', async ({ request }) => {
      const originalData = {
        email: 'update@example.com',
        name: 'Original Name',
        phone: '+1111111111'
      };

      // Create customer
      await request.post('/customers', { data: originalData });

      // Update customer
      const response = await request.put(`/customers/${encodeURIComponent(originalData.email)}`, {
        data: {
          name: 'Updated Name',
          phone: '+2222222222'
        }
      });

      expect(response.status()).toBe(200);
      const customer = await response.json();
      expect(customer).toHaveProperty('email', originalData.email);
      expect(customer).toHaveProperty('name', 'Updated Name');
      expect(customer).toHaveProperty('phone', '+2222222222');
    });

    test('should allow partial updates', async ({ request }) => {
      const originalData = {
        email: 'partial@example.com',
        name: 'Original Name',
        phone: '+3333333333'
      };

      // Create customer
      await request.post('/customers', { data: originalData });

      // Update only name
      const response = await request.put(`/customers/${encodeURIComponent(originalData.email)}`, {
        data: {
          name: 'Only Name Updated'
        }
      });

      expect(response.status()).toBe(200);
      const customer = await response.json();
      expect(customer).toHaveProperty('name', 'Only Name Updated');
      expect(customer).toHaveProperty('phone', originalData.phone);
    });

    test('should return 404 when updating non-existent customer', async ({ request }) => {
      const response = await request.put('/customers/notfound@example.com', {
        data: {
          name: 'New Name'
        }
      });

      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toContain('Customer not found');
    });

    test('should return 400 when update data is invalid', async ({ request }) => {
      const originalData = {
        email: 'validate@example.com',
        name: 'Valid Customer',
        phone: '+4444444444'
      };

      // Create customer
      await request.post('/customers', { data: originalData });

      // Try to update with invalid data
      const response = await request.put(`/customers/${encodeURIComponent(originalData.email)}`, {
        data: {
          name: 'X',
          phone: 'invalid-phone'
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
    });

    test('should allow changing email to a new unique email', async ({ request }) => {
      const originalData = {
        email: 'oldemail@example.com',
        name: 'Customer Name',
        phone: '+5555555555'
      };

      // Create customer
      await request.post('/customers', { data: originalData });

      // Update email
      const response = await request.put(`/customers/${encodeURIComponent(originalData.email)}`, {
        data: {
          email: 'newemail@example.com'
        }
      });

      expect(response.status()).toBe(200);
      const customer = await response.json();
      expect(customer.email).toBe('newemail@example.com');

      // Verify old email no longer exists
      const oldResponse = await request.get(`/customers/${encodeURIComponent(originalData.email)}`);
      expect(oldResponse.status()).toBe(404);

      // Verify new email exists
      const newResponse = await request.get('/customers/newemail@example.com');
      expect(newResponse.status()).toBe(200);
    });
  });

  test.describe('DELETE /customers/:email', () => {
    test('AC8: should delete customer and return 204', async ({ request }) => {
      const customerData = {
        email: 'delete@example.com',
        name: 'To Be Deleted',
        phone: '+6666666666'
      };

      // Create customer
      await request.post('/customers', { data: customerData });

      // Delete customer
      const response = await request.delete(`/customers/${encodeURIComponent(customerData.email)}`);

      expect(response.status()).toBe(204);

      // Verify customer is deleted
      const getResponse = await request.get(`/customers/${encodeURIComponent(customerData.email)}`);
      expect(getResponse.status()).toBe(404);
    });

    test('should return 404 when deleting non-existent customer', async ({ request }) => {
      const response = await request.delete('/customers/doesnotexist@example.com');

      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toContain('Customer not found');
    });

    test('should be idempotent - deleting twice returns 404 second time', async ({ request }) => {
      const customerData = {
        email: 'idempotent@example.com',
        name: 'Idempotent Test',
        phone: '+7777777777'
      };

      // Create customer
      await request.post('/customers', { data: customerData });

      // First delete
      const firstDelete = await request.delete(`/customers/${encodeURIComponent(customerData.email)}`);
      expect(firstDelete.status()).toBe(204);

      // Second delete
      const secondDelete = await request.delete(`/customers/${encodeURIComponent(customerData.email)}`);
      expect(secondDelete.status()).toBe(404);
    });
  });
});
