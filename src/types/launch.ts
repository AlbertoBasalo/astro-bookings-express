export interface Launch {
  id: string;
  rocketId: string;
  launchDateTime: string;
  price: number;
  minPassengers: number;
  availableSeats: number;
}

export interface CreateLaunchRequest {
  rocketId: string;
  launchDateTime: string;
  price: number;
  minPassengers: number;
}

export interface UpdateLaunchRequest extends Partial<CreateLaunchRequest> {}

export interface ValidationError {
  field: string;
  message: string;
}
