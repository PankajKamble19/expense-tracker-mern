
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");

const calculateNextOccurrence = (date, frequency) => {
  const nextDate = new Date(date);

  switch (frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;

    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;

    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;

    default:
      return null;
  }

  return nextDate;
};

const processRecurringTransactions = async () => {
  try {
    const now = new Date();

    // Only recurring template transactions are processed
    const recurringTransactions = await Transaction.find({
      recurring: true,
      nextOccurrence: {
        $lte: now,
      },
    });

    for (const recurringTransaction of recurringTransactions) {
      const account = await Account.findOne({
        _id: recurringTransaction.account,
        user: recurringTransaction.user,
      });

      if (!account) {
        console.log(
          `Account not found for recurring transaction ${recurringTransaction._id}`
        );
        continue;
      }

      let nextOccurrence = new Date(
        recurringTransaction.nextOccurrence
      );

      // Process every missed occurrence
      while (nextOccurrence <= now) {
        const followingOccurrence = calculateNextOccurrence(
          nextOccurrence,
          recurringTransaction.recurringFrequency
        );

        if (!followingOccurrence) {
          console.log(
            `Invalid recurring frequency for transaction ${recurringTransaction._id}`
          );
          break;
        }

        // Create actual transaction.
        // IMPORTANT: This is NOT another recurring template.
        await Transaction.create({
          user: recurringTransaction.user,
          amount: recurringTransaction.amount,
          type: recurringTransaction.type,
          category: recurringTransaction.category,
          account: recurringTransaction.account,
          note: recurringTransaction.note,
          date: nextOccurrence,
          attachment: recurringTransaction.attachment,
          recurring: false,
          recurringFrequency: null,
          nextOccurrence: null,
        });

        // Update account balance
        if (recurringTransaction.type === "income") {
          account.balance += recurringTransaction.amount;
        } else {
          account.balance -= recurringTransaction.amount;
        }

        // Move to the next occurrence
        nextOccurrence = followingOccurrence;
      }

      await account.save();

      // Keep the original recurring template
      // and move it to the next future occurrence.
      recurringTransaction.nextOccurrence = nextOccurrence;

      await recurringTransaction.save();

      console.log(
        `Processed recurring transaction: ${recurringTransaction._id}`
      );
    }
  } catch (error) {
    console.error(
      "Recurring transaction processing failed:",
      error.message
    );
  }
};

module.exports = {
  processRecurringTransactions,
  calculateNextOccurrence,
};

