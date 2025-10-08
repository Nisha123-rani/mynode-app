import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import pino from 'pino';
import routes from './routes/index.js';
import * as metrics from './metrics.js';

const app = express();
const logger = pino();

// === Read environment variables at runtime ===
const GIT_SHA = process.env.GIT_SHA || 'unknown';
const BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();

// === Log startup info (structured log) ===
logger.info({ git_sha: GIT_SHA, build_time: BUILD_TIME }, '🚀 Starting service');

// === Middleware ===
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(express.json());
app.use(metrics.middleware);

// === Health endpoint (reads env dynamically) ===
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    commit: process.env.GIT_SHA || 'unknown',
    buildTime: process.env.BUILD_TIME || new Date().toISOString()
  });
});

// === Optional Version endpoint ===
app.get('/version', (req, res) => {
  res.json({
    git_sha: process.env.GIT_SHA || 'unknown',
    build_time: process.env.BUILD_TIME || new Date().toISOString(),
    service: 'mynode-app'
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

