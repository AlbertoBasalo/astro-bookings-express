import { expect, test } from '@playwright/test';

test.describe('Rockets API - Acceptance Criteria', () => {
  test.describe('POST /rockets', () => {
    test('should create a new rocket with valid data and return 201', async ({ request }) => {
      const response = await request.post('/rockets', {
        data: {
          name: 'Falcon Heavy',
          range: 'orbital',
          capacity: 8
        }
      });

      expect(response.status()).toBe(201);
      const rocket = await response.json();
      expect(rocket).toHaveProperty('id');
      expect(rocket).toHaveProperty('name', 'Falcon Heavy');
      expect(rocket).toHaveProperty('range', 'orbital');
      expect(rocket).toHaveProperty('capacity', 8);
    });

    test('should return 400 when name is missing', async ({ request }) => {
      const response = await request.post('/rockets', {
        data: {
          range: 'orbital',
          capacity: 5
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      expect(error.errors.some((e: any) => e.field === 'name')).toBe(true);
    });

    test('should return 400 when range is missing', async ({ request }) => {
      const response = await request.post('/rockets', {
        data: {
          name: 'Test Rocket',
          capacity: 5
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      expect(error.errors.some((e: any) => e.field === 'range')).toBe(true);
    });

    test('should return 400 when capacity is missing', async ({ request }) => {
      const response = await request.post('/rockets', {
        data: {
          name: 'Test Rocket',
          range: 'orbital'
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      expect(error.errors.some((e: any) => e.field === 'capacity')).toBe(true);
    });

    test('should return 400 when range is invalid', async ({ request }) => {
      const response = await request.post('/rockets', {
        data: {
          name: 'Test Rocket',
          range: 'invalid-range',
          capacity: 5
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const rangeError = error.errors.find((e: any) => e.field === 'range');
      expect(rangeError).toBeDefined();
      expect(rangeError.message).toContain('Range must be one of');
    });

    test('should return 400 when capacity is less than 1', async ({ request }) => {
      const response = await request.post('/rockets', {
        data: {
          name: 'Test Rocket',
          range: 'orbital',
          capacity: 0
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const capacityError = error.errors.find((e: any) => e.field === 'capacity');
      expect(capacityError).toBeDefined();
      expect(capacityError.message).toContain('Capacity must be an integer between 1 and 10');
    });

    test('should return 400 when capacity is greater than 10', async ({ request }) => {
      const response = await request.post('/rockets', {
        data: {
          name: 'Test Rocket',
          range: 'orbital',
          capacity: 11
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const capacityError = error.errors.find((e: any) => e.field === 'capacity');
      expect(capacityError).toBeDefined();
      expect(capacityError.message).toContain('Capacity must be an integer between 1 and 10');
    });
  });

  test.describe('GET /rockets', () => {
    test('should return 200 with array of all rockets', async ({ request }) => {
      // Create a rocket first
      await request.post('/rockets', {
        data: {
          name: 'Saturn V',
          range: 'moon',
          capacity: 3
        }
      });

      const response = await request.get('/rockets');
      expect(response.status()).toBe(200);
      const rockets = await response.json();
      expect(Array.isArray(rockets)).toBe(true);
      expect(rockets.length).toBeGreaterThan(0);
      expect(rockets[0]).toHaveProperty('id');
      expect(rockets[0]).toHaveProperty('name');
      expect(rockets[0]).toHaveProperty('range');
      expect(rockets[0]).toHaveProperty('capacity');
    });
  });

  test.describe('GET /rockets/:id', () => {
    test('should return 200 with rocket when id exists', async ({ request }) => {
      // Create a rocket first
      const createResponse = await request.post('/rockets', {
        data: {
          name: 'Starship',
          range: 'mars',
          capacity: 10
        }
      });
      const createdRocket = await createResponse.json();

      const response = await request.get(`/rockets/${createdRocket.id}`);
      expect(response.status()).toBe(200);
      const rocket = await response.json();
      expect(rocket).toHaveProperty('id', createdRocket.id);
      expect(rocket).toHaveProperty('name', 'Starship');
      expect(rocket).toHaveProperty('range', 'mars');
      expect(rocket).toHaveProperty('capacity', 10);
    });

    test('should return 404 when rocket id does not exist', async ({ request }) => {
      const response = await request.get('/rockets/non-existent-id');
      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error', 'Rocket not found');
    });
  });

  test.describe('PUT /rockets/:id', () => {
    test('should return 200 with updated rocket when id exists and data is valid', async ({ request }) => {
      // Create a rocket first
      const createResponse = await request.post('/rockets', {
        data: {
          name: 'New Shepard',
          range: 'suborbital',
          capacity: 6
        }
      });
      const createdRocket = await createResponse.json();

      const response = await request.put(`/rockets/${createdRocket.id}`, {
        data: {
          name: 'New Shepard Updated',
          range: 'orbital',
          capacity: 8
        }
      });

      expect(response.status()).toBe(200);
      const updatedRocket = await response.json();
      expect(updatedRocket).toHaveProperty('id', createdRocket.id);
      expect(updatedRocket).toHaveProperty('name', 'New Shepard Updated');
      expect(updatedRocket).toHaveProperty('range', 'orbital');
      expect(updatedRocket).toHaveProperty('capacity', 8);
    });

    test('should return 404 when updating non-existent rocket', async ({ request }) => {
      const response = await request.put('/rockets/non-existent-id', {
        data: {
          name: 'Test',
          range: 'orbital',
          capacity: 5
        }
      });

      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error', 'Rocket not found');
    });

    test('should return 400 when updating with invalid data', async ({ request }) => {
      // Create a rocket first
      const createResponse = await request.post('/rockets', {
        data: {
          name: 'Test Rocket',
          range: 'orbital',
          capacity: 5
        }
      });
      const createdRocket = await createResponse.json();

      const response = await request.put(`/rockets/${createdRocket.id}`, {
        data: {
          name: 'Test',
          range: 'invalid',
          capacity: 15
        }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
    });
  });

  test.describe('DELETE /rockets/:id', () => {
    test('should return 204 when deleting existing rocket', async ({ request }) => {
      // Create a rocket first
      const createResponse = await request.post('/rockets', {
        data: {
          name: 'Temporary Rocket',
          range: 'suborbital',
          capacity: 2
        }
      });
      const createdRocket = await createResponse.json();

      const response = await request.delete(`/rockets/${createdRocket.id}`);
      expect(response.status()).toBe(204);

      // Verify it's deleted
      const getResponse = await request.get(`/rockets/${createdRocket.id}`);
      expect(getResponse.status()).toBe(404);
    });

    test('should return 404 when deleting non-existent rocket', async ({ request }) => {
      const response = await request.delete('/rockets/non-existent-id');
      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error', 'Rocket not found');
    });
  });
});
