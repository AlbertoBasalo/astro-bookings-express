import { expect, test } from '@playwright/test';

test.describe('Bookings API - Acceptance Criteria', () => {
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

  // Helper function to create a test customer
  async function createTestCustomer(request: any, email?: string) {
    const uniqueSuffix = `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
    const uniqueEmail = email || `test.customer.${uniqueSuffix}@example.com`;
    const response = await request.post('/customers', {
      data: {
        email: uniqueEmail,
        name: 'Test Customer',
        phone: '+1234567890'
      }
    });
    expect(response.status()).toBe(201);
    return await response.json();
  }

  // Helper function to create a test launch
  async function createTestLaunch(request: any, rocketId: string, price: number = 10000) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const response = await request.post('/launches', {
      data: {
        rocketId,
        launchDateTime: futureDate.toISOString(),
        price,
        minPassengers: 1
      }
    });
    expect(response.status()).toBe(201);
    return await response.json();
  }

  test.describe('POST /bookings', () => {
    test('AC1: should create booking with valid data, update available seats, calculate total price, and return 201', async ({ request }) => {
      // Arrange: Create dependencies
      const rocket = await createTestRocket(request, 10);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id, 5000);
      const initialAvailableSeats = launch.availableSeats;

      // Act: Create booking
      const response = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 3
        }
      });

      // Assert
      expect(response.status()).toBe(201);
      const booking = await response.json();
      expect(booking).toHaveProperty('id');
      expect(booking.id).toMatch(/^booking-\d+$/);
      expect(booking).toHaveProperty('customerEmail', customer.email);
      expect(booking).toHaveProperty('launchId', launch.id);
      expect(booking).toHaveProperty('seats', 3);
      expect(booking).toHaveProperty('totalPrice', 15000); // 3 seats × 5000 price

      // Verify available seats were decremented
      const launchResponse = await request.get(`/launches/${launch.id}`);
      const updatedLaunch = await launchResponse.json();
      expect(updatedLaunch.availableSeats).toBe(initialAvailableSeats - 3);
    });

    test('AC2: should return 400 with error message when customer does not exist', async ({ request }) => {
      // Arrange
      const rocket = await createTestRocket(request);
      const launch = await createTestLaunch(request, rocket.id);

      // Act: Create booking with non-existent customer
      const response = await request.post('/bookings', {
        data: {
          customerEmail: 'nonexistent@example.com',
          launchId: launch.id,
          seats: 2
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const customerError = error.errors.find((e: any) => e.field === 'customerEmail');
      expect(customerError).toBeDefined();
      expect(customerError.message).toContain('Customer not found');
    });

    test('AC3: should return 400 with error message when launch does not exist', async ({ request }) => {
      // Arrange
      const customer = await createTestCustomer(request);

      // Act: Create booking with non-existent launch
      const response = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: 'non-existent-launch-id',
          seats: 2
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const launchError = error.errors.find((e: any) => e.field === 'launchId');
      expect(launchError).toBeDefined();
      expect(launchError.message).toContain('Launch not found');
    });

    test('AC4: should return 400 when seats exceed available seats on launch', async ({ request }) => {
      // Arrange: Create launch with limited capacity
      const rocket = await createTestRocket(request, 5);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id);

      // Act: Try to book more seats than available
      const response = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 6 // More than the 5 available
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const seatsError = error.errors.find((e: any) => e.field === 'seats');
      expect(seatsError).toBeDefined();
      expect(seatsError.message).toContain('Not enough available seats');
    });

    test('AC5.1: should return 400 with validation error when seats is zero', async ({ request }) => {
      // Arrange
      const rocket = await createTestRocket(request);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id);

      // Act: Create booking with zero seats
      const response = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 0
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const seatsError = error.errors.find((e: any) => e.field === 'seats');
      expect(seatsError).toBeDefined();
      expect(seatsError.message).toContain('Seats must be an integer between 1 and 10');
    });

    test('AC5.2: should return 400 with validation error when seats is negative', async ({ request }) => {
      // Arrange
      const rocket = await createTestRocket(request);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id);

      // Act: Create booking with negative seats
      const response = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: -5
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const seatsError = error.errors.find((e: any) => e.field === 'seats');
      expect(seatsError).toBeDefined();
      expect(seatsError.message).toContain('Seats must be an integer between 1 and 10');
    });

    test('AC5.3: should return 400 with validation error when seats exceeds maximum (10)', async ({ request }) => {
      // Arrange
      const rocket = await createTestRocket(request, 10); // Max capacity
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id);

      // Act: Create booking with more than 10 seats
      const response = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 11
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      const seatsError = error.errors.find((e: any) => e.field === 'seats');
      expect(seatsError).toBeDefined();
      expect(seatsError.message).toContain('Seats must be an integer between 1 and 10');
    });

    test('AC6: should return 400 with all validation errors when required fields are missing', async ({ request }) => {
      // Act: Create booking with missing fields
      const response = await request.post('/bookings', {
        data: {}
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      expect(Array.isArray(error.errors)).toBe(true);
      expect(error.errors.length).toBeGreaterThanOrEqual(3);
      
      // Verify all required fields are reported
      const fields = error.errors.map((e: any) => e.field);
      expect(fields).toContain('customerEmail');
      expect(fields).toContain('launchId');
      expect(fields).toContain('seats');
    });
  });

  test.describe('GET /bookings', () => {
    test('AC7: should return 200 with an array of all booking records including calculated total prices', async ({ request }) => {
      // Arrange: Create test data
      const rocket = await createTestRocket(request);
      const customer1 = await createTestCustomer(request);
      const customer2 = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id, 8000);

      // Create multiple bookings
      await request.post('/bookings', {
        data: {
          customerEmail: customer1.email,
          launchId: launch.id,
          seats: 2
        }
      });
      await request.post('/bookings', {
        data: {
          customerEmail: customer2.email,
          launchId: launch.id,
          seats: 3
        }
      });

      // Act: Get all bookings
      const response = await request.get('/bookings');

      // Assert
      expect(response.status()).toBe(200);
      const bookings = await response.json();
      expect(Array.isArray(bookings)).toBe(true);
      expect(bookings.length).toBeGreaterThanOrEqual(2);
      
      // Verify each booking has required properties including totalPrice
      bookings.forEach((booking: any) => {
        expect(booking).toHaveProperty('id');
        expect(booking).toHaveProperty('customerEmail');
        expect(booking).toHaveProperty('launchId');
        expect(booking).toHaveProperty('seats');
        expect(booking).toHaveProperty('totalPrice');
        expect(typeof booking.totalPrice).toBe('number');
      });
    });
  });

  test.describe('GET /bookings/:id', () => {
    test('AC8: should return 200 with booking data when booking ID exists', async ({ request }) => {
      // Arrange: Create a booking
      const rocket = await createTestRocket(request);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id, 7500);
      
      const createResponse = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 4
        }
      });
      const booking = await createResponse.json();

      // Act: Get booking by ID
      const response = await request.get(`/bookings/${booking.id}`);

      // Assert
      expect(response.status()).toBe(200);
      const retrievedBooking = await response.json();
      expect(retrievedBooking).toHaveProperty('id', booking.id);
      expect(retrievedBooking).toHaveProperty('customerEmail', customer.email);
      expect(retrievedBooking).toHaveProperty('launchId', launch.id);
      expect(retrievedBooking).toHaveProperty('seats', 4);
      expect(retrievedBooking).toHaveProperty('totalPrice', 30000); // 4 × 7500
    });

    test('AC9: should return 404 when booking ID does not exist', async ({ request }) => {
      // Act: Get non-existent booking
      const response = await request.get('/bookings/non-existent-booking-id');

      // Assert
      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error', 'Booking not found');
    });
  });

  test.describe('PUT /bookings/:id', () => {
    test('AC10: should update booking with valid seat count changes, adjust available seats, recalculate total price, and return 200', async ({ request }) => {
      // Arrange: Create a booking with 3 seats
      const rocket = await createTestRocket(request, 10);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id, 6000);
      
      const createResponse = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 3
        }
      });
      const booking = await createResponse.json();

      // Get launch state after initial booking
      const launchAfterCreate = await request.get(`/launches/${launch.id}`);
      const launchDataAfterCreate = await launchAfterCreate.json();
      const seatsAfterCreate = launchDataAfterCreate.availableSeats;

      // Act: Update booking to 5 seats (increase by 2)
      const response = await request.put(`/bookings/${booking.id}`, {
        data: {
          seats: 5
        }
      });

      // Assert
      expect(response.status()).toBe(200);
      const updatedBooking = await response.json();
      expect(updatedBooking).toHaveProperty('id', booking.id);
      expect(updatedBooking).toHaveProperty('seats', 5);
      expect(updatedBooking).toHaveProperty('totalPrice', 30000); // 5 × 6000

      // Verify available seats were adjusted correctly (decreased by 2)
      const launchAfterUpdate = await request.get(`/launches/${launch.id}`);
      const launchDataAfterUpdate = await launchAfterUpdate.json();
      expect(launchDataAfterUpdate.availableSeats).toBe(seatsAfterCreate - 2);
    });

    test('should update booking with decreased seats and restore available seats', async ({ request }) => {
      // Arrange: Create a booking with 5 seats
      const rocket = await createTestRocket(request, 10);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id, 4000);
      
      const createResponse = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 5
        }
      });
      const booking = await createResponse.json();

      // Get launch state after initial booking
      const launchAfterCreate = await request.get(`/launches/${launch.id}`);
      const launchDataAfterCreate = await launchAfterCreate.json();
      const seatsAfterCreate = launchDataAfterCreate.availableSeats;

      // Act: Update booking to 2 seats (decrease by 3)
      const response = await request.put(`/bookings/${booking.id}`, {
        data: {
          seats: 2
        }
      });

      // Assert
      expect(response.status()).toBe(200);
      const updatedBooking = await response.json();
      expect(updatedBooking).toHaveProperty('seats', 2);
      expect(updatedBooking).toHaveProperty('totalPrice', 8000); // 2 × 4000

      // Verify available seats were increased by 3
      const launchAfterUpdate = await request.get(`/launches/${launch.id}`);
      const launchDataAfterUpdate = await launchAfterUpdate.json();
      expect(launchDataAfterUpdate.availableSeats).toBe(seatsAfterCreate + 3);
    });

    test('should return 404 when updating non-existent booking', async ({ request }) => {
      // Act: Update non-existent booking
      const response = await request.put('/bookings/non-existent-id', {
        data: {
          seats: 3
        }
      });

      // Assert
      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error', 'Booking not found');
    });

    test('should return 400 when updated seats exceed available capacity', async ({ request }) => {
      // Arrange: Create a booking on a launch with limited available seats
      const rocket = await createTestRocket(request, 6);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id);
      
      // Create first booking with 3 seats (3 remaining)
      const createResponse = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 3
        }
      });
      const booking = await createResponse.json();

      // Act: Try to update to 8 seats (would need 5 more, but only 3 available)
      const response = await request.put(`/bookings/${booking.id}`, {
        data: {
          seats: 8
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      const seatsError = error.errors.find((e: any) => e.field === 'seats');
      expect(seatsError).toBeDefined();
      expect(seatsError.message).toContain('Not enough available seats');
    });
  });

  test.describe('DELETE /bookings/:id', () => {
    test('AC11: should remove booking, restore seats to launch available seats, and return 204', async ({ request }) => {
      // Arrange: Create a booking
      const rocket = await createTestRocket(request, 10);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id);
      
      const createResponse = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 4
        }
      });
      const booking = await createResponse.json();

      // Get launch state after booking
      const launchAfterCreate = await request.get(`/launches/${launch.id}`);
      const launchDataAfterCreate = await launchAfterCreate.json();
      const seatsAfterCreate = launchDataAfterCreate.availableSeats;

      // Act: Delete booking
      const response = await request.delete(`/bookings/${booking.id}`);

      // Assert
      expect(response.status()).toBe(204);

      // Verify booking was deleted
      const getResponse = await request.get(`/bookings/${booking.id}`);
      expect(getResponse.status()).toBe(404);

      // Verify available seats were restored
      const launchAfterDelete = await request.get(`/launches/${launch.id}`);
      const launchDataAfterDelete = await launchAfterDelete.json();
      expect(launchDataAfterDelete.availableSeats).toBe(seatsAfterCreate + 4);
    });

    test('should return 404 when deleting non-existent booking', async ({ request }) => {
      // Act: Delete non-existent booking
      const response = await request.delete('/bookings/non-existent-booking-id');

      // Assert
      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error', 'Booking not found');
    });
  });

  test.describe('Seat availability management', () => {
    test('AC12: booking creation should decrement launch availableSeats by booked seats', async ({ request }) => {
      // Arrange
      const rocket = await createTestRocket(request, 10);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id);
      const initialSeats = launch.availableSeats;

      // Act: Create booking with 3 seats
      const response = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 3
        }
      });

      // Assert
      expect(response.status()).toBe(201);
      
      // Verify seats were decremented
      const launchResponse = await request.get(`/launches/${launch.id}`);
      const updatedLaunch = await launchResponse.json();
      expect(updatedLaunch.availableSeats).toBe(initialSeats - 3);
    });

    test('AC13: booking deletion should increment launch availableSeats by released seats', async ({ request }) => {
      // Arrange: Create and then delete a booking
      const rocket = await createTestRocket(request, 10);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id);
      
      const createResponse = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 5
        }
      });
      const booking = await createResponse.json();

      // Get current available seats after booking
      const launchAfterBooking = await request.get(`/launches/${launch.id}`);
      const launchDataAfterBooking = await launchAfterBooking.json();
      const seatsAfterBooking = launchDataAfterBooking.availableSeats;

      // Act: Delete booking
      const deleteResponse = await request.delete(`/bookings/${booking.id}`);

      // Assert
      expect(deleteResponse.status()).toBe(204);
      
      // Verify seats were restored
      const launchAfterDelete = await request.get(`/launches/${launch.id}`);
      const updatedLaunch = await launchAfterDelete.json();
      expect(updatedLaunch.availableSeats).toBe(seatsAfterBooking + 5);
    });

    test('should prevent overbooking beyond rocket capacity', async ({ request }) => {
      // Arrange: Create launch with limited capacity
      const rocket = await createTestRocket(request, 5);
      const customer1 = await createTestCustomer(request);
      const customer2 = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id);

      // Book 3 seats (2 remaining)
      await request.post('/bookings', {
        data: {
          customerEmail: customer1.email,
          launchId: launch.id,
          seats: 3
        }
      });

      // Act: Try to book 3 more seats (exceeds available 2)
      const response = await request.post('/bookings', {
        data: {
          customerEmail: customer2.email,
          launchId: launch.id,
          seats: 3
        }
      });

      // Assert
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
      const seatsError = error.errors.find((e: any) => e.field === 'seats');
      expect(seatsError).toBeDefined();
      expect(seatsError.message).toContain('Not enough available seats');
    });
  });

  test.describe('Total price calculation', () => {
    test('should calculate totalPrice as seats × launch.price on creation', async ({ request }) => {
      // Arrange
      const rocket = await createTestRocket(request);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id, 12000);

      // Act: Create booking with 3 seats
      const response = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 3
        }
      });

      // Assert
      expect(response.status()).toBe(201);
      const booking = await response.json();
      expect(booking.totalPrice).toBe(36000); // 3 × 12000
    });

    test('should recalculate totalPrice on booking update', async ({ request }) => {
      // Arrange: Create booking
      const rocket = await createTestRocket(request);
      const customer = await createTestCustomer(request);
      const launch = await createTestLaunch(request, rocket.id, 9000);
      
      const createResponse = await request.post('/bookings', {
        data: {
          customerEmail: customer.email,
          launchId: launch.id,
          seats: 2
        }
      });
      const booking = await createResponse.json();
      expect(booking.totalPrice).toBe(18000); // 2 × 9000

      // Act: Update seats to 4
      const updateResponse = await request.put(`/bookings/${booking.id}`, {
        data: {
          seats: 4
        }
      });

      // Assert
      expect(updateResponse.status()).toBe(200);
      const updatedBooking = await updateResponse.json();
      expect(updatedBooking.totalPrice).toBe(36000); // 4 × 9000
    });
  });
});
