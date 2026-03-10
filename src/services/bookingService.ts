import type { Booking, CreateBookingRequest, UpdateBookingRequest, ValidationError } from '../types/booking.js';
import { logger } from '../utils/logger.js';
import { customerService } from './customerService.js';
import { launchService } from './launchService.js';

const BOOKING_NOT_FOUND_ERROR = 'Booking not found';
const CUSTOMER_NOT_FOUND_ERROR = 'Customer not found';
const LAUNCH_NOT_FOUND_ERROR = 'Launch not found';
const NOT_ENOUGH_SEATS_ERROR = 'Not enough available seats';
const MIN_SEATS = 1;
const MAX_SEATS = 10;

class BookingService {
  private bookings: Map<string, Booking> = new Map();
  private nextId = 1;

  private generateId(): string {
    return `booking-${this.nextId++}`;
  }

  /**
   * Calculates the total price for a booking.
   * @param seats - Number of seats booked
   * @param launchPrice - Price per seat for the launch
   * @returns Total price (seats × launch price)
   */
  private calculateTotalPrice(seats: number, launchPrice: number): number {
    return seats * launchPrice;
  }

  private getLaunchOrThrow(launchId: string) {
    const launch = launchService.getLaunchById(launchId);
    if (!launch) {
      throw new Error(LAUNCH_NOT_FOUND_ERROR);
    }
    return launch;
  }

  private throwValidationErrors(errors: ValidationError[]): never {
    throw new Error(JSON.stringify(errors));
  }

  private validateAndThrow(data: CreateBookingRequest): void {
    const errors = this.validateBookingData(data, true);
    if (errors.length > 0) {
      logger.error('BookingService', 'Validation failed', { errors });
      this.throwValidationErrors(errors);
    }
  }

  private buildUpdateData(existingBooking: Booking, data: UpdateBookingRequest): CreateBookingRequest {
    return {
      customerEmail: existingBooking.customerEmail,
      launchId: existingBooking.launchId,
      seats: data.seats ?? existingBooking.seats,
    };
  }

  private ensureSeatIncreaseIsAvailable(launchId: string, seatDifference: number): void {
    if (seatDifference <= 0) {
      return;
    }

    const launch = this.getLaunchOrThrow(launchId);
    if (seatDifference > launch.availableSeats) {
      logger.error('BookingService', 'Not enough available seats for update', {
        requested: seatDifference,
        available: launch.availableSeats,
      });
      this.throwValidationErrors([{ field: 'seats', message: NOT_ENOUGH_SEATS_ERROR }]);
    }
  }

  /**
   * Updates the available seats for a launch.
   * @param launchId - The launch ID
   * @param seatDifference - Number of seats to add (negative) or remove (positive)
   */
  private updateLaunchSeats(launchId: string, seatDifference: number): void {
    const launch = launchService.getLaunchById(launchId);
    if (!launch) {
      throw new Error(LAUNCH_NOT_FOUND_ERROR);
    }
    const updatedAvailableSeats = launch.availableSeats - seatDifference;
    launchService.updateLaunch(launch.id, { availableSeats: updatedAvailableSeats });
  }

  /**
   * Validates booking data according to business rules.
   * - Customer email must reference an existing customer
   * - Launch ID must reference an existing launch
   * - Seats must be an integer between 1 and 10
   * - Requested seats must not exceed available seats on the launch
   * @param data - Booking data to validate
   * @returns Array of validation errors (empty if valid)
   */
  private validateBookingData(data: CreateBookingRequest, validateAvailability: boolean): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate customerEmail
    if (!data.customerEmail || data.customerEmail.trim() === '') {
      errors.push({ field: 'customerEmail', message: 'Customer email is required' });
    } else {
      const customer = customerService.getCustomerByEmail(data.customerEmail.trim());
      if (!customer) {
        errors.push({ field: 'customerEmail', message: CUSTOMER_NOT_FOUND_ERROR });
      }
    }

    // Validate launchId
    if (!data.launchId || data.launchId.trim() === '') {
      errors.push({ field: 'launchId', message: 'Launch ID is required' });
    } else {
      const launch = launchService.getLaunchById(data.launchId.trim());
      if (!launch) {
        errors.push({ field: 'launchId', message: LAUNCH_NOT_FOUND_ERROR });
      }
    }

    // Validate seats
    if (data.seats === undefined || data.seats === null) {
      errors.push({ field: 'seats', message: 'Seats is required' });
    } else if (!Number.isInteger(data.seats) || data.seats < MIN_SEATS || data.seats > MAX_SEATS) {
      errors.push({ 
        field: 'seats', 
        message: `Seats must be an integer between ${MIN_SEATS} and ${MAX_SEATS}` 
      });
    }

    // Validate seat availability (only if we have valid launch and seats)
    if (
      validateAvailability &&
      data.launchId &&
      data.launchId.trim() !== '' &&
      data.seats !== undefined &&
      data.seats !== null &&
      Number.isInteger(data.seats) &&
      data.seats >= MIN_SEATS &&
      data.seats <= MAX_SEATS
    ) {
      const launch = launchService.getLaunchById(data.launchId.trim());
      if (launch && data.seats > launch.availableSeats) {
        errors.push({ field: 'seats', message: NOT_ENOUGH_SEATS_ERROR });
      }
    }

    return errors;
  }

  createBooking(data: CreateBookingRequest): Booking {
    logger.info('BookingService', 'Creating booking', { customerEmail: data.customerEmail, launchId: data.launchId });

    this.validateAndThrow(data);

    // Launch exists per validation
    const launchId = data.launchId.trim();
    const launch = this.getLaunchOrThrow(launchId);

    // Update launch available seats
    this.updateLaunchSeats(launchId, data.seats);

    const booking: Booking = {
      id: this.generateId(),
      customerEmail: data.customerEmail.trim(),
      launchId,
      seats: data.seats,
      totalPrice: this.calculateTotalPrice(data.seats, launch.price),
    };

    this.bookings.set(booking.id, booking);
    logger.info('BookingService', 'Booking created', { id: booking.id });
    return booking;
  }

  getAllBookings(): Booking[] {
    logger.info('BookingService', 'Getting all bookings');
    const bookings = Array.from(this.bookings.values());
    logger.info('BookingService', 'Retrieved all bookings', { count: bookings.length });
    return bookings;
  }

  getBookingById(id: string): Booking | undefined {
    logger.info('BookingService', 'Getting booking by id', { id });
    const booking = this.bookings.get(id);
    if (booking) {
      logger.info('BookingService', 'Booking found', { id });
    } else {
      logger.warn('BookingService', 'Booking not found', { id });
    }
    return booking;
  }

  updateBooking(id: string, data: UpdateBookingRequest): Booking {
    logger.info('BookingService', 'Updating booking', { id });

    const existingBooking = this.bookings.get(id);
    if (!existingBooking) {
      logger.error('BookingService', 'Booking not found for update', { id });
      throw new Error(BOOKING_NOT_FOUND_ERROR);
    }

    const fullData = this.buildUpdateData(existingBooking, data);

    // Calculate seat difference and check availability before validation
    const seatDifference = fullData.seats - existingBooking.seats;
    this.ensureSeatIncreaseIsAvailable(existingBooking.launchId, seatDifference);

    // Validate the complete booking data
    const errors = this.validateBookingData(fullData, false);
    if (errors.length > 0) {
      logger.error('BookingService', 'Validation failed on update', { errors });
      this.throwValidationErrors(errors);
    }

    // Update launch available seats if seats changed
    if (seatDifference !== 0) {
      this.updateLaunchSeats(existingBooking.launchId, seatDifference);
    }

    // Launch exists per validation
    const launch = this.getLaunchOrThrow(existingBooking.launchId);

    const updatedBooking: Booking = {
      ...existingBooking,
      seats: fullData.seats,
      totalPrice: this.calculateTotalPrice(fullData.seats, launch.price),
    };

    this.bookings.set(id, updatedBooking);
    logger.info('BookingService', 'Booking updated', { id });
    return updatedBooking;
  }

  deleteBooking(id: string): boolean {
    logger.info('BookingService', 'Deleting booking', { id });
    
    const booking = this.bookings.get(id);
    if (!booking) {
      logger.warn('BookingService', 'Booking not found for deletion', { id });
      return false;
    }

    // Restore seats to launch (negative seatDifference means adding back)
    this.updateLaunchSeats(booking.launchId, -booking.seats);

    const deleted = this.bookings.delete(id);
    if (deleted) {
      logger.info('BookingService', 'Booking deleted', { id });
    }
    return deleted;
  }
}

export const bookingService = new BookingService();
