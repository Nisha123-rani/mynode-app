// tests/app.test.js

import request from 'supertest';
import app from '../src/server.js';
import { jest } from '@jest/globals';



describe('==== Node.js Todos API (with Observability) ====', () => {
  test('✅ GET /healthz should return status ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('✅ POST /api/v1/todos creates todo and GET lists it', async () => {
    const todo = { title: 'test todo' };
    const postRes = await request(app).post('/api/v1/todos').send(todo);
    expect(postRes.statusCode).toBe(201);
    expect(postRes.body).toHaveProperty('title', todo.title);

    const getRes = await request(app).get('/api/v1/todos');
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.some(t => t.title === todo.title)).toBe(true);
  });

  test('❌ POST /api/v1/todos should fail without title', async () => {
    const res = await request(app).post('/api/v1/todos').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('📊 GET /metrics should return Prometheus metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('http_request_duration_seconds_count');
  });

  test('📝 Structured logging: Pino logs requests in JSON format', async () => {
    const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await request(app).get('/healthz');

    expect(writeSpy).toHaveBeenCalled();

    // Grab the log line containing our route
    const logCall = writeSpy.mock.calls.find(c => c[0].includes('request completed'));
    expect(logCall).toBeDefined();

    const logLine = logCall[0].toString();

    // Ensure it's valid JSON
    expect(() => JSON.parse(logLine)).not.toThrow();

    writeSpy.mockRestore();
  });
});

