const express = require("express");

const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");

const {
accountValidation,
} = require("../validators/accountValidator");

const {
createAccount,
getAccounts,
getAccountById,
updateAccount,
deleteAccount,
} = require("../controllers/accountController");

const router = express.Router();

// ==========================================
// CREATE ACCOUNT
// ==========================================
router.post(
"/",
protect,
accountValidation,
validate,
createAccount
);

// ==========================================
// GET ALL ACCOUNTS
// ==========================================
router.get(
"/",
protect,
getAccounts
);

// ==========================================
// GET ONE ACCOUNT
// ==========================================
router.get(
"/:id",
protect,
getAccountById
);

// ==========================================
// UPDATE ACCOUNT
// ==========================================
router.put(
"/:id",
protect,
updateAccount
);

// ==========================================
// DELETE ACCOUNT
// ==========================================
router.delete(
"/:id",
protect,
deleteAccount
);

module.exports = router;
