export type RocketRange = 'suborbital' | 'orbital' | 'moon' | 'mars';

export interface Rocket {
  id: string;
  name: string;
  range: RocketRange;
  capacity: number;
}

export interface CreateRocketRequest {
  name: string;
  range: RocketRange;
  capacity: number;
}

export interface UpdateRocketRequest extends Partial<CreateRocketRequest> {}

export interface ValidationError {
  field: string;
  message: string;
}
