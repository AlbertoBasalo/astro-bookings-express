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

  test.describe('PUT /launches/:id/status lifecycle transitions', () => {
    async function createLifecycleLaunch(request: any) {
      const rocket = await createTestRocket(request, 10);
      const launchResponse = await request.post('/launches', {
        data: {
          rocketId: rocket.id,
          launchDateTime: getFutureLaunchDate(3),
          price: 55000,
          minPassengers: 2
        }
      });

      expect(launchResponse.status()).toBe(201);
      const launch = await launchResponse.json();
      return { rocket, launch };
    }

    async function transitionLaunchStatus(request: any, launchId: string, targetStatus: string) {
      return request.put(`/launches/${launchId}/status`, {
        data: { targetStatus }
      });
    }

    test('should create launches with initial scheduled status and include lifecycle fields in list/detail responses', async ({ request }) => {
      const { launch } = await createLifecycleLaunch(request);

      expect(launch).toHaveProperty('status', 'scheduled');
      expect(launch).toHaveProperty('statusUpdatedAt');

      const listResponse = await request.get('/launches');
      expect(listResponse.status()).toBe(200);
      const launches = await listResponse.json();
      const listedLaunch = launches.find((item: any) => item.id === launch.id);
      expect(listedLaunch).toBeDefined();
      expect(listedLaunch).toHaveProperty('status', 'scheduled');
      expect(listedLaunch).toHaveProperty('statusUpdatedAt');

      const detailResponse = await request.get(`/launches/${launch.id}`);
      expect(detailResponse.status()).toBe(200);
      const detailedLaunch = await detailResponse.json();
      expect(detailedLaunch).toHaveProperty('status', 'scheduled');
      expect(detailedLaunch).toHaveProperty('statusUpdatedAt');
    });

    test('should allow valid lifecycle transitions and persist status with updated timestamp', async ({ request }) => {
      const { launch } = await createLifecycleLaunch(request);
      const previousTimestamp = launch.statusUpdatedAt;

      const transitionResponse = await transitionLaunchStatus(request, launch.id, 'confirmed');
      expect(transitionResponse.status()).toBe(200);
      const updatedLaunch = await transitionResponse.json();

      expect(updatedLaunch).toHaveProperty('status', 'confirmed');
      expect(updatedLaunch).toHaveProperty('statusUpdatedAt');
      expect(Date.parse(updatedLaunch.statusUpdatedAt)).toBeGreaterThanOrEqual(Date.parse(previousTimestamp));

      const detailResponse = await request.get(`/launches/${launch.id}`);
      expect(detailResponse.status()).toBe(200);
      const persistedLaunch = await detailResponse.json();

      expect(persistedLaunch).toHaveProperty('status', 'confirmed');
      expect(persistedLaunch.statusUpdatedAt).toBe(updatedLaunch.statusUpdatedAt);
    });

    test('should return 400 for an invalid transition from current status', async ({ request }) => {
      const { launch } = await createLifecycleLaunch(request);

      const response = await transitionLaunchStatus(request, launch.id, 'successful');

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const statusError = error.errors.find((item: any) => item.field === 'targetStatus');
      expect(statusError).toBeDefined();
      expect(statusError.message).toContain('Invalid launch status transition');
    });

    test('should return 404 when transitioning status of a non-existent launch', async ({ request }) => {
      const response = await transitionLaunchStatus(request, 'non-existent-launch-id', 'confirmed');

      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toContain('Launch not found');
    });

    test('should reject any further transitions after launch reaches successful state', async ({ request }) => {
      const { launch } = await createLifecycleLaunch(request);

      const toConfirmed = await transitionLaunchStatus(request, launch.id, 'confirmed');
      expect(toConfirmed.status()).toBe(200);

      const toSuccessful = await transitionLaunchStatus(request, launch.id, 'successful');
      expect(toSuccessful.status()).toBe(200);

      const invalidAfterTerminal = await transitionLaunchStatus(request, launch.id, 'cancelled');
      expect(invalidAfterTerminal.status()).toBe(400);
      const error = await invalidAfterTerminal.json();
      const statusError = error.errors.find((item: any) => item.field === 'targetStatus');
      expect(statusError.message).toContain('successful -> cancelled');
    });

    test('should reject any further transitions after launch reaches cancelled state', async ({ request }) => {
      const { launch } = await createLifecycleLaunch(request);

      const toCancelled = await transitionLaunchStatus(request, launch.id, 'cancelled');
      expect(toCancelled.status()).toBe(200);

      const invalidAfterTerminal = await transitionLaunchStatus(request, launch.id, 'confirmed');
      expect(invalidAfterTerminal.status()).toBe(400);
      const error = await invalidAfterTerminal.json();
      const statusError = error.errors.find((item: any) => item.field === 'targetStatus');
      expect(statusError.message).toContain('cancelled -> confirmed');
    });
  });
});
