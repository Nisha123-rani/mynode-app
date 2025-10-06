import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import pino from 'pino';
import routes from './routes/index.js';
import * as metrics from './metrics.js';


const app = express();

app.use(pinoHttp({ logger: pino() }));
app.use(helmet());
app.use(express.json());
app.use(metrics.middleware);

app.get('/healthz', async (req, res) => {
  const commit = process.env.COMMIT_SHA || null;
  res.json({ status: 'ok', commit });
});

app.use('/api/v1', routes);

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

