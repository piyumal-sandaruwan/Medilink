import { validateEnv, config } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';

// Validate environment variables - fail fast if MONGODB_URI or JWT_SECRET is missing
try {
  validateEnv();
} catch (err) {
  process.exit(1);
}

const app = createApp();

// Unknown route 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
  });
});

// Central error handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      logger.info(`====================================================`);
      logger.info(`  MediLink API Server running in ${config.nodeEnv} mode`);
      logger.info(`  Listening on port: ${config.port}`);
      logger.info(`  API Health endpoint: http://localhost:${config.port}/api/health`);
      logger.info(`  S3 Integration: ${config.aws.isConfigured ? 'Active' : 'Not configured (safe mode)'}`);
      logger.info(`  SMTP Integration: ${config.smtp.isConfigured ? 'Active' : 'Not configured (safe mode)'}`);
      logger.info(`====================================================`);
    });

    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down server gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
