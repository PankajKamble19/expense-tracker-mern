import multer from 'multer';

export const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Attachment must be 5 MB or smaller' : err.message;
  } else if (message === 'Unsupported attachment type') {
    statusCode = 400;
  } else if (err?.code === 11000) {
    statusCode = 409;
    message = 'A record with the same unique value already exists';
  } else if (err?.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier';
  }

  if (process.env.NODE_ENV !== 'production') console.error(err.stack || err);

  const payload = { success: false, message };
  if (err.errors) payload.errors = err.errors;
  res.status(statusCode).json(payload);
};
