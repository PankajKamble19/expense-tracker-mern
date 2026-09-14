const mongoose = require("mongoose");

const Transaction = require("../models/Transaction");
const Account = require("../models/Account");


// ==========================================
// CREATE TRANSACTION
// ==========================================
const createTransaction = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      amount,
      type,
      category,
      account,
      note,
      date,
      attachment,
      recurring,
      recurringFrequency,
      nextOccurrence,
    } = req.body;

    const numericAmount = Number(amount);

    // ------------------------------------------
    // Find account belonging to logged-in user
    // ------------------------------------------
    const selectedAccount = await Account.findOne({
      _id: account,
      user: req.user.id,
    }).session(session);

    if (!selectedAccount) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "Account not found",
      });
    }

    // ------------------------------------------
    // Create transaction
    // ------------------------------------------
    const createdTransactions = await Transaction.create(
      [
        {
          user: req.user.id,
          amount: numericAmount,
          type,
          category,
          account,
          note,
          date,
          attachment,
          recurring,
          recurringFrequency,
          nextOccurrence,
        },
      ],
      { session }
    );

    const transaction = createdTransactions[0];

    // ------------------------------------------
    // Update account balance
    // ------------------------------------------
    if (type === "income") {
      selectedAccount.balance += numericAmount;
    }

    if (type === "expense") {
      selectedAccount.balance -= numericAmount;
    }

    await selectedAccount.save({ session });

    // ------------------------------------------
    // Commit transaction
    // ------------------------------------------
    await session.commitTransaction();

    res.status(201).json({
      message: "Transaction created successfully",
      transaction,
      accountBalance: selectedAccount.balance,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Create transaction error:", error);

    res.status(500).json({
      message: "Failed to create transaction",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};


// ==========================================
// GET TRANSACTIONS - HISTORY
// Pagination + Filters + Search
// ==========================================
const getTransactions = async (req, res) => {
  try {
    // ------------------------------------------
    // PAGINATION
    // ------------------------------------------
    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 10,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    // ------------------------------------------
    // BASE FILTER
    // IMPORTANT:
    // Only logged-in user's transactions
    // ------------------------------------------
    const filter = {
      user: req.user.id,
    };

    // ------------------------------------------
    // TYPE FILTER
    // Example:
    // ?type=income
    // ?type=expense
    // ------------------------------------------
    const allowedTypes = ["income", "expense"];

    if (
      typeof req.query.type === "string" &&
      allowedTypes.includes(req.query.type)
    ) {
      filter.type = req.query.type;
    }

    // ------------------------------------------
    // CATEGORY FILTER
    // Example:
    // ?category=Salary
    // ------------------------------------------
    if (
      typeof req.query.category === "string" &&
      req.query.category.trim()
    ) {
      filter.category = req.query.category.trim();
    }

    // ------------------------------------------
    // ACCOUNT FILTER
    // Example:
    // ?account=ACCOUNT_ID
    // ------------------------------------------
    if (
      typeof req.query.account === "string" &&
      mongoose.isValidObjectId(req.query.account)
    ) {
      filter.account = req.query.account;
    }

    // ------------------------------------------
    // DATE FILTER
    // Example:
    // ?startDate=2026-09-01
    // &endDate=2026-09-30
    // ------------------------------------------
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    if (
      typeof startDate === "string" &&
      typeof endDate === "string"
    ) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime())
      ) {
        end.setHours(23, 59, 59, 999);

        filter.date = {
          $gte: start,
          $lte: end,
        };
      }
    }

    // ------------------------------------------
    // AMOUNT FILTER
    // Example:
    // ?minAmount=1000
    // &maxAmount=10000
    // ------------------------------------------
    const minAmount = Number(req.query.minAmount);
    const maxAmount = Number(req.query.maxAmount);

    if (
      Number.isFinite(minAmount) ||
      Number.isFinite(maxAmount)
    ) {
      filter.amount = {};

      if (
        Number.isFinite(minAmount) &&
        minAmount >= 0
      ) {
        filter.amount.$gte = minAmount;
      }

      if (
        Number.isFinite(maxAmount) &&
        maxAmount >= 0
      ) {
        filter.amount.$lte = maxAmount;
      }

      // Remove empty amount filter
      if (Object.keys(filter.amount).length === 0) {
        delete filter.amount;
      }
    }

    // ------------------------------------------
    // SEARCH
    // Search:
    // - note
    // - category
    // - amount
    //
    // Example:
    // ?search=salary
    // ------------------------------------------
    if (
      typeof req.query.search === "string" &&
      req.query.search.trim()
    ) {
      const search = req.query.search.trim();

      const searchConditions = [
        {
          note: {
            $regex: search,
            $options: "i",
          },
        },
        {
          category: {
            $regex: search,
            $options: "i",
          },
        },
      ];

      // If search value is a number,
      // search amount also
      const searchAmount = Number(search);

      if (Number.isFinite(searchAmount)) {
        searchConditions.push({
          amount: searchAmount,
        });
      }

      filter.$or = searchConditions;
    }

    // ------------------------------------------
    // GET TOTAL TRANSACTIONS
    // ------------------------------------------
    const totalTransactions =
      await Transaction.countDocuments(filter);

    // ------------------------------------------
    // GET TRANSACTIONS
    // ------------------------------------------
    const transactions = await Transaction.find(filter)
      .populate("account", "name type balance")
      .sort({
        date: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    // ------------------------------------------
    // PAGINATION INFORMATION
    // ------------------------------------------
    const totalPages = Math.ceil(
      totalTransactions / limit
    );

    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------
    res.status(200).json({
      count: transactions.length,

      pagination: {
        currentPage: page,
        limit,
        totalTransactions,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      filters: {
        type: req.query.type || null,
        category: req.query.category || null,
        account: req.query.account || null,
        startDate: req.query.startDate || null,
        endDate: req.query.endDate || null,
        minAmount: req.query.minAmount || null,
        maxAmount: req.query.maxAmount || null,
        search: req.query.search || null,
      },

      transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error);

    res.status(500).json({
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};


// ==========================================
// GET ONE TRANSACTION
// ==========================================
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("account", "name type balance");

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      transaction,
    });
  } catch (error) {
    console.error("Get transaction error:", error);

    res.status(500).json({
      message: "Failed to fetch transaction",
      error: error.message,
    });
  }
};


// ==========================================
// UPDATE TRANSACTION
// ==========================================
const updateTransaction = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      amount,
      type,
      category,
      account,
      note,
      date,
      attachment,
      recurring,
      recurringFrequency,
      nextOccurrence,
    } = req.body;

    const numericAmount = Number(amount);

    // ------------------------------------------
    // Find old transaction
    // ------------------------------------------
    const oldTransaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).session(session);

    if (!oldTransaction) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    // ------------------------------------------
    // Find old account
    // ------------------------------------------
    const oldAccount = await Account.findOne({
      _id: oldTransaction.account,
      user: req.user.id,
    }).session(session);

    if (!oldAccount) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "Old account not found",
      });
    }

    // ------------------------------------------
    // Find new account BEFORE changing balances
    // ------------------------------------------
    const newAccount = await Account.findOne({
      _id: account,
      user: req.user.id,
    }).session(session);

    if (!newAccount) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "New account not found",
      });
    }

    const sameAccount =
      oldAccount._id.toString() === newAccount._id.toString();

    // ------------------------------------------
    // REVERSE OLD TRANSACTION
    // ------------------------------------------

    if (oldTransaction.type === "income") {
      oldAccount.balance -= Number(oldTransaction.amount);
    }

    if (oldTransaction.type === "expense") {
      oldAccount.balance += Number(oldTransaction.amount);
    }

    // ------------------------------------------
    // APPLY NEW TRANSACTION
    // ------------------------------------------

    if (sameAccount) {
      // Same account:
      // Reverse old transaction first,
      // then apply new transaction.

      if (type === "income") {
        oldAccount.balance += numericAmount;
      }

      if (type === "expense") {
        oldAccount.balance -= numericAmount;
      }

      await oldAccount.save({ session });
    } else {
      // Different accounts:
      // Save reversed old account first.

      await oldAccount.save({ session });

      // Apply new transaction to new account.

      if (type === "income") {
        newAccount.balance += numericAmount;
      }

      if (type === "expense") {
        newAccount.balance -= numericAmount;
      }

      await newAccount.save({ session });
    }

    // ------------------------------------------
    // UPDATE TRANSACTION
    // ------------------------------------------

    oldTransaction.amount = numericAmount;
    oldTransaction.type = type;
    oldTransaction.category = category;
    oldTransaction.account = account;
    oldTransaction.note = note;
    oldTransaction.date = date;
    oldTransaction.attachment = attachment;
    oldTransaction.recurring = recurring;
    oldTransaction.recurringFrequency = recurringFrequency;
    oldTransaction.nextOccurrence = nextOccurrence;

    const updatedTransaction = await oldTransaction.save({
      session,
    });

    // ------------------------------------------
    // COMMIT EVERYTHING
    // ------------------------------------------
    await session.commitTransaction();

    // Get the latest account balance after commit
    const updatedAccount = await Account.findOne({
      _id: account,
      user: req.user.id,
    });

    res.status(200).json({
      message: "Transaction updated successfully",
      transaction: updatedTransaction,
      accountBalance: updatedAccount.balance,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Update transaction error:", error);

    res.status(500).json({
      message: "Failed to update transaction",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};


// ==========================================
// DELETE TRANSACTION
// ==========================================
const deleteTransaction = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // ------------------------------------------
    // Find transaction belonging to logged-in user
    // ------------------------------------------
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).session(session);

    if (!transaction) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    // ------------------------------------------
    // Find connected account
    // ------------------------------------------
    const account = await Account.findOne({
      _id: transaction.account,
      user: req.user.id,
    }).session(session);

    if (!account) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "Account not found",
      });
    }

    // ------------------------------------------
    // Reverse transaction effect
    // ------------------------------------------

    if (transaction.type === "income") {
      account.balance -= Number(transaction.amount);
    }

    if (transaction.type === "expense") {
      account.balance += Number(transaction.amount);
    }

    await account.save({ session });

    // ------------------------------------------
    // Delete transaction
    // ------------------------------------------
    await Transaction.deleteOne(
      {
        _id: transaction._id,
        user: req.user.id,
      },
      { session }
    );

    // ------------------------------------------
    // Commit everything
    // ------------------------------------------
    await session.commitTransaction();

    res.status(200).json({
      message: "Transaction deleted successfully",
      accountBalance: account.balance,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Delete transaction error:", error);

    res.status(500).json({
      message: "Failed to delete transaction",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};


// ==========================================
// CSV HELPER
// ==========================================
// Converts a value into a safe CSV value
// ==========================================
const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  let stringValue = String(value);

  // Prevent basic CSV formula injection
  if (/^[=+\-@]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }

  // Escape double quotes
  stringValue = stringValue.replace(/"/g, '""');

  // Wrap value inside quotes
  return `"${stringValue}"`;
};


// ==========================================
// EXPORT TRANSACTIONS AS CSV
// ==========================================
// Supports the same filters as transaction history:
//
// ?type=expense
// ?category=Food
// ?account=ACCOUNT_ID
// ?startDate=2026-09-01
// ?endDate=2026-09-30
// ?minAmount=100
// ?maxAmount=5000
// ?search=food
//
// Multiple filters can be combined.
//
// IMPORTANT:
// No pagination is used here.
// Every matching transaction is exported.
// ==========================================
const exportTransactions = async (req, res) => {
  try {
    const {
      type,
      category,
      account,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
    } = req.query;

    // ------------------------------------------
    // BASE FILTER
    // ------------------------------------------
    // VERY IMPORTANT:
    // Only export transactions belonging
    // to the logged-in user.
    // ------------------------------------------
    const filter = {
      user: req.user.id,
    };


    // ------------------------------------------
    // TYPE FILTER
    // ------------------------------------------
    if (type) {
      if (!["income", "expense"].includes(type)) {
        return res.status(400).json({
          message: "Invalid transaction type",
        });
      }

      filter.type = type;
    }


    // ------------------------------------------
    // CATEGORY FILTER
    // ------------------------------------------
    if (
      typeof category === "string" &&
      category.trim()
    ) {
      filter.category = category.trim();
    }


    // ------------------------------------------
    // ACCOUNT FILTER
    // ------------------------------------------
    if (account) {
      if (!mongoose.isValidObjectId(account)) {
        return res.status(400).json({
          message: "Invalid account ID",
        });
      }

      filter.account = account;
    }


    // ------------------------------------------
    // DATE FILTER
    // ------------------------------------------

    if (startDate) {
      const start = new Date(startDate);

      if (Number.isNaN(start.getTime())) {
        return res.status(400).json({
          message: "Invalid start date",
        });
      }

      filter.date = {
        ...(filter.date || {}),
        $gte: start,
      };
    }


    if (endDate) {
      const end = new Date(endDate);

      if (Number.isNaN(end.getTime())) {
        return res.status(400).json({
          message: "Invalid end date",
        });
      }

      // Include the entire end date
      end.setHours(23, 59, 59, 999);

      filter.date = {
        ...(filter.date || {}),
        $lte: end,
      };
    }


    // ------------------------------------------
    // AMOUNT FILTER
    // ------------------------------------------

    if (minAmount !== undefined) {
      const numericMinAmount = Number(minAmount);

      if (
        !Number.isFinite(numericMinAmount) ||
        numericMinAmount < 0
      ) {
        return res.status(400).json({
          message: "Invalid minimum amount",
        });
      }

      filter.amount = {
        ...(filter.amount || {}),
        $gte: numericMinAmount,
      };
    }


    if (maxAmount !== undefined) {
      const numericMaxAmount = Number(maxAmount);

      if (
        !Number.isFinite(numericMaxAmount) ||
        numericMaxAmount < 0
      ) {
        return res.status(400).json({
          message: "Invalid maximum amount",
        });
      }

      filter.amount = {
        ...(filter.amount || {}),
        $lte: numericMaxAmount,
      };
    }


    // ------------------------------------------
    // SEARCH
    // ------------------------------------------
    // Searches:
    // - note
    // - category
    // - exact amount
    // ------------------------------------------

    if (
      typeof search === "string" &&
      search.trim()
    ) {
      const searchText = search.trim();

      // Escape regex special characters
      // so user input cannot create an
      // unexpected regular expression.
      const escapedSearch = searchText.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const searchRegex = new RegExp(
        escapedSearch,
        "i"
      );

      const searchConditions = [
        {
          note: searchRegex,
        },
        {
          category: searchRegex,
        },
      ];

      // Search exact amount when search
      // value is numeric.
      const numericSearch = Number(searchText);

      if (Number.isFinite(numericSearch)) {
        searchConditions.push({
          amount: numericSearch,
        });
      }

      filter.$or = searchConditions;
    }


    // ------------------------------------------
    // GET ALL MATCHING TRANSACTIONS
    // ------------------------------------------
    // IMPORTANT:
    // No .skip()
    // No .limit()
    //
    // CSV export should contain ALL transactions
    // matching the active filters.
    // ------------------------------------------

    const transactions = await Transaction.find(filter)
      .populate("account", "name type")
      .sort({
        date: -1,
        createdAt: -1,
      });


    // ------------------------------------------
    // CSV HEADER
    // ------------------------------------------

    const csvRows = [
      [
        "Date",
        "Type",
        "Category",
        "Account",
        "Account Type",
        "Amount",
        "Note",
        "Recurring",
        "Recurring Frequency",
        "Next Occurrence",
      ]
        .map(escapeCsvValue)
        .join(","),
    ];


    // ------------------------------------------
    // CONVERT TRANSACTIONS TO CSV ROWS
    // ------------------------------------------

    transactions.forEach((transaction) => {
      const row = [
        // Date
        transaction.date
          ? transaction.date
              .toISOString()
              .split("T")[0]
          : "",

        // Income / Expense
        transaction.type,

        // Category
        transaction.category,

        // Account name
        transaction.account
          ? transaction.account.name
          : "",

        // Account type
        transaction.account
          ? transaction.account.type
          : "",

        // Amount
        transaction.amount,

        // Note
        transaction.note || "",

        // Recurring
        transaction.recurring
          ? "Yes"
          : "No",

        // Recurring frequency
        transaction.recurringFrequency || "",

        // Next occurrence
        transaction.nextOccurrence
          ? transaction.nextOccurrence
              .toISOString()
              .split("T")[0]
          : "",
      ];

      csvRows.push(
        row
          .map(escapeCsvValue)
          .join(",")
      );
    });


    // ------------------------------------------
    // CREATE CSV
    // ------------------------------------------

    const csv = csvRows.join("\n");


    // ------------------------------------------
    // CSV RESPONSE HEADERS
    // ------------------------------------------

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="expense-transactions.csv"'
    );


    // ------------------------------------------
    // SEND CSV
    // ------------------------------------------

    return res.status(200).send(csv);

  } catch (error) {
    console.error(
      "Export transactions error:",
      error
    );

    return res.status(500).json({
      message: "Failed to export transactions",
    });
  }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  exportTransactions,
};