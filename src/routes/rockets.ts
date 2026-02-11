import { Router, type Request, type Response } from 'express';
import { rocketService } from '../services/rocketService.js';
import type { CreateRocketRequest, UpdateRocketRequest } from '../types/rocket.js';
import { logger } from '../utils/logger.js';
import { extractId, handleServiceError } from '../utils/routeHelpers.js';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  logger.info('Routes', 'POST /rockets');
  try {
    const data = req.body as CreateRocketRequest;
    const rocket = rocketService.createRocket(data);
    logger.info('Routes', 'POST /rockets - Created', { id: rocket.id });
    res.status(201).json(rocket);
  } catch (error) {
    logger.error('Routes', 'POST /rockets - Failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    handleServiceError(error, res, 'Rocket not found');
  }
});

router.get('/', (req: Request, res: Response) => {
  logger.info('Routes', 'GET /rockets');
  const rockets = rocketService.getAllRockets();
  logger.info('Routes', 'GET /rockets - Success', { count: rockets.length });
  res.status(200).json(rockets);
});

router.get('/:id', (req: Request, res: Response) => {
  const id = extractId(req.params, 'id');
  logger.info('Routes', `GET /rockets/${id}`);
  const rocket = rocketService.getRocketById(id);

  if (!rocket) {
    logger.warn('Routes', `GET /rockets/${id} - Not found`);
    res.status(404).json({ error: 'Rocket not found' });
    return;
  }

  logger.info('Routes', `GET /rockets/${id} - Success`);
  res.status(200).json(rocket);
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = extractId(req.params, 'id');
    logger.info('Routes', `PUT /rockets/${id}`);
    const data = req.body as UpdateRocketRequest;
    const rocket = rocketService.updateRocket(id, data);
    logger.info('Routes', `PUT /rockets/${id} - Updated`);
    res.status(200).json(rocket);
  } catch (error) {
    logger.error('Routes', 'PUT /rockets/:id - Failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    handleServiceError(error, res, 'Rocket not found');
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = extractId(req.params, 'id');
  logger.info('Routes', `DELETE /rockets/${id}`);
  const deleted = rocketService.deleteRocket(id);

  if (!deleted) {
    logger.warn('Routes', `DELETE /rockets/${id} - Not found`);
    res.status(404).json({ error: 'Rocket not found' });
    return;
  }

  logger.info('Routes', `DELETE /rockets/${id} - Deleted`);
  res.status(204).send();
});

export { router as rocketsRouter };
