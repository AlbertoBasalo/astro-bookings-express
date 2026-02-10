export interface Booking {
  id: string;
  customerEmail: string;
  launchId: string;
  seats: number;
  totalPrice: number;
}

export interface CreateBookingRequest {
  customerEmail: string;
  launchId: string;
  seats: number;
}

export interface UpdateBookingRequest extends Partial<Omit<CreateBookingRequest, 'customerEmail' | 'launchId'>> {}

export interface ValidationError {
  field: string;
  message: string;
}
