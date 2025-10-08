import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import pino from 'pino';
import routes from './routes/index.js';
import * as metrics from './metrics.js';

const app = express();
const logger = pino();

// === Log startup info (initial env values) ===
logger.info(`🚀 Starting service with GIT_SHA=${process.env.GIT_SHA || 'unknown'}, BUILD_TIME=${process.env.BUILD_TIME || new Date().toISOString()}`);

// === Middleware ===
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(express.json());
app.use(metrics.middleware);

// === Health endpoint (reads env dynamically) ===
app.get('/healthz', (req, res) => {
  const GIT_SHA = process.env.GIT_SHA || 'unknown';
  const BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();

  res.json({
    status: 'ok',
    commit: GIT_SHA,
    buildTime: BUILD_TIME
  });
});

// === API routes ===
app.use('/api/v1', routes);

// === Metrics endpoint ===
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metrics.register.contentType);
    res.end(await metrics.register.metrics());
  } catch (err) {
    logger.error('Failed to get metrics', err);
    res.status(500).end();
  }
});

export default app;

