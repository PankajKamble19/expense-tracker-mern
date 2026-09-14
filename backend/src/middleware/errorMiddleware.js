
const errorHandler = (err, req, res, next) => {
  console.error("Server Error:", err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      err.message || "Internal server error",
  });
};


// ==========================================
// 404 NOT FOUND HANDLER
// ==========================================

const notFound = (req, res, next) => {
  const error = new Error(
    `Route not found: ${req.method} ${req.originalUrl}`,
  );

  error.statusCode = 404;

  next(error);
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  errorHandler,
  notFound,
};

