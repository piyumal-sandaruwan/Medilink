import config from '../config/env.js';
import logger from '../utils/logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for resource: ${err.value}`;
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Mongo Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const keyPattern = err.keyPattern || {};

    if (keyPattern.patient && keyPattern.schedule) {
      message = 'You already have an active booking for this channeling schedule.';
    } else if (keyPattern.email) {
      message = 'An account with this email address already exists.';
    } else if (keyPattern.slmcNo) {
      message = 'A doctor with this SLMC registration number already exists.';
    } else if (keyPattern.registrationNo) {
      message = 'A hospital with this registration number already exists.';
    } else if (keyPattern.doctor && keyPattern.hospital) {
      message = 'An affiliation request between this doctor and hospital already exists.';
    } else if (keyPattern.name) {
      message = 'A record with this name already exists.';
    } else {
      message = 'A resource with this identifier already exists.';
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired. Please log in again.';
  }

  if (statusCode >= 500) {
    logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  } else {
    logger.warn(`[Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Do not expose stack traces in production
  if (!config.isProduction && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
