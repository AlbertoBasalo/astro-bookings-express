export interface Customer {
  email: string;
  name: string;
  phone: string;
}

export interface CreateCustomerRequest {
  email: string;
  name: string;
  phone: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export interface ValidationError {
  field: string;
  message: string;
}
