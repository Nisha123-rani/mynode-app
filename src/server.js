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

// Log startup info (optional, will show build-time values if any)
console.log(`🔹 Service starting with GIT_SHA=${process.env.GIT_SHA || 'unknown'} at ${process.env.BUILD_TIME || new Date().toISOString()}`);

// === Health endpoint ===
app.get('/healthz', async (req, res) => {
  res.json({
    status: 'ok',
    commit: process.env.GIT_SHA || 'unknown',        // Read dynamically
    buildTime: process.env.BUILD_TIME || new Date().toISOString(), // Read dynamically
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

