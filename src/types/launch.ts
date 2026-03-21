export type LaunchStatus = 'scheduled' | 'confirmed' | 'suspended' | 'successful' | 'cancelled';

export interface Launch {
  id: string;
  rocketId: string;
  launchDateTime: string;
  price: number;
  minPassengers: number;
  availableSeats: number;
  status: LaunchStatus;
  statusUpdatedAt: string;
}

export interface CreateLaunchRequest {
  rocketId: string;
  launchDateTime: string;
  price: number;
  minPassengers: number;
}

export interface UpdateLaunchRequest extends Partial<Omit<CreateLaunchRequest, 'rocketId'>> {
  availableSeats?: number;
}

export interface TransitionLaunchRequest {
  targetStatus: LaunchStatus;
  reason?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}
