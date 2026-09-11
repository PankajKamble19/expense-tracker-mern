
const express = require("express");

const { register, login } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

// Protected test route
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "You are authorized",
    userId: req.user.id,
  });
});

module.exports = router;

