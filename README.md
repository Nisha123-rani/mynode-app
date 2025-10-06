# Todos Assessment

## Run locally
1. Install deps: `npm ci`
2. Start: `npm start` (defaults to port 3000)
3. Tests: `npm test`

## Endpoints
- `GET /healthz` → `{ status: "ok", commit: <sha|null> }`
- `GET /api/v1/todos` → list
- `POST /api/v1/todos` → create `{ id, title, done }`
- `GET /metrics` → Prometheus metrics

## Persistence
By default the app uses an in-memory store. To use DynamoDB:
- Set `DB_PROVIDER=dynamo`, `AWS_REGION`, `DYNAMO_TABLE` and AWS credentials in environment.

## Docker
Build:

