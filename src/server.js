import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import pino from 'pino';
import routes from './routes/index.js';
import * as metrics from './metrics.js';

const app = express();
const logger = pino();

// === Observability setup ===
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(express.json());
app.use(metrics.middleware);

// Log startup info (includes build metadata)
const gitSha = process.env.GIT_SHA || 'unknown';
const buildTime = process.env.BUILD_TIME || new Date().toISOString();
logger.info(`🔹 Service starting with GIT_SHA=${gitSha}, BUILD_TIME=${buildTime}`);

// === Health endpoint ===
app.get('/healthz', (req, res) => {
  // Read fresh values directly from env each time
  const currentGitSha = process.env.GIT_SHA || 'unknown';
  const currentBuildTime = process.env.BUILD_TIME || 'unknown';

  res.json({
    status: 'ok',
    commit: currentGitSha,
    buildTime: currentBuildTime,
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
    logger.error('❌ Failed to get metrics', err);
    res.status(500).end();
  }
});

export default app;

