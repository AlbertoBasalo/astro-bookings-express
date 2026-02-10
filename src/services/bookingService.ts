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

  private calculateTotalPrice(seats: number, launchPrice: number): number {
    return seats * launchPrice;
  }

  validateBookingData(data: Partial<CreateBookingRequest>, isUpdate = false): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate customerEmail
    if (!isUpdate) {
      if (data.customerEmail === undefined || data.customerEmail === null || data.customerEmail.trim() === '') {
        errors.push({ field: 'customerEmail', message: 'Customer email is required' });
      } else {
        const customer = customerService.getCustomerByEmail(data.customerEmail.trim());
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
        const launch = launchService.getLaunchById(data.launchId.trim());
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

  createBooking(data: CreateBookingRequest): Booking {
    logger.info('BookingService', 'Creating booking', { customerEmail: data.customerEmail, launchId: data.launchId });
    const errors = this.validateBookingData(data);
    if (errors.length > 0) {
      logger.error('BookingService', 'Validation failed', { errors });
      throw new Error(JSON.stringify(errors));
    }

    const launch = launchService.getLaunchById(data.launchId.trim());
    if (!launch) {
      throw new Error(LAUNCH_NOT_FOUND_ERROR); // Should not happen after validation
    }

    // Update launch available seats
    const updatedLaunch = {
      ...launch,
      availableSeats: launch.availableSeats - data.seats,
    };
    launchService.updateLaunch(launch.id, { availableSeats: updatedLaunch.availableSeats });

    const booking: Booking = {
      id: this.generateId(),
      customerEmail: data.customerEmail.trim(),
      launchId: data.launchId.trim(),
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

    // Validate update data
    const errors = this.validateBookingData(data, true);
    if (errors.length > 0) {
      logger.error('BookingService', 'Validation failed on update', { errors });
      throw new Error(JSON.stringify(errors));
    }

    const launch = launchService.getLaunchById(existingBooking.launchId);
    if (!launch) {
      throw new Error(LAUNCH_NOT_FOUND_ERROR); // Should not happen
    }

    // Calculate seat difference and validate availability
    const newSeats = data.seats ?? existingBooking.seats;
    const seatDifference = newSeats - existingBooking.seats;

    if (seatDifference > 0 && seatDifference > launch.availableSeats) {
      logger.error('BookingService', 'Not enough available seats for update', { 
        requested: seatDifference, 
        available: launch.availableSeats 
      });
      throw new Error(JSON.stringify([{ field: 'seats', message: NOT_ENOUGH_SEATS_ERROR }]));
    }

    // Update launch available seats
    const updatedAvailableSeats = launch.availableSeats - seatDifference;
    launchService.updateLaunch(launch.id, { availableSeats: updatedAvailableSeats });

    const updatedBooking: Booking = {
      ...existingBooking,
      seats: newSeats,
      totalPrice: this.calculateTotalPrice(newSeats, launch.price),
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

    // Restore seats to launch
    const launch = launchService.getLaunchById(booking.launchId);
    if (launch) {
      const updatedAvailableSeats = launch.availableSeats + booking.seats;
      launchService.updateLaunch(launch.id, { availableSeats: updatedAvailableSeats });
    }

    const deleted = this.bookings.delete(id);
    if (deleted) {
      logger.info('BookingService', 'Booking deleted', { id });
    }
    return deleted;
  }
}

export const bookingService = new BookingService();
