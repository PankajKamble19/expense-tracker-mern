
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // Which user owns this transaction
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Transaction amount
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Income or expense
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },

    // Category such as Salary, Food, Travel, Shopping
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    // Account from which the money came/went
    // IMPORTANT: ObjectId is required for populate()
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    // Optional note
    note: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    // Transaction date
    date: {
      type: Date,
      default: Date.now,
    },

    // Optional attachment URL/path
    attachment: {
      type: String,
      default: null,
    },

    // Whether this transaction repeats
    recurring: {
      type: Boolean,
      default: false,
    },

    // How often it repeats
    recurringFrequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      default: null,
    },

    // Date when the next recurring transaction should be created
    nextOccurrence: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
