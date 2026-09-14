const express = require("express");

const {
  register,
  login,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");

const {
  authRateLimiter,
} = require("../middleware/rateLimitMiddleware");

const {
  registerValidation,
  loginValidation,
} = require("../validators/authValidator");

const router = express.Router();


// ==========================================
// REGISTER
// ==========================================

router.post(
  "/register",
  authRateLimiter,
  registerValidation,
  validate,
  register
);


// ==========================================
// LOGIN
// ==========================================

router.post(
  "/login",
  authRateLimiter,
  loginValidation,
  validate,
  login
);


// ==========================================
// PROFILE
// ==========================================

router.get(
  "/profile",
  protect,
  (req, res) => {
    res.json({
      message: "You are authorized",
      userId: req.user.id,
    });
  }
);


module.exports = router;