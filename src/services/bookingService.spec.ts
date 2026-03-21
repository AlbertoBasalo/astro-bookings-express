import { beforeEach, describe, expect, it } from 'vitest';
import type { ValidationError } from '../types/booking.js';
import type { Launch } from '../types/launch.js';
import { bookingService } from './bookingService.js';
import { customerService } from './customerService.js';
import { launchService } from './launchService.js';
import { rocketService } from './rocketService.js';

const parseValidationErrors = (error: unknown): ValidationError[] => {
  if (!(error instanceof Error)) {
    return [];
  }

  return JSON.parse(error.message) as ValidationError[];
};

const getFutureDateIso = (): string => {
  const future = new Date();
  future.setDate(future.getDate() + 7);
  return future.toISOString();
};

describe('bookingService launch eligibility', () => {
  beforeEach(() => {
    const customerState = customerService as unknown as {
      customers: Map<string, unknown>;
    };
    customerState.customers = new Map();

    const rocketState = rocketService as unknown as {
      rockets: Map<string, unknown>;
      nextId: number;
    };
    rocketState.rockets = new Map();
    rocketState.nextId = 1;

    const launchState = launchService as unknown as {
      launches: Map<string, Launch>;
      nextId: number;
    };
    launchState.launches = new Map();
    launchState.nextId = 1;

    const bookingState = bookingService as unknown as {
      bookings: Map<string, unknown>;
      nextId: number;
    };
    bookingState.bookings = new Map();
    bookingState.nextId = 1;
  });

  it('creates bookings for scheduled launches', () => {
    customerService.createCustomer({
      email: 'pilot@astro.test',
      name: 'Pilot One',
      phone: '+1234567890',
    });
    const rocket = rocketService.createRocket({
      name: 'Comet',
      range: 'orbital',
      capacity: 6,
    });
    const launch = launchService.createLaunch({
      rocketId: rocket.id,
      launchDateTime: getFutureDateIso(),
      price: 2000,
      minPassengers: 2,
    });

    const booking = bookingService.createBooking({
      customerEmail: 'pilot@astro.test',
      launchId: launch.id,
      seats: 2,
    });

    expect(booking.id).toBe('booking-1');
    expect(booking.totalPrice).toBe(4000);
  });

  it('creates bookings for confirmed launches', () => {
    customerService.createCustomer({
      email: 'operator@astro.test',
      name: 'Operator',
      phone: '+19876543210',
    });
    const rocket = rocketService.createRocket({
      name: 'Voyager',
      range: 'moon',
      capacity: 8,
    });
    const launch = launchService.createLaunch({
      rocketId: rocket.id,
      launchDateTime: getFutureDateIso(),
      price: 2500,
      minPassengers: 3,
    });

    launchService.transitionLaunchStatus(launch.id, { targetStatus: 'confirmed' });

    const booking = bookingService.createBooking({
      customerEmail: 'operator@astro.test',
      launchId: launch.id,
      seats: 1,
    });

    expect(booking.id).toBe('booking-1');
    expect(booking.seats).toBe(1);
  });

  it('rejects booking for suspended launches', () => {
    customerService.createCustomer({
      email: 'blocked@astro.test',
      name: 'Blocked',
      phone: '+1111111111',
    });
    const rocket = rocketService.createRocket({
      name: 'Astra',
      range: 'mars',
      capacity: 9,
    });
    const launch = launchService.createLaunch({
      rocketId: rocket.id,
      launchDateTime: getFutureDateIso(),
      price: 3000,
      minPassengers: 4,
    });

    launchService.transitionLaunchStatus(launch.id, { targetStatus: 'confirmed' });
    launchService.transitionLaunchStatus(launch.id, { targetStatus: 'suspended' });

    try {
      bookingService.createBooking({
        customerEmail: 'blocked@astro.test',
        launchId: launch.id,
        seats: 1,
      });
      throw new Error('Expected booking creation to fail');
    } catch (error) {
      const validationErrors = parseValidationErrors(error);
      expect(validationErrors).toContainEqual({
        field: 'launchId',
        message: 'Launch is not open for new bookings',
      });
    }
  });

  it('rejects booking for successful launches', () => {
    customerService.createCustomer({
      email: 'done@astro.test',
      name: 'Done',
      phone: '+1222222222',
    });
    const rocket = rocketService.createRocket({
      name: 'Apollo',
      range: 'moon',
      capacity: 7,
    });
    const launch = launchService.createLaunch({
      rocketId: rocket.id,
      launchDateTime: getFutureDateIso(),
      price: 2600,
      minPassengers: 3,
    });

    launchService.transitionLaunchStatus(launch.id, { targetStatus: 'confirmed' });
    launchService.transitionLaunchStatus(launch.id, { targetStatus: 'successful' });

    try {
      bookingService.createBooking({
        customerEmail: 'done@astro.test',
        launchId: launch.id,
        seats: 1,
      });
      throw new Error('Expected booking creation to fail');
    } catch (error) {
      const validationErrors = parseValidationErrors(error);
      expect(validationErrors).toContainEqual({
        field: 'launchId',
        message: 'Launch is not open for new bookings',
      });
    }
  });

  it('rejects booking for cancelled launches', () => {
    customerService.createCustomer({
      email: 'cancelled@astro.test',
      name: 'Cancelled',
      phone: '+1333333333',
    });
    const rocket = rocketService.createRocket({
      name: 'Hermes',
      range: 'suborbital',
      capacity: 5,
    });
    const launch = launchService.createLaunch({
      rocketId: rocket.id,
      launchDateTime: getFutureDateIso(),
      price: 1800,
      minPassengers: 2,
    });

    launchService.transitionLaunchStatus(launch.id, { targetStatus: 'cancelled' });

    try {
      bookingService.createBooking({
        customerEmail: 'cancelled@astro.test',
        launchId: launch.id,
        seats: 1,
      });
      throw new Error('Expected booking creation to fail');
    } catch (error) {
      const validationErrors = parseValidationErrors(error);
      expect(validationErrors).toContainEqual({
        field: 'launchId',
        message: 'Launch is not open for new bookings',
      });
    }
  });
});
