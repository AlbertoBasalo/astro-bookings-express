import { Router, type Request, type Response } from 'express';
import { bookingService } from '../services/bookingService.js';
import type { CreateBookingRequest, UpdateBookingRequest } from '../types/booking.js';
import { logger } from '../utils/logger.js';
import { extractId, handleServiceError, respondNotFound } from '../utils/routeHelpers.js';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  logger.info('Routes', 'POST /bookings');
  try {
    const data = req.body as CreateBookingRequest;
    const booking = bookingService.createBooking(data);
    logger.info('Routes', 'POST /bookings - Created', { id: booking.id });
    res.status(201).json(booking);
  } catch (error) {
    logger.error('Routes', 'POST /bookings - Failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    handleServiceError(error, res, 'Booking not found');
  }
});

router.get('/', (req: Request, res: Response) => {
  logger.info('Routes', 'GET /bookings');
  const bookings = bookingService.getAllBookings();
  logger.info('Routes', 'GET /bookings - Success', { count: bookings.length });
  res.status(200).json(bookings);
});

router.get('/:id', (req: Request, res: Response) => {
  const id = extractId(req.params, 'id');
  logger.info('Routes', `GET /bookings/${id}`);
  const booking = bookingService.getBookingById(id);

  if (!booking) {
    logger.warn('Routes', `GET /bookings/${id} - Not found`);
    respondNotFound(res, 'Booking not found');
    return;
  }

  logger.info('Routes', `GET /bookings/${id} - Success`);
  res.status(200).json(booking);
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = extractId(req.params, 'id');
    logger.info('Routes', `PUT /bookings/${id}`);
    const data = req.body as UpdateBookingRequest;
    const booking = bookingService.updateBooking(id, data);
    logger.info('Routes', `PUT /bookings/${id} - Updated`);
    res.status(200).json(booking);
  } catch (error) {
    logger.error('Routes', 'PUT /bookings/:id - Failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    handleServiceError(error, res, 'Booking not found');
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = extractId(req.params, 'id');
  logger.info('Routes', `DELETE /bookings/${id}`);
  const deleted = bookingService.deleteBooking(id);

  if (!deleted) {
    logger.warn('Routes', `DELETE /bookings/${id} - Not found`);
    respondNotFound(res, 'Booking not found');
    return;
  }

  logger.info('Routes', `DELETE /bookings/${id} - Deleted`);
  res.status(204).send();
});

export { router as bookingsRouter };

