import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const isProduction = process.env.NODE_ENV === 'production';

// On Vercel (production), only use console — no file system access
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction ? logFormat : consoleFormat,
  }),
];

// Only add file transports in local development
if (!isProduction) {
  try {
    const { mkdirSync } = require('fs');
    mkdirSync('logs', { recursive: true });

    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880,
        maxFiles: 5,
      })
    );
  } catch {
    // If logs dir can't be created, console-only is fine
  }
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'chatbot-backend' },
  transports,
});
