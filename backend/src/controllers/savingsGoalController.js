const SavingsGoal = require("../models/SavingsGoal");

// CREATE SAVINGS GOAL
const createSavingsGoal = async (req, res) => {
  try {
    const {
      name,
      targetAmount,
      currentAmount = 0,
      targetDate,
    } = req.body;

    const savingsGoal = await SavingsGoal.create({
      user: req.user.id,
      name,
      targetAmount,
      currentAmount,
      targetDate,
    });

    const percentage =
      Number(targetAmount) > 0
        ? Math.round(
            (Number(currentAmount) / Number(targetAmount)) * 10000
          ) / 100
        : 0;

    res.status(201).json({
      message: "Savings goal created successfully",
      savingsGoal,
      progress: {
        percentage,
        remaining:
          Number(targetAmount) - Number(currentAmount),
      },
    });
  } catch (error) {
    console.error("Create savings goal error:", error);

    res.status(500).json({
      message: "Failed to create savings goal",
      error: error.message,
    });
  }
};

// GET ALL SAVINGS GOALS
const getSavingsGoals = async (req, res) => {
  try {
    const savingsGoals = await SavingsGoal.find({
      user: req.user.id,
    }).sort({
      targetDate: 1,
    });

    const goalsWithProgress = savingsGoals.map((goal) => {
      const target = Number(goal.targetAmount);
      const current = Number(goal.currentAmount);

      const percentage =
        target > 0
          ? Math.round((current / target) * 10000) / 100
          : 0;

      return {
        ...goal.toObject(),
        progress: {
          percentage: Math.min(percentage, 100),
          remaining: Math.max(target - current, 0),
          completed: current >= target,
        },
      };
    });

    res.status(200).json({
      count: goalsWithProgress.length,
      savingsGoals: goalsWithProgress,
    });
  } catch (error) {
    console.error("Get savings goals error:", error);

    res.status(500).json({
      message: "Failed to fetch savings goals",
      error: error.message,
    });
  }
};

// GET ONE SAVINGS GOAL
const getSavingsGoalById = async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!savingsGoal) {
      return res.status(404).json({
        message: "Savings goal not found",
      });
    }

    const target = Number(savingsGoal.targetAmount);
    const current = Number(savingsGoal.currentAmount);

    const percentage =
      target > 0
        ? Math.round((current / target) * 10000) / 100
        : 0;

    res.status(200).json({
      savingsGoal,
      progress: {
        percentage: Math.min(percentage, 100),
        remaining: Math.max(target - current, 0),
        completed: current >= target,
      },
    });
  } catch (error) {
    console.error("Get savings goal error:", error);

    res.status(500).json({
      message: "Failed to fetch savings goal",
      error: error.message,
    });
  }
};

// UPDATE SAVINGS GOAL
const updateSavingsGoal = async (req, res) => {
  try {
    const {
      name,
      targetAmount,
      currentAmount,
      targetDate,
    } = req.body;

    const savingsGoal = await SavingsGoal.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      {
        name,
        targetAmount,
        currentAmount,
        targetDate,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!savingsGoal) {
      return res.status(404).json({
        message: "Savings goal not found",
      });
    }

    const target = Number(savingsGoal.targetAmount);
    const current = Number(savingsGoal.currentAmount);

    const percentage =
      target > 0
        ? Math.round((current / target) * 10000) / 100
        : 0;

    res.status(200).json({
      message: "Savings goal updated successfully",
      savingsGoal,
      progress: {
        percentage: Math.min(percentage, 100),
        remaining: Math.max(target - current, 0),
        completed: current >= target,
      },
    });
  } catch (error) {
    console.error("Update savings goal error:", error);

    res.status(500).json({
      message: "Failed to update savings goal",
      error: error.message,
    });
  }
};

// DELETE SAVINGS GOAL
const deleteSavingsGoal = async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!savingsGoal) {
      return res.status(404).json({
        message: "Savings goal not found",
      });
    }

    res.status(200).json({
      message: "Savings goal deleted successfully",
    });
  } catch (error) {
    console.error("Delete savings goal error:", error);

    res.status(500).json({
      message: "Failed to delete savings goal",
      error: error.message,
    });
  }
};

module.exports = {
  createSavingsGoal,
  getSavingsGoals,
  getSavingsGoalById,
  updateSavingsGoal,
  deleteSavingsGoal,
};