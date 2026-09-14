
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

// CREATE OR UPDATE MONTHLY / CATEGORY BUDGET
const createBudget = async (req, res) => {
  try {
    const {
      amount,
      month,
      category = null,
    } = req.body;

    const normalizedCategory = category
      ? category.trim()
      : null;

    const budget = await Budget.findOneAndUpdate(
      {
        user: req.user.id,
        month,
        category: normalizedCategory,
      },
      {
        user: req.user.id,
        amount,
        month,
        category: normalizedCategory,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      message: normalizedCategory
        ? "Category budget saved successfully"
        : "Overall budget saved successfully",

      budget,
    });
  } catch (error) {
    console.error("Create budget error:", error);

    res.status(500).json({
      message: "Failed to save budget",
      error: error.message,
    });
  }
};

// GET ALL USER BUDGETS
const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({
      user: req.user.id,
    }).sort({
      month: -1,
      category: 1,
    });

    res.status(200).json({
      count: budgets.length,
      budgets,
    });
  } catch (error) {
    console.error("Get budgets error:", error);

    res.status(500).json({
      message: "Failed to fetch budgets",
      error: error.message,
    });
  }
};

// GET OVERALL BUDGET FOR ONE MONTH
const getBudgetByMonth = async (req, res) => {
  try {
    const { month } = req.params;

    const budget = await Budget.findOne({
      user: req.user.id,
      month,
      category: null,
    });

    if (!budget) {
      return res.status(404).json({
        message: "Overall budget not found for this month",
      });
    }

    res.status(200).json({
      budget,
    });
  } catch (error) {
    console.error("Get budget error:", error);

    res.status(500).json({
      message: "Failed to fetch budget",
      error: error.message,
    });
  }
};

// GET CATEGORY BUDGETS FOR ONE MONTH
const getCategoryBudgets = async (req, res) => {
  try {
    const { month } = req.params;

    const budgets = await Budget.find({
      user: req.user.id,
      month,
      category: {
        $ne: null,
      },
    }).sort({
      category: 1,
    });

    // Calculate spending for every category
    const categoryBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const transactions = await Transaction.find({
          user: req.user.id,
          category: budget.category,
          type: "expense",
          date: {
            $gte: new Date(`${month}-01T00:00:00.000Z`),
            $lt: new Date(
              new Date(`${month}-01T00:00:00.000Z`).setUTCMonth(
                new Date(`${month}-01T00:00:00.000Z`).getUTCMonth() + 1
              )
            ),
          },
        });

        const spent = transactions.reduce(
          (total, transaction) =>
            total + Number(transaction.amount),
          0
        );

        const remaining = Number(budget.amount) - spent;

        const percentageUsed =
          Number(budget.amount) > 0
            ? Math.round(
                (spent / Number(budget.amount)) * 10000
              ) / 100
            : 0;

        let status = "safe";

        if (percentageUsed >= 100) {
          status = "exceeded";
        } else if (percentageUsed >= 90) {
          status = "critical";
        } else if (percentageUsed >= 75) {
          status = "warning";
        } else if (percentageUsed >= 50) {
          status = "caution";
        }

        return {
          budget: budget.amount,
          category: budget.category,
          month: budget.month,
          spent,
          remaining,
          percentageUsed,
          status,
        };
      })
    );

    res.status(200).json({
      count: categoryBudgets.length,
      categoryBudgets,
    });
  } catch (error) {
    console.error(
      "Get category budgets error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch category budgets",
      error: error.message,
    });
  }
};

// DELETE BUDGET
const deleteBudget = async (req, res) => {
  try {
    const { month } = req.params;

    const budget = await Budget.findOneAndDelete({
      user: req.user.id,
      month,
      category: null,
    });

    if (!budget) {
      return res.status(404).json({
        message: "Overall budget not found",
      });
    }

    res.status(200).json({
      message: "Overall budget deleted successfully",
    });
  } catch (error) {
    console.error("Delete budget error:", error);

    res.status(500).json({
      message: "Failed to delete budget",
      error: error.message,
    });
  }
};

// DELETE CATEGORY BUDGET
const deleteCategoryBudget = async (req, res) => {
  try {
    const { month, category } = req.params;

    const budget = await Budget.findOneAndDelete({
      user: req.user.id,
      month,
      category,
    });

    if (!budget) {
      return res.status(404).json({
        message: "Category budget not found",
      });
    }

    res.status(200).json({
      message: "Category budget deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete category budget error:",
      error
    );

    res.status(500).json({
      message: "Failed to delete category budget",
      error: error.message,
    });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetByMonth,
  getCategoryBudgets,
  deleteBudget,
  deleteCategoryBudget,
};

