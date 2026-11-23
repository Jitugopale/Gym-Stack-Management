import http from 'http';
import crypto from 'crypto';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from './config/env.js';
import prisma, { testConnection } from './config/database.js';
import { publicRoutes, protectedRoutes } from './routes/v1/index.js';
import { requireApiCredentials } from './middleware/apiSecurity.js';
import { logger } from './utils/logger.js';
import { startAllCrons, stopAllCrons } from './cron/index.js';

dotenv.config();

// Validate critical environment variables (FitPlus-style)
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

if (process.env.ADMIN_JWT_SECRET === process.env.JWT_SECRET) {
  console.error(
    'ADMIN_JWT_SECRET must be different from JWT_SECRET (admin/gym session isolation).'
  );
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('WEAK JWT_SECRET in production! Use a strong 32+ character secret.');
    process.exit(1);
  }
  if (!process.env.ADMIN_JWT_SECRET || process.env.ADMIN_JWT_SECRET.length < 32) {
    console.error(
      'WEAK ADMIN_JWT_SECRET in production! Use a strong 32+ character secret.'
    );
    process.exit(1);
  }
}

const app = express();
let server;

app.set('trust proxy', 1);

app.use(compression());
app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      // No Origin (same-origin / curl) or listed origins
      if (!origin || config.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Local Vite often bumps 5173 → 5174/5175/5176 when ports are busy
      if (
        config.nodeEnv !== 'production' &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Content-type validation for POST/PUT/PATCH
app.use((req, res, next) => {
  if (req.is('multipart/form-data')) return next();
  if (
    ['POST', 'PUT', 'PATCH'].includes(req.method) &&
    req.body &&
    Object.keys(req.body).length > 0 &&
    !req.is('json')
  ) {
    return res.status(415).json({
      success: false,
      message: 'Unsupported Media Type',
      error: 'Content-Type must be application/json',
    });
  }
  next();
});

// Request ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Response time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
      { requestId: req.id }
    );
  });
  next();
});

// Request timeout
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      return res.status(504).json({
        success: false,
        message: 'Server timeout - request took too long to process',
      });
    }
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests' },
  skip: (req) => req.path === '/health' || req.path === '/api/health',
});
app.use(limiter);

// API credentials for versioned API (resume SaaS gate)
app.use('/api/v1', requireApiCredentials);

// Register public routes
Object.entries(publicRoutes).forEach(([, route]) => {
  logger.info(`Public route registered: ${route.path}`);
  app.use(route.path, route.router);
});

// Register protected routes
Object.entries(protectedRoutes).forEach(([, route]) => {
  logger.info(`Protected route registered: ${route.path}`);
  app.use(route.path, route.router);
});

// Health check with database status
app.get('/health', async (_req, res) => {
  try {
    await testConnection();
    res.json({
      status: 'ok',
      message: 'Server is running',
      app: config.appDisplayName,
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      message: 'Server is running but database is unavailable',
      app: config.appDisplayName,
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
});

app.get('/api/health', async (_req, res) => {
  res.redirect(307, '/health');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    error: 'The requested endpoint does not exist',
  });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  const status =
    err.status || (err.message === 'Not allowed by CORS' ? 403 : 500);
  logger.error('Error:', err.message, {
    requestId: req.id,
    stack: err.stack,
  });
  res.status(status).json({
    success: false,
    message: err.message || 'Something went wrong!',
    requestId: req.id,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received - shutting down gracefully`);

  const forceExit = setTimeout(() => {
    logger.error('Forced shutdown: graceful shutdown exceeded time limit');
    process.exit(1);
  }, 4500);

  if (!server) {
    clearTimeout(forceExit);
    return process.exit(0);
  }

  server.close(async () => {
    clearTimeout(forceExit);
    logger.info('HTTP server closed');
    stopAllCrons();
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  if (config.nodeEnv === 'production') {
    setTimeout(() => process.exit(1), 1000);
  }
});

const startServer = async () => {
  try {
    await testConnection();

    const PORT = config.port;
    const HOST = config.host;

    server = http.createServer(app);
    server.listen(PORT, HOST, () => {
      logger.info(`Server running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info('Database: Connected');
      startAllCrons();
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
