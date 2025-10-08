import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import pino from 'pino';
import routes from './routes/index.js';
import * as metrics from './metrics.js';

const app = express();
const logger = pino();

// === Environment variables ===
const GIT_SHA = process.env.GIT_SHA || 'unknown';
const BUILD_TIME = process.env.BUILD_TIME || 'unknown';

// === Middleware ===
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(express.json());
app.use(metrics.middleware);

logger.info(`🚀 Starting service with GIT_SHA=${GIT_SHA}, BUILD_TIME=${BUILD_TIME}`);

// === Health endpoint ===
app.get('/healthz', async (req, res) => {
  res.json({
    status: 'ok',
    commit: GIT_SHA,         // ✅ use constant value
    buildTime: BUILD_TIME,   // ✅ use constant value
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

