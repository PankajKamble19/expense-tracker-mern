import cron from 'node-cron';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import Category from '../models/Category.js';
import { advanceRecurringDate } from '../utils/recurrence.js';

export const generateRecurringOccurrences = async () => {
  const now = new Date();
  const dueTransactions = await Transaction.find({
    recurring: true,
    recurrenceActive: true,
    recurrenceSource: null,
    nextOccurrence: { $lte: now },
  });

  for (const transaction of dueTransactions) {
    let scheduledFor = new Date(transaction.nextOccurrence);
    const anchorDate = transaction.recurrenceStartDate || transaction.date;
    let guard = 0;
    while (scheduledFor <= now && guard < 100) {
      const source = transaction._id.toString();
      const existing = await Transaction.exists({ recurrenceSource: source, scheduledFor });
      if (!existing) {
        const [accountExists, categoryExists] = await Promise.all([
          Account.exists({ _id: transaction.account, user: transaction.user }),
          Category.exists({ _id: transaction.category, user: transaction.user }),
        ]);
        if (!accountExists || !categoryExists) break;
        try {
          await Transaction.create({
            user: transaction.user,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category,
            account: transaction.account,
            note: transaction.note,
            date: scheduledFor,
            recurring: false,
            recurrenceFrequency: null,
            recurrenceActive: false,
            recurrenceSource: source,
            scheduledFor,
            parentRecurringTransaction: transaction._id,
          });
        } catch (error) {
          if (error?.code !== 11000) throw error;
        }
      }
      scheduledFor = advanceRecurringDate(
        scheduledFor,
        transaction.recurrenceFrequency || 'Monthly',
        anchorDate
      );
      guard += 1;
    }
    transaction.nextOccurrence = scheduledFor;
    await transaction.save();
  }
};

export const setupRecurringJobs = () => {
  cron.schedule('*/15 * * * *', async () => {
    try { await generateRecurringOccurrences(); }
    catch (error) { console.error('Recurring job failed:', error.message); }
  });
};
