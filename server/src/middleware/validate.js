import { AppError } from './errorHandler.js';

/**
 * Higher-order middleware to validate incoming request data using Zod schema.
 * @param {import('zod').ZodSchema} schema - Zod validation schema
 * @param {'body' | 'query' | 'params'} source - Part of request to validate (default: 'body')
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError('Validation failed', 400, formattedErrors));
      }
      return next(err);
    }
  };
};

export default validate;
