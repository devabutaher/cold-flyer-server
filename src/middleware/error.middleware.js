const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid ID format';
    error = ApiError.badRequest(message);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
    statusCode = 409;
    error = ApiError.conflict(message);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
      code: 'VALIDATION_ERROR',
      requestId: req?.id,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    error = ApiError.unauthorized(message);
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    error = ApiError.unauthorized(message);
  }

  if (statusCode >= 500) {
    logger.error({ err, requestId: req?.id }, message);
  }

  const response = {
    success: false,
    message,
    code: error.code || 'ERROR',
    requestId: req?.id,
  };

  if (err.errors && err.errors.length > 0) {
    response.errors = err.errors;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
