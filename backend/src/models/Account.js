const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    // Owner of this account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Account name
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    // Type of account
    type: {
      type: String,
      enum: [
        "cash",
        "bank",
        "credit_card",
        "wallet",
        "savings",
      ],
      required: true,
    },

    // Current balance
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Account", accountSchema);