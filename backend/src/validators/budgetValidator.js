
const { body } = require("express-validator");

const budgetValidation = [
  body("amount")
    .notEmpty()
    .withMessage("Budget amount is required")
    .isFloat({ min: 0 })
    .withMessage("Budget amount must be 0 or greater"),

  body("month")
    .notEmpty()
    .withMessage("Budget month is required")
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage("Month must be in YYYY-MM format"),

  body("category")
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters"),
];

module.exports = {
  budgetValidation,
};

