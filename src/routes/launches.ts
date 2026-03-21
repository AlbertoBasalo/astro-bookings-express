import { Router, type Request, type Response } from 'express';
import { launchService } from '../services/launchService.js';
import type { CreateLaunchRequest, TransitionLaunchRequest, UpdateLaunchRequest } from '../types/launch.js';
import { logger } from '../utils/logger.js';
import { extractId, handleServiceError, respondNotFound } from '../utils/routeHelpers.js';

const router = Router();
const ROUTE_CONTEXT = 'Routes';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

router.post('/', (req: Request, res: Response) => {
  logger.info(ROUTE_CONTEXT, 'POST /launches');
  try {
    const data = req.body as CreateLaunchRequest;
    const launch = launchService.createLaunch(data);
    logger.info(ROUTE_CONTEXT, 'POST /launches - Created', { id: launch.id });
    res.status(201).json(launch);
  } catch (error) {
    logger.error(ROUTE_CONTEXT, 'POST /launches - Failed', { error: getErrorMessage(error) });
    handleServiceError(error, res, 'Launch not found');
  }
});

router.get('/', (req: Request, res: Response) => {
  logger.info(ROUTE_CONTEXT, 'GET /launches');
  const launches = launchService.getAllLaunches();
  logger.info(ROUTE_CONTEXT, 'GET /launches - Success', { count: launches.length });
  res.status(200).json(launches);
});

router.get('/:id', (req: Request, res: Response) => {
  const id = extractId(req.params, 'id');
  logger.info(ROUTE_CONTEXT, `GET /launches/${id}`);
  const launch = launchService.getLaunchById(id);

  if (!launch) {
    logger.warn(ROUTE_CONTEXT, `GET /launches/${id} - Not found`);
    respondNotFound(res, 'Launch not found');
    return;
  }

  logger.info(ROUTE_CONTEXT, `GET /launches/${id} - Success`);
  res.status(200).json(launch);
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = extractId(req.params, 'id');
    logger.info(ROUTE_CONTEXT, `PUT /launches/${id}`);
    const data = req.body as UpdateLaunchRequest;
    const launch = launchService.updateLaunch(id, data);
    logger.info(ROUTE_CONTEXT, `PUT /launches/${id} - Updated`);
    res.status(200).json(launch);
  } catch (error) {
    logger.error(ROUTE_CONTEXT, 'PUT /launches/:id - Failed', { error: getErrorMessage(error) });
    handleServiceError(error, res, 'Launch not found');
  }
});

router.put('/:id/status', (req: Request, res: Response) => {
  try {
    const id = extractId(req.params, 'id');
    logger.info(ROUTE_CONTEXT, `PUT /launches/${id}/status`);
    const data = req.body as TransitionLaunchRequest;
    const launch = launchService.transitionLaunchStatus(id, data);
    logger.info(ROUTE_CONTEXT, `PUT /launches/${id}/status - Updated`);
    res.status(200).json(launch);
  } catch (error) {
    logger.error(ROUTE_CONTEXT, 'PUT /launches/:id/status - Failed', { error: getErrorMessage(error) });
    handleServiceError(error, res, 'Launch not found');
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = extractId(req.params, 'id');
  logger.info(ROUTE_CONTEXT, `DELETE /launches/${id}`);
  const deleted = launchService.deleteLaunch(id);

  if (!deleted) {
    logger.warn(ROUTE_CONTEXT, `DELETE /launches/${id} - Not found`);
    respondNotFound(res, 'Launch not found');
    return;
  }

  logger.info(ROUTE_CONTEXT, `DELETE /launches/${id} - Deleted`);
  res.status(204).send();
});

export { router as launchesRouter };
