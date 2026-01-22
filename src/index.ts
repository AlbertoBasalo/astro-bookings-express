import express from 'express';
import { customersRouter } from './routes/customers.js';
import { launchesRouter } from './routes/launches.js';
import { rocketsRouter } from './routes/rockets.js';
import { logger } from './utils/logger.js';

const DEFAULT_PORT = 3000;

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!; Try my /health on http://localhost:3000/health');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/rockets', rocketsRouter);

app.use('/launches', launchesRouter);

app.use('/customers', customersRouter);

app.listen(port, () => {
  logger.info('App', `Server listening on http://localhost:${port}`);
  logger.info('App', `Check health on http://localhost:${port}/health`);
});
