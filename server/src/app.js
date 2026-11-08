import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import config from './config/env.js';
import mongoSanitize from './middleware/mongoSanitize.js';
import errorHandler from './middleware/errorHandler.js';
import { successResponse } from './utils/response.js';

import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import affiliationRoutes from './routes/affiliationRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

export const createApp = () => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps, curl, Supertest)
        if (!origin) return callback(null, true);

        // Exact match or localhost development match
        if (
          origin === config.clientUrl ||
          origin === 'http://localhost:5173' ||
          origin === 'http://127.0.0.1:5173' ||
          !config.isProduction
        ) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked request from origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // HTTP request logging
  if (!config.isTest) {
    app.use(morgan(config.isProduction ? 'combined' : 'dev'));
  }

  // Body parsers
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Sanitize MongoDB operators to avoid query injection
  app.use(mongoSanitize);

  // General rate limiting on API routes
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
    skip: () => config.isTest,
  });
  app.use('/api', apiLimiter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    return successResponse(res, {
      message: 'MediLink API is running and healthy',
      data: {
        environment: config.nodeEnv,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        integrations: {
          payhere: config.payhere.isConfigured ? (config.payhere.sandbox ? 'sandbox_configured' : 'live_configured') : 'not_configured',
          s3: config.aws.isConfigured ? 'configured' : 'not_configured',
          smtp: config.smtp.isConfigured ? 'configured' : 'not_configured',
        },
      },
    });
  });

  // Mount API routers in strict precedence order
  app.use('/api/auth', authRoutes);
  app.use('/api', doctorRoutes);
  app.use('/api', publicRoutes);
  app.use('/api', affiliationRoutes);
  app.use('/api', patientRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', uploadRoutes);

  // Central error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
