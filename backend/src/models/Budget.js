
const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    // User who owns this budget
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Budget amount
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Month
    // Example: 2026-09
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },

    // Category
    // null means this is the overall monthly budget
    // Example:
    // null       → overall budget
    // "Food"     → Food category budget
    // "Travel"   → Travel category budget
    category: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One overall budget per user per month
// category = null
budgetSchema.index(
  {
    user: 1,
    month: 1,
    category: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Budget", budgetSchema);

