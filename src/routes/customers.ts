import { Router, type Request, type Response } from 'express';
import { customerService } from '../services/customerService.js';
import type { CreateCustomerRequest, UpdateCustomerRequest } from '../types/customer.js';
import { logger } from '../utils/logger.js';
import { extractDecodedParam, handleServiceError, respondNotFound } from '../utils/routeHelpers.js';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  logger.info('Routes', 'POST /customers');
  try {
    const data = req.body as CreateCustomerRequest;
    const customer = customerService.createCustomer(data);
    logger.info('Routes', 'POST /customers - Created', { email: customer.email });
    res.status(201).json(customer);
  } catch (error) {
    logger.error('Routes', 'POST /customers - Failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    handleServiceError(error, res, 'Customer not found');
  }
});

router.get('/', (req: Request, res: Response) => {
  logger.info('Routes', 'GET /customers');
  const customers = customerService.getAllCustomers();
  logger.info('Routes', 'GET /customers - Success', { count: customers.length });
  res.status(200).json(customers);
});

router.get('/:email', (req: Request, res: Response) => {
  const email = extractDecodedParam(req.params, 'email');
  logger.info('Routes', `GET /customers/${email}`);
  const customer = customerService.getCustomerByEmail(email);

  if (!customer) {
    logger.warn('Routes', `GET /customers/${email} - Not found`);
    respondNotFound(res, 'Customer not found');
    return;
  }

  logger.info('Routes', `GET /customers/${email} - Success`);
  res.status(200).json(customer);
});

router.put('/:email', (req: Request, res: Response) => {
  try {
    const email = extractDecodedParam(req.params, 'email');
    logger.info('Routes', `PUT /customers/${email}`);
    const data = req.body as UpdateCustomerRequest;
    const customer = customerService.updateCustomer(email, data);
    logger.info('Routes', `PUT /customers/${email} - Updated`);
    res.status(200).json(customer);
  } catch (error) {
    logger.error('Routes', 'PUT /customers/:email - Failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    handleServiceError(error, res, 'Customer not found');
  }
});

router.delete('/:email', (req: Request, res: Response) => {
  const email = extractDecodedParam(req.params, 'email');
  logger.info('Routes', `DELETE /customers/${email}`);
  const deleted = customerService.deleteCustomer(email);

  if (!deleted) {
    logger.warn('Routes', `DELETE /customers/${email} - Not found`);
    respondNotFound(res, 'Customer not found');
    return;
  }

  logger.info('Routes', `DELETE /customers/${email} - Deleted`);
  res.status(204).send();
});

export { router as customersRouter };
