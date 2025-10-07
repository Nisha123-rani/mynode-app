import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import pino from 'pino';
import routes from './routes/index.js';
import * as metrics from './metrics.js';

const app = express();

// === Observability setup ===
app.use(pinoHttp({ logger: pino() }));
app.use(helmet());
app.use(express.json());
app.use(metrics.middleware);

// Read commit from environment
const GIT_SHA = process.env.GIT_SHA || 'unknown';
const BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();

console.log(`🔹 Service starting with GIT_SHA=${GIT_SHA} at ${BUILD_TIME}`);

// === Health endpoint ===
app.get('/healthz', async (req, res) => {
  res.json({
    status: 'ok',
    commit: GIT_SHA,
    buildTime: BUILD_TIME,
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
    console.error('Failed to get metrics', err);
    res.status(500).end();
  }
});

export default app;

