const { body } = require("express-validator");

const accountValidation = [
body("name")
.trim()
.notEmpty()
.withMessage("Account name is required")
.isLength({ min: 2, max: 50 })
.withMessage("Account name must be between 2 and 50 characters"),

body("type")
.notEmpty()
.withMessage("Account type is required")
.isIn([
"cash",
"bank",
"credit_card",
"wallet",
"savings",
])
.withMessage(
"Account type must be cash, bank, credit_card, wallet, or savings"
),

body("balance")
.optional()
.isFloat({ min: 0 })
.withMessage("Balance must be a number greater than or equal to 0"),
];

module.exports = {
accountValidation,
};
