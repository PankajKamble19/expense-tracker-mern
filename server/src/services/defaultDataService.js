import Category from '../models/Category.js';
import Account from '../models/Account.js';

const defaultAccounts = [
  { name: 'Cash', type: 'Cash', openingBalance: 0, icon: 'wallet', color: '#10b981' },
  { name: 'Bank Account', type: 'Bank Account', openingBalance: 0, icon: 'landmark', color: '#6366f1' },
  { name: 'Credit Card', type: 'Credit Card', openingBalance: 0, icon: 'credit-card', color: '#f43f5e' },
  { name: 'Wallet', type: 'Wallet', openingBalance: 0, icon: 'wallet2', color: '#f59e0b' },
  { name: 'Savings', type: 'Savings', openingBalance: 0, icon: 'piggy-bank', color: '#14b8a6' },
];

const defaultCategories = {
  Expense: [
    'Food',
    'Travel',
    'Shopping',
    'Bills',
    'Rent',
    'Entertainment',
    'Health',
    'Education',
    'Subscription',
    'Other',
  ],
  Income: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'],
};

export const seedDefaultDataForUser = async (userId) => {
  const accountPromises = defaultAccounts.map((account) =>
    Account.findOneAndUpdate(
      { user: userId, name: account.name },
      { $set: { ...account, user: userId } },
      { upsert: true, new: true }
    )
  );

  await Promise.all(accountPromises);

  const categoryEntries = Object.entries(defaultCategories).flatMap(([type, names]) =>
    names.map((name) => ({
      user: userId,
      name,
      type,
      icon: type === 'Expense' ? 'tag' : 'receipt',
      custom: false,
    }))
  );

  await Promise.all(
    categoryEntries.map((entry) =>
      Category.findOneAndUpdate(
        { user: userId, type: entry.type, name: entry.name },
        { $set: entry },
        { upsert: true, new: true }
      )
    )
  );

  return { accounts: defaultAccounts.length, categories: categoryEntries.length };
};
