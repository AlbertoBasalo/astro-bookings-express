import { Router, type Request, type Response } from 'express';
import { rocketService } from '../services/rocketService.js';
import type { CreateRocketRequest, UpdateRocketRequest, ValidationError } from '../types/rocket.js';

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
    if (error.message === 'Rocket not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    handleValidationError(error, res);
  } else {
    res.status(400).json({ error: 'Invalid request' });
  }
};

router.post('/', (req: Request, res: Response) => {
  try {
    const data = req.body as CreateRocketRequest;
    const rocket = rocketService.createRocket(data);
    res.status(201).json(rocket);
  } catch (error) {
    handleServiceError(error, res);
  }
});

router.get('/', (req: Request, res: Response) => {
  const rockets = rocketService.getAllRockets();
  res.status(200).json(rockets);
});

router.get('/:id', (req: Request, res: Response) => {
  const id = extractId(req.params, 'id');
  const rocket = rocketService.getRocketById(id);

  if (!rocket) {
    res.status(404).json({ error: 'Rocket not found' });
    return;
  }

  res.status(200).json(rocket);
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = extractId(req.params, 'id');
    const data = req.body as UpdateRocketRequest;
    const rocket = rocketService.updateRocket(id, data);
    res.status(200).json(rocket);
  } catch (error) {
    handleServiceError(error, res);
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = extractId(req.params, 'id');
  const deleted = rocketService.deleteRocket(id);

  if (!deleted) {
    res.status(404).json({ error: 'Rocket not found' });
    return;
  }

  res.status(204).send();
});

export { router as rocketsRouter };
