import { Router, type Request, type Response } from 'express';
import { launchService } from '../services/launchService.js';
import type { CreateLaunchRequest, UpdateLaunchRequest, ValidationError } from '../types/launch.js';
import { logger } from '../utils/logger.js';

const router = Router();

const extractId = (params: Request['params'], key: string): string => {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
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
    if (error.message === 'Launch not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    handleValidationError(error, res);
  } else {
    res.status(400).json({ error: 'Invalid request' });
  }
};

router.post('/', (req: Request, res: Response) => {
  logger.info('Routes', 'POST /launches');
  try {
    const data = req.body as CreateLaunchRequest;
    const launch = launchService.createLaunch(data);
    logger.info('Routes', 'POST /launches - Created', { id: launch.id });
    res.status(201).json(launch);
  } catch (error) {
    logger.error('Routes', 'POST /launches - Failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    handleServiceError(error, res);
  }
});

router.get('/', (req: Request, res: Response) => {
  logger.info('Routes', 'GET /launches');
  const launches = launchService.getAllLaunches();
  logger.info('Routes', 'GET /launches - Success', { count: launches.length });
  res.status(200).json(launches);
});

router.get('/:id', (req: Request, res: Response) => {
  const id = extractId(req.params, 'id');
  logger.info('Routes', `GET /launches/${id}`);
  const launch = launchService.getLaunchById(id);

  if (!launch) {
    logger.warn('Routes', `GET /launches/${id} - Not found`);
    res.status(404).json({ error: 'Launch not found' });
    return;
  }

  logger.info('Routes', `GET /launches/${id} - Success`);
  res.status(200).json(launch);
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = extractId(req.params, 'id');
    logger.info('Routes', `PUT /launches/${id}`);
    const data = req.body as UpdateLaunchRequest;
    const launch = launchService.updateLaunch(id, data);
    logger.info('Routes', `PUT /launches/${id} - Updated`);
    res.status(200).json(launch);
  } catch (error) {
    logger.error('Routes', 'PUT /launches/:id - Failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    handleServiceError(error, res);
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = extractId(req.params, 'id');
  logger.info('Routes', `DELETE /launches/${id}`);
  const deleted = launchService.deleteLaunch(id);

  if (!deleted) {
    logger.warn('Routes', `DELETE /launches/${id} - Not found`);
    res.status(404).json({ error: 'Launch not found' });
    return;
  }

  logger.info('Routes', `DELETE /launches/${id} - Deleted`);
  res.status(204).send();
});

export { router as launchesRouter };
