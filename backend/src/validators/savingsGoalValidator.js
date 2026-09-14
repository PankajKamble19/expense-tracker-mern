const { body } = require("express-validator");

const savingsGoalValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Goal name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Goal name must be between 2 and 100 characters"),

  body("targetAmount")
    .notEmpty()
    .withMessage("Target amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Target amount must be greater than 0"),

  body("currentAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Current amount must be 0 or greater"),

  body("targetDate")
    .notEmpty()
    .withMessage("Target date is required")
    .isISO8601()
    .withMessage("Target date must be a valid date"),
];

module.exports = {
  savingsGoalValidation,
};