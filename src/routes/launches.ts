import { Router } from 'express';
import { launchService } from '../services/launchService.js';
import type { CreateLaunchRequest, UpdateLaunchRequest, ValidationError } from '../types/launch.js';
import { logger } from '../utils/logger.js';

export const launchesRouter = Router();

const COMPONENT = 'LaunchesRouter';

launchesRouter.post('/', (req, res) => {
  logger.info(COMPONENT, 'POST /launches');
  try {
    const data = req.body as CreateLaunchRequest;
    const launch = launchService.createLaunch(data);
    logger.info(COMPONENT, 'Launch created successfully', { id: launch.id });
    res.status(201).json(launch);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    try {
      const validationErrors: ValidationError[] = JSON.parse(errorMessage);
      logger.error(COMPONENT, 'Validation error', { errors: validationErrors });
      res.status(400).json({ errors: validationErrors });
    } catch {
      logger.error(COMPONENT, 'Error creating launch', { error: errorMessage });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

launchesRouter.get('/', (req, res) => {
  logger.info(COMPONENT, 'GET /launches');
  try {
    const launches = launchService.getAllLaunches();
    logger.info(COMPONENT, 'Launches retrieved', { count: launches.length });
    res.status(200).json(launches);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(COMPONENT, 'Error retrieving launches', { error: errorMessage });
    res.status(500).json({ error: 'Internal server error' });
  }
});

launchesRouter.get('/:id', (req, res) => {
  logger.info(COMPONENT, 'GET /launches/:id', { id: req.params.id });
  try {
    const launch = launchService.getLaunchById(req.params.id);
    if (!launch) {
      logger.warn(COMPONENT, 'Launch not found', { id: req.params.id });
      res.status(404).json({ error: 'Launch not found' });
      return;
    }
    logger.info(COMPONENT, 'Launch retrieved', { id: launch.id });
    res.status(200).json(launch);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(COMPONENT, 'Error retrieving launch', { error: errorMessage });
    res.status(500).json({ error: 'Internal server error' });
  }
});

launchesRouter.put('/:id', (req, res) => {
  logger.info(COMPONENT, 'PUT /launches/:id', { id: req.params.id });
  try {
    const data = req.body as UpdateLaunchRequest;
    const launch = launchService.updateLaunch(req.params.id, data);
    logger.info(COMPONENT, 'Launch updated successfully', { id: launch.id });
    res.status(200).json(launch);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    try {
      const validationErrors: ValidationError[] = JSON.parse(errorMessage);
      if (validationErrors.some(e => e.field === 'id')) {
        logger.warn(COMPONENT, 'Launch not found for update', { id: req.params.id });
        res.status(404).json({ error: 'Launch not found' });
        return;
      }
      logger.error(COMPONENT, 'Validation error', { errors: validationErrors });
      res.status(400).json({ errors: validationErrors });
    } catch {
      logger.error(COMPONENT, 'Error updating launch', { error: errorMessage });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

launchesRouter.delete('/:id', (req, res) => {
  logger.info(COMPONENT, 'DELETE /launches/:id', { id: req.params.id });
  try {
    launchService.deleteLaunch(req.params.id);
    logger.info(COMPONENT, 'Launch deleted successfully', { id: req.params.id });
    res.status(204).send();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    try {
      const validationErrors: ValidationError[] = JSON.parse(errorMessage);
      if (validationErrors.some(e => e.field === 'id')) {
        logger.warn(COMPONENT, 'Launch not found for deletion', { id: req.params.id });
        res.status(404).json({ error: 'Launch not found' });
        return;
      }
      logger.error(COMPONENT, 'Validation error', { errors: validationErrors });
      res.status(400).json({ errors: validationErrors });
    } catch {
      logger.error(COMPONENT, 'Error deleting launch', { error: errorMessage });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
