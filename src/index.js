import server from './server.js';
import pino from 'pino';

const logger = pino();
const PORT = process.env.PORT || 3000;
const GIT_SHA = process.env.GIT_SHA || 'unknown';

server.listen(PORT, () => {
  logger.info({ port: PORT, git_sha: GIT_SHA }, 'Server started');
});

