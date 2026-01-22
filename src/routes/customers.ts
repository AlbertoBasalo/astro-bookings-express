import { Router, type Request, type Response } from 'express';
import { customerService } from '../services/customerService.js';
import type { CreateCustomerRequest, UpdateCustomerRequest, ValidationError } from '../types/customer.js';
import { logger } from '../utils/logger.js';

const router = Router();

const extractEmail = (params: Request['params'], key: string): string => {
  const value = params[key];
  const email = Array.isArray(value) ? value[0] : value;
  return decodeURIComponent(email);
};

const handleValidationError = (error: Error, res: Response): void => {
  try {
    const validationErrors = JSON.parse(error.message) as ValidationError[];
    res.status(400).json({ errors: validationErrors });
  } catch {
    res.status(400).json({ error: error.message });
  }
};

const handleServiceError = (error: unknown, res: Response): void => {
  if (error instanceof Error) {
    if (error.message === 'Customer not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    handleValidationError(error, res);
  } else {
    res.status(400).json({ error: 'Invalid request' });
  }
};

router.post('/', (req: Request, res: Response) => {
  logger.info('Routes', 'POST /customers');
  try {
    const data = req.body as CreateCustomerRequest;
    const customer = customerService.createCustomer(data);
    logger.info('Routes', 'POST /customers - Created', { email: customer.email });
    res.status(201).json(customer);
  } catch (error) {
    logger.error('Routes', 'POST /customers - Failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    handleServiceError(error, res);
  }
});

router.get('/', (req: Request, res: Response) => {
  logger.info('Routes', 'GET /customers');
  const customers = customerService.getAllCustomers();
  logger.info('Routes', 'GET /customers - Success', { count: customers.length });
  res.status(200).json(customers);
});

router.get('/:email', (req: Request, res: Response) => {
  const email = extractEmail(req.params, 'email');
  logger.info('Routes', `GET /customers/${email}`);
  const customer = customerService.getCustomerByEmail(email);

  if (!customer) {
    logger.warn('Routes', `GET /customers/${email} - Not found`);
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  logger.info('Routes', `GET /customers/${email} - Success`);
  res.status(200).json(customer);
});

router.put('/:email', (req: Request, res: Response) => {
  try {
    const email = extractEmail(req.params, 'email');
    logger.info('Routes', `PUT /customers/${email}`);
    const data = req.body as UpdateCustomerRequest;
    const customer = customerService.updateCustomer(email, data);
    logger.info('Routes', `PUT /customers/${email} - Updated`);
    res.status(200).json(customer);
  } catch (error) {
    logger.error('Routes', 'PUT /customers/:email - Failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    handleServiceError(error, res);
  }
});

router.delete('/:email', (req: Request, res: Response) => {
  const email = extractEmail(req.params, 'email');
  logger.info('Routes', `DELETE /customers/${email}`);
  const deleted = customerService.deleteCustomer(email);

  if (!deleted) {
    logger.warn('Routes', `DELETE /customers/${email} - Not found`);
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  logger.info('Routes', `DELETE /customers/${email} - Deleted`);
  res.status(204).send();
});

export { router as customersRouter };
