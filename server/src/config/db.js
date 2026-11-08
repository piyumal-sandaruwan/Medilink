import mongoose from 'mongoose';
import config from './env.js';
import logger from '../utils/logger.js';

let isConnected = false;

export const connectDB = async (customUri = null) => {
  const uri = customUri || config.mongoUri;

  if (!uri) {
    throw new Error('MongoDB connection URI is not configured.');
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });
    isConnected = true;
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    throw err;
  }
};

export const disconnectDB = async () => {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected.');
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB connection lost. Reconnecting...');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

export default connectDB;
