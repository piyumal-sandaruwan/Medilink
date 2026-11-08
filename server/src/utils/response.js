/**
 * Standard API response helper ensuring consistent JSON shape:
 * { success: boolean, data?: any, message?: string }
 */
export const successResponse = (res, { statusCode = 200, data = null, message = null } = {}) => {
  const payload = { success: true };
  if (data !== null && data !== undefined) {
    payload.data = data;
  }
  if (message) {
    payload.message = message;
  }
  return res.status(statusCode).json(payload);
};

export const errorResponse = (res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) => {
  const payload = {
    success: false,
    message,
  };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};
