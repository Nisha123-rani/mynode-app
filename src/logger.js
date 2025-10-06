//const util = require('util');

function log(level, message, meta = {}) {
  const logObject = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };
  console.log(JSON.stringify(logObject));
}

module.exports = { log };

