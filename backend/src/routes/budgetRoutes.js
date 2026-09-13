
const express = require("express");

const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");

const {
  budgetValidation,
} = require("../validators/budgetValidator");

const {
  createBudget,
  getBudgets,
  getBudgetByMonth,
  getCategoryBudgets,
  deleteBudget,
  deleteCategoryBudget,
} = require("../controllers/budgetController");

const router = express.Router();

// CREATE / UPDATE OVERALL OR CATEGORY BUDGET
router.post(
  "/",
  protect,
  budgetValidation,
  validate,
  createBudget
);

// GET ALL USER BUDGETS
router.get(
  "/",
  protect,
  getBudgets
);

// GET CATEGORY BUDGETS FOR MONTH
router.get(
  "/category/:month",
  protect,
  getCategoryBudgets
);

// GET OVERALL BUDGET FOR MONTH
router.get(
  "/:month",
  protect,
  getBudgetByMonth
);

// DELETE CATEGORY BUDGET
router.delete(
  "/category/:month/:category",
  protect,
  deleteCategoryBudget
);

// DELETE OVERALL BUDGET
router.delete(
  "/:month",
  protect,
  deleteBudget
);

module.exports = router;

