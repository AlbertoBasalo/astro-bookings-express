import { beforeEach, describe, expect, it } from 'vitest';
import type { CreateBookingRequest, UpdateBookingRequest } from '../types/booking.js';

// Mock CustomerService for testing BookingService in isolation
class MockCustomerService {
  private customers: Map<string, any> = new Map([
    ['customer1@test.com', { email: 'customer1@test.com', name: 'Test Customer', phone: '+1234567890' }],
    ['customer2@test.com', { email: 'customer2@test.com', name: 'Another Customer', phone: '+9876543210' }],
  ]);

  getCustomerByEmail(email: string): any | undefined {
    return this.customers.get(email);
  }
}

// Mock LaunchService for testing BookingService in isolation
class MockLaunchService {
  private launches: Map<string, any> = new Map([
    ['launch-1', { id: 'launch-1', rocketId: 'rocket-1', price: 1000, availableSeats: 5 }],
    ['launch-2', { id: 'launch-2', rocketId: 'rocket-2', price: 2000, availableSeats: 10 }],
    ['launch-3', { id: 'launch-3', rocketId: 'rocket-3', price: 1500, availableSeats: 0 }],
  ]);

  getLaunchById(id: string): any | undefined {
    return this.launches.get(id);
  }

  updateLaunch(id: string, data: any): any {
    const launch = this.launches.get(id);
    if (launch) {
      const updated = { ...launch, ...data };
      this.launches.set(id, updated);
      return updated;
    }
    throw new Error('Launch not found');
  }
}

// BookingService class for testing
class BookingService {
  private bookings: Map<string, any> = new Map();
  private nextId = 1;
  private customerService: any;
  private launchService: any;

  constructor(customerService: any, launchService: any) {
    this.customerService = customerService;
    this.launchService = launchService;
  }

  private generateId(): string {
    return `booking-${this.nextId++}`;
  }

  private calculateTotalPrice(seats: number, launchPrice: number): number {
    return seats * launchPrice;
  }

  validateBookingData(data: Partial<CreateBookingRequest>, isUpdate = false): any[] {
    const errors: any[] = [];
    const MIN_SEATS = 1;
    const MAX_SEATS = 10;
    const CUSTOMER_NOT_FOUND_ERROR = 'Customer not found';
    const LAUNCH_NOT_FOUND_ERROR = 'Launch not found';
    const NOT_ENOUGH_SEATS_ERROR = 'Not enough available seats';

    // Validate customerEmail
    if (!isUpdate) {
      if (data.customerEmail === undefined || data.customerEmail === null || data.customerEmail.trim() === '') {
        errors.push({ field: 'customerEmail', message: 'Customer email is required' });
      } else {
        const customer = this.customerService.getCustomerByEmail(data.customerEmail.trim());
        if (!customer) {
          errors.push({ field: 'customerEmail', message: CUSTOMER_NOT_FOUND_ERROR });
        }
      }
    }

    // Validate launchId
    if (!isUpdate) {
      if (data.launchId === undefined || data.launchId === null || data.launchId.trim() === '') {
        errors.push({ field: 'launchId', message: 'Launch ID is required' });
      } else {
        const launch = this.launchService.getLaunchById(data.launchId.trim());
        if (!launch) {
          errors.push({ field: 'launchId', message: LAUNCH_NOT_FOUND_ERROR });
        } else if (data.seats !== undefined && data.seats !== null) {
          // Only validate seats against available if we have a valid launch
          if (Number.isInteger(data.seats) && data.seats >= MIN_SEATS && data.seats <= MAX_SEATS) {
            if (data.seats > launch.availableSeats) {
              errors.push({ field: 'seats', message: NOT_ENOUGH_SEATS_ERROR });
            }
          }
        }
      }
    }

    // Validate seats
    if (data.seats !== undefined && data.seats !== null) {
      if (!Number.isInteger(data.seats) || data.seats < MIN_SEATS || data.seats > MAX_SEATS) {
        errors.push({ 
          field: 'seats', 
          message: `Seats must be an integer between ${MIN_SEATS} and ${MAX_SEATS}` 
        });
      }
    } else if (!isUpdate) {
      errors.push({ field: 'seats', message: 'Seats is required' });
    }

    return errors;
  }

  createBooking(data: CreateBookingRequest): any {
    const errors = this.validateBookingData(data);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    const launch = this.launchService.getLaunchById(data.launchId.trim());
    if (!launch) {
      throw new Error('Launch not found');
    }

    // Update launch available seats
    const updatedAvailableSeats = launch.availableSeats - data.seats;
    this.launchService.updateLaunch(launch.id, { availableSeats: updatedAvailableSeats });

    const booking = {
      id: this.generateId(),
      customerEmail: data.customerEmail.trim(),
      launchId: data.launchId.trim(),
      seats: data.seats,
      totalPrice: this.calculateTotalPrice(data.seats, launch.price),
    };

    this.bookings.set(booking.id, booking);
    return booking;
  }

  getAllBookings(): any[] {
    return Array.from(this.bookings.values());
  }

  getBookingById(id: string): any | undefined {
    return this.bookings.get(id);
  }

  updateBooking(id: string, data: UpdateBookingRequest): any {
    const existingBooking = this.bookings.get(id);
    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    const errors = this.validateBookingData(data, true);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    const launch = this.launchService.getLaunchById(existingBooking.launchId);
    if (!launch) {
      throw new Error('Launch not found');
    }

    const newSeats = data.seats ?? existingBooking.seats;
    const seatDifference = newSeats - existingBooking.seats;

    if (seatDifference > 0 && seatDifference > launch.availableSeats) {
      throw new Error(JSON.stringify([{ field: 'seats', message: 'Not enough available seats' }]));
    }

    // Update launch available seats
    const updatedAvailableSeats = launch.availableSeats - seatDifference;
    this.launchService.updateLaunch(launch.id, { availableSeats: updatedAvailableSeats });

    const updatedBooking = {
      ...existingBooking,
      seats: newSeats,
      totalPrice: this.calculateTotalPrice(newSeats, launch.price),
    };

    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  deleteBooking(id: string): boolean {
    const booking = this.bookings.get(id);
    if (!booking) {
      return false;
    }

    const launch = this.launchService.getLaunchById(booking.launchId);
    if (launch) {
      const updatedAvailableSeats = launch.availableSeats + booking.seats;
      this.launchService.updateLaunch(launch.id, { availableSeats: updatedAvailableSeats });
    }

    return this.bookings.delete(id);
  }
}

describe('BookingService', () => {
  let bookingService: BookingService;
  let mockCustomerService: MockCustomerService;
  let mockLaunchService: MockLaunchService;

  beforeEach(() => {
    mockCustomerService = new MockCustomerService();
    mockLaunchService = new MockLaunchService();
    bookingService = new BookingService(mockCustomerService, mockLaunchService);
  });

  describe('createBooking', () => {
    it('should create a booking with valid data', () => {
      const request: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: 2,
      };

      const booking = bookingService.createBooking(request);

      expect(booking).toBeDefined();
      expect(booking.id).toBe('booking-1');
      expect(booking.customerEmail).toBe('customer1@test.com');
      expect(booking.launchId).toBe('launch-1');
      expect(booking.seats).toBe(2);
      expect(booking.totalPrice).toBe(2000); // 2 seats * 1000 price
    });

    it('should auto-increment booking IDs', () => {
      const request1: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: 1,
      };
      const request2: CreateBookingRequest = {
        customerEmail: 'customer2@test.com',
        launchId: 'launch-2',
        seats: 1,
      };

      const booking1 = bookingService.createBooking(request1);
      const booking2 = bookingService.createBooking(request2);

      expect(booking1.id).toBe('booking-1');
      expect(booking2.id).toBe('booking-2');
    });

    it('should calculate total price correctly', () => {
      const request: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-2',
        seats: 3,
      };

      const booking = bookingService.createBooking(request);

      expect(booking.totalPrice).toBe(6000); // 3 seats * 2000 price
    });

    it('should decrement launch available seats on creation', () => {
      const request: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: 2,
      };

      bookingService.createBooking(request);

      const launch = mockLaunchService.getLaunchById('launch-1');
      expect(launch.availableSeats).toBe(3); // 5 - 2
    });

    it('should throw error for non-existent customer', () => {
      const request: CreateBookingRequest = {
        customerEmail: 'nonexistent@test.com',
        launchId: 'launch-1',
        seats: 2,
      };

      expect(() => bookingService.createBooking(request)).toThrow();
      
      try {
        bookingService.createBooking(request);
      } catch (error: any) {
        const errors = JSON.parse(error.message);
        expect(errors).toContainEqual({ field: 'customerEmail', message: 'Customer not found' });
      }
    });

    it('should throw error for non-existent launch', () => {
      const request: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'nonexistent-launch',
        seats: 2,
      };

      expect(() => bookingService.createBooking(request)).toThrow();
      
      try {
        bookingService.createBooking(request);
      } catch (error: any) {
        const errors = JSON.parse(error.message);
        expect(errors).toContainEqual({ field: 'launchId', message: 'Launch not found' });
      }
    });

    it('should throw error when seats exceed available seats', () => {
      const request: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: 10, // launch-1 has only 5 available seats
      };

      expect(() => bookingService.createBooking(request)).toThrow();
      
      try {
        bookingService.createBooking(request);
      } catch (error: any) {
        const errors = JSON.parse(error.message);
        expect(errors).toContainEqual({ field: 'seats', message: 'Not enough available seats' });
      }
    });

    it('should throw error for zero seats', () => {
      const request: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: 0,
      };

      expect(() => bookingService.createBooking(request)).toThrow();
      
      try {
        bookingService.createBooking(request);
      } catch (error: any) {
        const errors = JSON.parse(error.message);
        expect(errors).toContainEqual({ field: 'seats', message: 'Seats must be an integer between 1 and 10' });
      }
    });

    it('should throw error for negative seats', () => {
      const request: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: -1,
      };

      expect(() => bookingService.createBooking(request)).toThrow();
      
      try {
        bookingService.createBooking(request);
      } catch (error: any) {
        const errors = JSON.parse(error.message);
        expect(errors).toContainEqual({ field: 'seats', message: 'Seats must be an integer between 1 and 10' });
      }
    });

    it('should throw error for seats above maximum (10)', () => {
      const request: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-2',
        seats: 11,
      };

      expect(() => bookingService.createBooking(request)).toThrow();
      
      try {
        bookingService.createBooking(request);
      } catch (error: any) {
        const errors = JSON.parse(error.message);
        expect(errors).toContainEqual({ field: 'seats', message: 'Seats must be an integer between 1 and 10' });
      }
    });

    it('should throw error for missing required fields', () => {
      const request: any = {};

      expect(() => bookingService.createBooking(request)).toThrow();
      
      try {
        bookingService.createBooking(request);
      } catch (error: any) {
        const errors = JSON.parse(error.message);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e: any) => e.field === 'customerEmail')).toBe(true);
        expect(errors.some((e: any) => e.field === 'launchId')).toBe(true);
        expect(errors.some((e: any) => e.field === 'seats')).toBe(true);
      }
    });

    it('should trim whitespace from customerEmail and launchId', () => {
      const request: CreateBookingRequest = {
        customerEmail: '  customer1@test.com  ',
        launchId: '  launch-1  ',
        seats: 1,
      };

      const booking = bookingService.createBooking(request);

      expect(booking.customerEmail).toBe('customer1@test.com');
      expect(booking.launchId).toBe('launch-1');
    });
  });

  describe('getAllBookings', () => {
    it('should return empty array when no bookings exist', () => {
      const bookings = bookingService.getAllBookings();

      expect(bookings).toEqual([]);
    });

    it('should return all bookings', () => {
      const request1: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: 1,
      };
      const request2: CreateBookingRequest = {
        customerEmail: 'customer2@test.com',
        launchId: 'launch-2',
        seats: 2,
      };

      bookingService.createBooking(request1);
      bookingService.createBooking(request2);

      const bookings = bookingService.getAllBookings();

      expect(bookings).toHaveLength(2);
      expect(bookings[0].customerEmail).toBe('customer1@test.com');
      expect(bookings[1].customerEmail).toBe('customer2@test.com');
    });
  });

  describe('getBookingById', () => {
    it('should return booking when it exists', () => {
      const request: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: 2,
      };

      const created = bookingService.createBooking(request);
      const booking = bookingService.getBookingById(created.id);

      expect(booking).toBeDefined();
      expect(booking.id).toBe(created.id);
      expect(booking.customerEmail).toBe('customer1@test.com');
    });

    it('should return undefined when booking does not exist', () => {
      const booking = bookingService.getBookingById('nonexistent-id');

      expect(booking).toBeUndefined();
    });
  });

  describe('updateBooking', () => {
    it('should update booking seats and recalculate total price', () => {
      const createRequest: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: 2,
      };
      const created = bookingService.createBooking(createRequest);

      const updateRequest: UpdateBookingRequest = {
        seats: 3,
      };
      const updated = bookingService.updateBooking(created.id, updateRequest);

      expect(updated.seats).toBe(3);
      expect(updated.totalPrice).toBe(3000); // 3 seats * 1000 price
    });

    it('should adjust launch available seats when increasing booking seats', () => {
      const createRequest: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: 2,
      };
      const created = bookingService.createBooking(createRequest);

      const updateRequest: UpdateBookingRequest = {
        seats: 4,
      };
      bookingService.updateBooking(created.id, updateRequest);

      const launch = mockLaunchService.getLaunchById('launch-1');
      expect(launch.availableSeats).toBe(1); // 5 - 4
    });

    it('should adjust launch available seats when decreasing booking seats', () => {
      const createRequest: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: 4,
      };
      const created = bookingService.createBooking(createRequest);

      const updateRequest: UpdateBookingRequest = {
        seats: 2,
      };
      bookingService.updateBooking(created.id, updateRequest);

      const launch = mockLaunchService.getLaunchById('launch-1');
      expect(launch.availableSeats).toBe(3); // 5 - 2
    });

    it('should throw error when updating non-existent booking', () => {
      const updateRequest: UpdateBookingRequest = {
        seats: 2,
      };

      expect(() => bookingService.updateBooking('nonexistent-id', updateRequest)).toThrow('Booking not found');
    });

    it('should throw error when updated seats exceed available seats', () => {
      const createRequest: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: 2,
      };
      const created = bookingService.createBooking(createRequest);

      const updateRequest: UpdateBookingRequest = {
        seats: 10, // Would need 8 more seats, but only 3 available (5-2)
      };

      expect(() => bookingService.updateBooking(created.id, updateRequest)).toThrow();
    });
  });

  describe('deleteBooking', () => {
    it('should delete booking and restore seats to launch', () => {
      const request: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-1',
        seats: 2,
      };
      const created = bookingService.createBooking(request);

      const deleted = bookingService.deleteBooking(created.id);

      expect(deleted).toBe(true);
      expect(bookingService.getBookingById(created.id)).toBeUndefined();

      const launch = mockLaunchService.getLaunchById('launch-1');
      expect(launch.availableSeats).toBe(5); // Restored to original
    });

    it('should return false when deleting non-existent booking', () => {
      const deleted = bookingService.deleteBooking('nonexistent-id');

      expect(deleted).toBe(false);
    });

    it('should restore correct number of seats after deletion', () => {
      const request: CreateBookingRequest = {
        customerEmail: 'customer1@test.com',
        launchId: 'launch-2',
        seats: 5,
      };
      const created = bookingService.createBooking(request);

      // Available seats should be 5 (10 - 5)
      let launch = mockLaunchService.getLaunchById('launch-2');
      expect(launch.availableSeats).toBe(5);

      bookingService.deleteBooking(created.id);

      // Available seats should be restored to 10
      launch = mockLaunchService.getLaunchById('launch-2');
      expect(launch.availableSeats).toBe(10);
    });
  });
});
