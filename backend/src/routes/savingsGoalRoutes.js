const express = require("express");

const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");

const {
  savingsGoalValidation,
} = require("../validators/savingsGoalValidator");

const {
  createSavingsGoal,
  getSavingsGoals,
  getSavingsGoalById,
  updateSavingsGoal,
  deleteSavingsGoal,
} = require("../controllers/savingsGoalController");

const router = express.Router();

router.post(
  "/",
  protect,
  savingsGoalValidation,
  validate,
  createSavingsGoal
);

router.get(
  "/",
  protect,
  getSavingsGoals
);

router.get(
  "/:id",
  protect,
  getSavingsGoalById
);

router.put(
  "/:id",
  protect,
  savingsGoalValidation,
  validate,
  updateSavingsGoal
);

router.delete(
  "/:id",
  protect,
  deleteSavingsGoal
);

module.exports = router;