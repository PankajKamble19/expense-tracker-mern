const Account = require("../models/Account");

// Create a new account
const createAccount = async (req, res) => {
  try {
    const { name, type, balance } = req.body;

    const account = await Account.create({
      user: req.user.id,
      name,
      type,
      balance: balance || 0,
    });

    res.status(201).json({
      message: "Account created successfully",
      account,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create account",
      error: error.message,
    });
  }
};


// Get all accounts of logged-in user
const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      count: accounts.length,
      accounts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch accounts",
      error: error.message,
    });
  }
};


// Get one account
const getAccountById = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.status(200).json({
      account,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch account",
      error: error.message,
    });
  }
};


// Update account
const updateAccount = async (req, res) => {
  try {
    const { name, type, balance } = req.body;

    const account = await Account.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      {
        name,
        type,
        balance,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.status(200).json({
      message: "Account updated successfully",
      account,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update account",
      error: error.message,
    });
  }
};


// Delete account
const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete account",
      error: error.message,
    });
  }
};


module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
};