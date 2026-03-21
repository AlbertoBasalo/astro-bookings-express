import { beforeEach, describe, expect, it } from 'vitest';
import type { Launch, ValidationError } from '../types/launch.js';
import type { CreateRocketRequest } from '../types/rocket.js';
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

const createLaunchFixture = (rocket: CreateRocketRequest) => {
  const createdRocket = rocketService.createRocket(rocket);
  return launchService.createLaunch({
    rocketId: createdRocket.id,
    launchDateTime: getFutureDateIso(),
    price: 120000,
    minPassengers: 2,
  });
};

describe('launchService lifecycle', () => {
  beforeEach(() => {
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
  });

  it('sets initial status as scheduled when creating a launch', () => {
    const rocket = rocketService.createRocket({
      name: 'Falcon IX',
      range: 'orbital',
      capacity: 6,
    });

    const launch = launchService.createLaunch({
      rocketId: rocket.id,
      launchDateTime: getFutureDateIso(),
      price: 120000,
      minPassengers: 2,
    });

    expect(launch.status).toBe('scheduled');
    expect(new Date(launch.statusUpdatedAt).toString()).not.toBe('Invalid Date');
  });

  it('allows scheduled to confirmed transition and updates transition timestamp', () => {
    const rocket = rocketService.createRocket({
      name: 'Atlas Nova',
      range: 'moon',
      capacity: 8,
    });

    const launch = launchService.createLaunch({
      rocketId: rocket.id,
      launchDateTime: getFutureDateIso(),
      price: 340000,
      minPassengers: 3,
    });

    const originalTransitionTime = new Date(launch.statusUpdatedAt).getTime();

    const transitioned = launchService.transitionLaunchStatus(launch.id, {
      targetStatus: 'confirmed',
    });

    expect(transitioned.status).toBe('confirmed');
    expect(new Date(transitioned.statusUpdatedAt).getTime()).toBeGreaterThanOrEqual(originalTransitionTime);
  });

  it('rejects invalid scheduled to suspended transition', () => {
    const rocket = rocketService.createRocket({
      name: 'Mercury One',
      range: 'orbital',
      capacity: 5,
    });

    const launch = launchService.createLaunch({
      rocketId: rocket.id,
      launchDateTime: getFutureDateIso(),
      price: 250000,
      minPassengers: 2,
    });

    try {
      launchService.transitionLaunchStatus(launch.id, { targetStatus: 'suspended' });
      throw new Error('Expected transition to fail');
    } catch (error) {
      const validationErrors = parseValidationErrors(error);
      expect(validationErrors).toContainEqual({
        field: 'targetStatus',
        message: 'Invalid launch status transition: scheduled -> suspended',
      });
    }
  });

  it('rejects transitions from terminal states', () => {
    const launch = createLaunchFixture({
      name: 'Pioneer',
      range: 'mars',
      capacity: 7,
    });

    launchService.transitionLaunchStatus(launch.id, { targetStatus: 'confirmed' });
    launchService.transitionLaunchStatus(launch.id, { targetStatus: 'successful' });

    try {
      launchService.transitionLaunchStatus(launch.id, { targetStatus: 'cancelled' });
      throw new Error('Expected transition from successful to fail');
    } catch (error) {
      const validationErrors = parseValidationErrors(error);
      expect(validationErrors).toContainEqual({
        field: 'targetStatus',
        message: 'Invalid launch status transition: successful -> cancelled',
      });
    }
  });

  it('keeps lifecycle state immutable through generic updateLaunch payload', () => {
    const launch = createLaunchFixture({
      name: 'Argos',
      range: 'suborbital',
      capacity: 4,
    });

    const updated = launchService.updateLaunch(launch.id, {
      price: 110000,
      // Runtime payload guard check: service should ignore lifecycle fields in generic update.
      status: 'cancelled',
    } as unknown as { price: number; status: 'cancelled' });

    expect(updated.price).toBe(110000);
    expect(updated.status).toBe('scheduled');
  });
});
