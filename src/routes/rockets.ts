import { Router, type Request, type Response } from 'express';
import { rocketService } from '../services/rocketService.js';
import type { CreateRocketRequest, UpdateRocketRequest } from '../types/rocket.js';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const data = req.body as CreateRocketRequest;
    const rocket = rocketService.createRocket(data);
    res.status(201).json(rocket);
  } catch (error) {
    if (error instanceof Error) {
      try {
        const validationErrors = JSON.parse(error.message);
        res.status(400).json({ errors: validationErrors });
      } catch {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(400).json({ error: 'Invalid request' });
    }
  }
});

router.get('/', (req: Request, res: Response) => {
  const rockets = rocketService.getAllRockets();
  res.status(200).json(rockets);
});

router.get('/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rocket = rocketService.getRocketById(id);

  if (!rocket) {
    res.status(404).json({ error: 'Rocket not found' });
    return;
  }

  res.status(200).json(rocket);
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = req.body as UpdateRocketRequest;
    const rocket = rocketService.updateRocket(id, data);
    res.status(200).json(rocket);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Rocket not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      try {
        const validationErrors = JSON.parse(error.message);
        res.status(400).json({ errors: validationErrors });
      } catch {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(400).json({ error: 'Invalid request' });
    }
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const deleted = rocketService.deleteRocket(id);

  if (!deleted) {
    res.status(404).json({ error: 'Rocket not found' });
    return;
  }

  res.status(204).send();
});

export default router;
