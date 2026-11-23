import { createLogger, format, transports } from 'winston';
import { mkdirSync } from 'fs';

const { combine, timestamp, printf, colorize, errors } = format;

try {
  mkdirSync('logs', { recursive: true });
} catch {
  // directory may already exist
}

const logFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}] ${stack || message}${rest}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
      handleExceptions: true,
      handleRejections: true,
    }),
    new transports.File({
      filename: 'logs/logger-info.log',
      level: 'info',
      handleExceptions: true,
      handleRejections: true,
    }),
    new transports.File({
      filename: 'logs/logger-error.log',
      level: 'error',
      handleExceptions: true,
      handleRejections: true,
    }),
    new transports.File({
      filename: 'logs/logger-combined.log',
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exceptionHandlers: [
    new transports.File({
      filename: 'logs/logger-exceptions.log',
    }),
  ],
  rejectionHandlers: [
    new transports.File({
      filename: 'logs/logger-rejections.log',
    }),
  ],
});

export { logger };
export default logger;
