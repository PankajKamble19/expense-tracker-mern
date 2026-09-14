const rateLimit = require("express-rate-limit");


// ==========================================
// AUTH RATE LIMITER
// ==========================================

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes

  max: 10, // Maximum 10 requests per IP

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    message:
      "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

module.exports = {
  authRateLimiter,
};
