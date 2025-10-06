import server from './server.js';
import pino from 'pino';

const logger = pino();
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});

