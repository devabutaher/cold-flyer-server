const pino = require('pino');

const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      options: { destination: 1 }, // stdout
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    ...(process.env.LOG_FILE
      ? [{
          target: 'pino/file',
          options: { destination: process.env.LOG_FILE },
          level: 'error',
        }]
      : []),
  ],
});

const logger = pino({
  name: 'cold-flyer',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: ['req.headers.cookie', 'req.headers.authorization', 'body.password', 'body.currentPassword', 'body.newPassword'],
    censor: '[REDACTED]',
  },
}, transport);

module.exports = logger;
