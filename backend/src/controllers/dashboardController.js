
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const Budget = require("../models/Budget");

// Get dashboard summary
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // =====================================================
    // 1. GET USER ACCOUNTS
    // =====================================================

    const accounts = await Account.find({
      user: userId,
    });

    // Calculate total balance
    const totalBalance = accounts.reduce(
      (total, account) => total + Number(account.balance),
      0
    );

    // =====================================================
    // 2. GET USER TRANSACTIONS
    // =====================================================

    const transactions = await Transaction.find({
      user: userId,
    })
      .populate("account", "name type balance")
      .sort({
        date: -1,
        createdAt: -1,
      });

    // =====================================================
    // 3. TOTAL INCOME
    // =====================================================

    const totalIncome = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (total, transaction) => total + Number(transaction.amount),
        0
      );

    // =====================================================
    // 4. TOTAL EXPENSES
    // =====================================================

    const totalExpenses = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce(
        (total, transaction) => total + Number(transaction.amount),
        0
      );

    // =====================================================
    // 5. CURRENT MONTH
    // =====================================================

    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Create YYYY-MM format
    const currentMonthString = `${currentYear}-${String(
      currentMonth + 1
    ).padStart(2, "0")}`;

    // =====================================================
    // 6. FILTER CURRENT MONTH TRANSACTIONS
    // =====================================================

    const monthlyTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);

      return (
        transactionDate.getFullYear() === currentYear &&
        transactionDate.getMonth() === currentMonth
      );
    });

    // =====================================================
    // 7. MONTHLY INCOME
    // =====================================================

    const monthlyIncome = monthlyTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (total, transaction) => total + Number(transaction.amount),
        0
      );

    // =====================================================
    // 8. MONTHLY EXPENSES
    // =====================================================

    const monthlyExpenses = monthlyTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce(
        (total, transaction) => total + Number(transaction.amount),
        0
      );

    // =====================================================
    // 9. NET SAVINGS
    // =====================================================

    const netSavings = monthlyIncome - monthlyExpenses;

    // =====================================================
    // 10. GET CURRENT MONTH BUDGET
    // =====================================================

    const budget = await Budget.findOne({
      user: userId,
      month: currentMonthString,
    });

    const monthlyBudget = budget ? Number(budget.amount) : 0;

    // =====================================================
    // 11. REMAINING BUDGET
    // =====================================================

    const remainingBudget = monthlyBudget > 0 ? monthlyBudget - monthlyExpenses : 0;

    // =====================================================
    // 12. BUDGET PERCENTAGE USED
    // =====================================================

    let budgetPercentageUsed = 0;

    if (monthlyBudget > 0) {
      budgetPercentageUsed =
        (monthlyExpenses / monthlyBudget) * 100;
    }

    // Don't allow the displayed percentage to be negative
    budgetPercentageUsed = Math.max(
      budgetPercentageUsed,
      0
    );

    // Round to 2 decimal places
    budgetPercentageUsed =
      Math.round(budgetPercentageUsed * 100) / 100;

    // =====================================================
    // 13. BUDGET WARNING LEVEL
    // =====================================================

    let budgetStatus = "safe";

if (budgetPercentageUsed >= 100) {
  budgetStatus = "exceeded";
} else if (budgetPercentageUsed >= 90) {
  budgetStatus = "critical";
} else if (budgetPercentageUsed >= 75) {
  budgetStatus = "warning";
} else if (budgetPercentageUsed >= 50) {
  budgetStatus = "caution";
}

    // =====================================================
    // 14. RECENT TRANSACTIONS
    // =====================================================

    const recentTransactions = transactions.slice(0, 10);

    // =====================================================
    // 15. CHART DATA
    // =====================================================

    const chartData = [
      {
        type: "income",
        amount: monthlyIncome,
      },
      {
        type: "expense",
        amount: monthlyExpenses,
      },
    ];

    // =====================================================
    // 16. RESPONSE
    // =====================================================

    res.status(200).json({
      summary: {
        totalBalance,
        totalIncome,
        totalExpenses,

        monthlyIncome,
        monthlyExpenses,
        netSavings,

        monthlyBudget,
        remainingBudget,
        budgetPercentageUsed,
        budgetStatus,
      },

      recentTransactions,

      chartData,
    });
  } catch (error) {
    console.error("Get dashboard error:", error);

    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboard,
};

