// src/metrics.js
import client from 'prom-client';

// Create a registry for Prometheus metrics
export const register = new client.Registry();

// Collect default metrics
client.collectDefaultMetrics({ register });

// HTTP requests counter
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});
register.registerMetric(httpRequestsTotal);

// Request duration histogram
export const requestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
});
register.registerMetric(requestDuration);

// Middleware to measure request metrics
export function middleware(req, res, next) {
  const end = requestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path || req.path;
    httpRequestsTotal.inc({ method: req.method, route, status: res.statusCode });
    end({ method: req.method, route, status: res.statusCode });
  });
  next();
}

