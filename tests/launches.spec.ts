import { expect, test } from '@playwright/test';

test.describe('Launches API - Acceptance Criteria', () => {
  // Helper function to create a test rocket
  async function createTestRocket(request: any, capacity: number = 10) {
    const response = await request.post('/rockets', {
      data: {
        name: `Test Rocket ${Date.now()}`,
        range: 'orbital',
        capacity
      }
    });
    expect(response.status()).toBe(201);
    return await response.json();
  }

  // Helper function to create a valid launch date (1 day in the future)
  function getFutureLaunchDate(daysFromNow: number = 1): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  }

  // Helper function to get a past date
  function getPastLaunchDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString();
  }

  test.describe('POST /launches', () => {
    test('should create a launch with valid data and return 201 with availableSeats initialized', async ({ request }) => {
      // Arrange: Create a test rocket
      const rocket = await createTestRocket(request, 10);

      // Act: Create launch
      const response = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(),
          price: 50000,
          minPassengers: 5
        }
      });

      // Assert
      expect(response.status()).toBe(201);
      const launch = await response.json();
      expect(launch).toHaveProperty('id');
      expect(launch).toHaveProperty('rocketId', rocket.id);
      expect(launch).toHaveProperty('launchDateTime');
      expect(launch).toHaveProperty('price', 50000);
      expect(launch).toHaveProperty('minPassengers', 5);
      expect(launch).toHaveProperty('availableSeats', rocket.capacity);
    });

    test('should return 400 when rocketId does not exist', async ({ request }) => {
      // Act: Create launch with non-existent rocket
      const response = await request.post('/launches', {
        data: {
          rocketId: 'non-existent-rocket-id',
          launchDateTime: getFutureLaunchDate(),
          price: 50000,
          minPassengers: 5
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const rocketIdError = error.errors.find((e: any) => e.field === 'rocketId');
      expect(rocketIdError).toBeDefined();
      expect(rocketIdError.message).toContain('Rocket');
    });

    test('should return 400 when launchDateTime is missing', async ({ request }) => {
      // Arrange
      const rocket = await createTestRocket(request);

      // Act: Create launch without launchDateTime
      const response = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          price: 50000,
          minPassengers: 5
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const dateError = error.errors.find((e: any) => e.field === 'launchDateTime');
      expect(dateError).toBeDefined();
    });

    test('should return 400 when launchDateTime is in the past', async ({ request }) => {
      // Arrange
      const rocket = await createTestRocket(request);

      // Act: Create launch with past date
      const response = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getPastLaunchDate(),
          price: 50000,
          minPassengers: 5
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const dateError = error.errors.find((e: any) => e.field === 'launchDateTime');
      expect(dateError).toBeDefined();
      expect(dateError.message).toContain('future');
    });

    test('should return 400 when launchDateTime is malformed', async ({ request }) => {
      // Arrange
      const rocket = await createTestRocket(request);

      // Act: Create launch with invalid date format
      const response = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: 'not-a-valid-date',
          price: 50000,
          minPassengers: 5
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const dateError = error.errors.find((e: any) => e.field === 'launchDateTime');
      expect(dateError).toBeDefined();
    });

    test('should return 400 when price is zero', async ({ request }) => {
      // Arrange
      const rocket = await createTestRocket(request);

      // Act: Create launch with price = 0
      const response = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(),
          price: 0,
          minPassengers: 5
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const priceError = error.errors.find((e: any) => e.field === 'price');
      expect(priceError).toBeDefined();
      expect(priceError.message).toContain('positive');
    });

    test('should return 400 when price is negative', async ({ request }) => {
      // Arrange
      const rocket = await createTestRocket(request);

      // Act: Create launch with negative price
      const response = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(),
          price: -100,
          minPassengers: 5
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const priceError = error.errors.find((e: any) => e.field === 'price');
      expect(priceError).toBeDefined();
      expect(priceError.message).toContain('positive');
    });

    test('should return 400 when minPassengers is less than 1', async ({ request }) => {
      // Arrange
      const rocket = await createTestRocket(request);

      // Act: Create launch with minPassengers = 0
      const response = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(),
          price: 50000,
          minPassengers: 0
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const minPassengersError = error.errors.find((e: any) => e.field === 'minPassengers');
      expect(minPassengersError).toBeDefined();
      expect(minPassengersError.message).toContain('between 1 and');
    });

    test('should return 400 when minPassengers exceeds rocket capacity', async ({ request }) => {
      // Arrange: Create rocket with capacity of 5
      const rocket = await createTestRocket(request, 5);

      // Act: Create launch with minPassengers > capacity
      const response = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(),
          price: 50000,
          minPassengers: 6
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const minPassengersError = error.errors.find((e: any) => e.field === 'minPassengers');
      expect(minPassengersError).toBeDefined();
      expect(minPassengersError.message).toContain('between 1 and');
    });
  });

  test.describe('GET /launches', () => {
    test('should return 200 with array of all launch schedules', async ({ request }) => {
      // Arrange: Create a rocket and a launch
      const rocket = await createTestRocket(request);
      await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(),
          price: 50000,
          minPassengers: 5
        }
      });

      // Act: Get all launches
      const response = await request.get('/launches');

      // Assert
      expect(response.status()).toBe(200);
      const launches = await response.json();
      expect(Array.isArray(launches)).toBe(true);
      expect(launches.length).toBeGreaterThan(0);
      expect(launches[0]).toHaveProperty('id');
      expect(launches[0]).toHaveProperty('rocketId');
      expect(launches[0]).toHaveProperty('launchDateTime');
      expect(launches[0]).toHaveProperty('price');
      expect(launches[0]).toHaveProperty('minPassengers');
      expect(launches[0]).toHaveProperty('availableSeats');
    });
  });

  test.describe('GET /launches/:id', () => {
    test('should return 200 with launch schedule when id exists', async ({ request }) => {
      // Arrange: Create a rocket and a launch
      const rocket = await createTestRocket(request);
      const createResponse = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(),
          price: 75000,
          minPassengers: 3
        }
      });
      const createdLaunch = await createResponse.json();

      // Act: Get launch by id
      const response = await request.get(`/launches/${createdLaunch.id}`);

      // Assert
      expect(response.status()).toBe(200);
      const launch = await response.json();
      expect(launch).toHaveProperty('id', createdLaunch.id);
      expect(launch).toHaveProperty('rocketId', rocket.id);
      expect(launch).toHaveProperty('launchDateTime');
      expect(launch).toHaveProperty('price', 75000);
      expect(launch).toHaveProperty('minPassengers', 3);
      expect(launch).toHaveProperty('availableSeats', rocket.capacity);
    });

    test('should return 404 when launch id does not exist', async ({ request }) => {
      // Act: Get non-existent launch
      const response = await request.get('/launches/non-existent-id');

      // Assert
      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toContain('Launch');
    });
  });

  test.describe('PUT /launches/:id', () => {
    test('should return 200 with updated launch when id exists and data is valid', async ({ request }) => {
      // Arrange: Create a rocket and a launch
      const rocket = await createTestRocket(request);
      const createResponse = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(),
          price: 50000,
          minPassengers: 5
        }
      });
      const createdLaunch = await createResponse.json();

      // Act: Update launch
      const newDateTime = getFutureLaunchDate(2);
      const response = await request.put(`/launches/${createdLaunch.id}`, {
        data: {
          launchDateTime: newDateTime,
          price: 60000,
          minPassengers: 4
        }
      });

      // Assert
      expect(response.status()).toBe(200);
      const updatedLaunch = await response.json();
      expect(updatedLaunch).toHaveProperty('id', createdLaunch.id);
      expect(updatedLaunch).toHaveProperty('rocketId', rocket.id);
      expect(updatedLaunch).toHaveProperty('launchDateTime', newDateTime);
      expect(updatedLaunch).toHaveProperty('price', 60000);
      expect(updatedLaunch).toHaveProperty('minPassengers', 4);
    });

    test('should return 400 when updating with invalid launchDateTime', async ({ request }) => {
      // Arrange: Create a rocket and a launch
      const rocket = await createTestRocket(request);
      const createResponse = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(),
          price: 50000,
          minPassengers: 5
        }
      });
      const createdLaunch = await createResponse.json();

      // Act: Update launch with past date
      const response = await request.put(`/launches/${createdLaunch.id}`, {
        data: {
          launchDateTime: getPastLaunchDate()
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
    });

    test('should return 400 when updating with invalid price', async ({ request }) => {
      // Arrange: Create a rocket and a launch
      const rocket = await createTestRocket(request);
      const createResponse = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(),
          price: 50000,
          minPassengers: 5
        }
      });
      const createdLaunch = await createResponse.json();

      // Act: Update launch with negative price
      const response = await request.put(`/launches/${createdLaunch.id}`, {
        data: {
          price: -1000
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const priceError = error.errors.find((e: any) => e.field === 'price');
      expect(priceError).toBeDefined();
    });

    test('should return 400 when updating with invalid minPassengers', async ({ request }) => {
      // Arrange: Create a rocket and a launch
      const rocket = await createTestRocket(request, 5);
      const createResponse = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(),
          price: 50000,
          minPassengers: 3
        }
      });
      const createdLaunch = await createResponse.json();

      // Act: Update launch with minPassengers exceeding capacity
      const response = await request.put(`/launches/${createdLaunch.id}`, {
        data: {
          minPassengers: 10
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const minPassengersError = error.errors.find((e: any) => e.field === 'minPassengers');
      expect(minPassengersError).toBeDefined();
    });

    test('should return 404 when updating non-existent launch', async ({ request }) => {
      // Act: Update non-existent launch
      const response = await request.put('/launches/non-existent-id', {
        data: {
          price: 60000
        }
      });

      // Assert
      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toContain('Launch');
    });
  });

  test.describe('DELETE /launches/:id', () => {
    test('should return 204 when deleting existing launch', async ({ request }) => {
      // Arrange: Create a rocket and a launch
      const rocket = await createTestRocket(request);
      const createResponse = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(),
          price: 50000,
          minPassengers: 5
        }
      });
      const createdLaunch = await createResponse.json();

      // Act: Delete launch
      const response = await request.delete(`/launches/${createdLaunch.id}`);

      // Assert
      expect(response.status()).toBe(204);
      
      // Verify launch is actually deleted
      const getResponse = await request.get(`/launches/${createdLaunch.id}`);
      expect(getResponse.status()).toBe(404);
    });

    test('should return 404 when deleting non-existent launch', async ({ request }) => {
      // Act: Delete non-existent launch
      const response = await request.delete('/launches/non-existent-id');

      // Assert
      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toContain('Launch');
    });
  });
});
