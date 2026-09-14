
const express = require("express");

const protect = require("../middleware/authMiddleware");

const validate = require("../middleware/validationMiddleware");

const {
  transactionValidation,
} = require("../validators/transactionValidator");

const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  exportTransactions,
} = require("../controllers/transactionController");

const router = express.Router();


// ==========================================
// CREATE TRANSACTION
// ==========================================

router.post(
  "/",
  protect,
  transactionValidation,
  validate,
  createTransaction
);


// ==========================================
// GET ALL TRANSACTIONS
// ==========================================

router.get(
  "/",
  protect,
  getTransactions
);


// ==========================================
// EXPORT TRANSACTIONS AS CSV
// ==========================================

router.get(
  "/export",
  protect,
  exportTransactions
);


// ==========================================
// GET ONE TRANSACTION
// ==========================================

router.get(
  "/:id",
  protect,
  getTransactionById
);


// ==========================================
// UPDATE TRANSACTION
// ==========================================

router.put(
  "/:id",
  protect,
  transactionValidation,
  validate,
  updateTransaction
);


// ==========================================
// DELETE TRANSACTION
// ==========================================

router.delete(
  "/:id",
  protect,
  deleteTransaction
);


module.exports = router;

