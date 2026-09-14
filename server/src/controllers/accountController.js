import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import { accountSchema } from '../validators/accountValidators.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import mongoose from 'mongoose';

const formatAccountData = (account) => ({
  ...account._doc,
  balance: 0,
});

export const getAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: -1 });

    const accountIds = accounts.map((account) => account._id);
    const transactionAgg = await Transaction.aggregate([
      { $match: { user: req.user._id, account: { $in: accountIds } } },
      {
        $group: {
          _id: '$account',
          income: { $sum: { $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0] } },
          expenses: { $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0] } },
        },
      },
    ]);

    const balances = Object.fromEntries(
      transactionAgg.map((item) => [String(item._id), item.income - item.expenses])
    );

    const data = accounts.map((account) => ({
      ...account.toObject(),
      balance: (account.openingBalance || 0) + (balances[String(account._id)] || 0),
    }));

    return sendSuccess(res, 'Accounts fetched', data);
  } catch (error) {
    next(error);
  }
};

export const createAccount = async (req, res, next) => {
  try {
    const parsed = accountSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors);
    }

    const account = await Account.create({
      ...parsed.data,
      user: req.user._id,
    });

    return sendSuccess(res, 'Account created', account, 201);
  } catch (error) {
    next(error);
  }
};

export const getAccountById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid account ID', 400);
    }

    const account = await Account.findOne({ _id: id, user: req.user._id });
    if (!account) {
      return sendError(res, 'Account not found', 404);
    }

    const accountIncome = await Transaction.aggregate([
      { $match: { user: req.user._id, account: account._id, type: 'Income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const accountExpense = await Transaction.aggregate([
      { $match: { user: req.user._id, account: account._id, type: 'Expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const balance = (account.openingBalance || 0) + (accountIncome[0]?.total || 0) - (accountExpense[0]?.total || 0);

    return sendSuccess(res, 'Account fetched', { ...account.toObject(), balance });
  } catch (error) {
    next(error);
  }
};

export const updateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid account ID', 400);
    }

    const parsed = accountSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors);
    }

    const account = await Account.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: parsed.data },
      { new: true }
    );

    if (!account) {
      return sendError(res, 'Account not found', 404);
    }

    return sendSuccess(res, 'Account updated', account);
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid account ID', 400);
    }

    const transactionCount = await Transaction.countDocuments({ user: req.user._id, account: id });
    if (transactionCount > 0) {
      return sendError(res, `This account contains ${transactionCount} transactions and cannot be deleted.`, 400);
    }

    const account = await Account.findOneAndDelete({ _id: id, user: req.user._id });
    if (!account) {
      return sendError(res, 'Account not found', 404);
    }

    return sendSuccess(res, 'Account deleted');
  } catch (error) {
    next(error);
  }
};
