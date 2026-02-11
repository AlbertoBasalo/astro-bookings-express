import { Router, type Request, type Response } from 'express';
import { launchService } from '../services/launchService.js';
import type { CreateLaunchRequest, UpdateLaunchRequest } from '../types/launch.js';
import { logger } from '../utils/logger.js';
import { extractId, handleServiceError } from '../utils/routeHelpers.js';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  logger.info('Routes', 'POST /launches');
  try {
    const data = req.body as CreateLaunchRequest;
    const launch = launchService.createLaunch(data);
    logger.info('Routes', 'POST /launches - Created', { id: launch.id });
    res.status(201).json(launch);
  } catch (error) {
    logger.error('Routes', 'POST /launches - Failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    handleServiceError(error, res, 'Launch not found');
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
    handleServiceError(error, res, 'Launch not found');
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
