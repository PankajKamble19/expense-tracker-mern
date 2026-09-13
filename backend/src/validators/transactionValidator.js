const { body } = require("express-validator");

const transactionValidation = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),

  body("type")
    .notEmpty()
    .withMessage("Transaction type is required")
    .isIn(["income", "expense"])
    .withMessage("Transaction type must be income or expense"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isLength({ max: 50 })
    .withMessage("Category cannot exceed 50 characters"),

  body("account")
    .notEmpty()
    .withMessage("Account is required")
    .isMongoId()
    .withMessage("Account must be a valid ID"),

  body("note")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Note cannot exceed 200 characters"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid date"),

  body("attachment")
    .optional()
    .isString()
    .withMessage("Attachment must be a string"),

  body("recurring")
    .optional()
    .isBoolean()
    .withMessage("Recurring must be true or false"),

  body("recurringFrequency")
    .optional({ nullable: true })
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage(
      "Recurring frequency must be daily, weekly, monthly, or yearly"
    ),

  body("nextOccurrence")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Next occurrence must be a valid date"),
];

module.exports = {
  transactionValidation,
};