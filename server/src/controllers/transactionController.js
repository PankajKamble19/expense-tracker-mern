import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import Account from '../models/Account.js';
import { transactionSchema, transactionQuerySchema } from '../validators/transactionValidators.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const normalizeDate = (value) => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilters = async (userId, data) => {
  const filters = { user: userId };
  if (data.type) filters.type = data.type;
  if (data.category) filters.category = data.category;
  if (data.account) filters.account = data.account;

  if (data.startDate || data.endDate) {
    filters.date = {};
    if (data.startDate) filters.date.$gte = new Date(`${data.startDate}T00:00:00`);
    if (data.endDate) filters.date.$lte = new Date(`${data.endDate}T23:59:59.999`);
  }

  if (data.minAmount !== undefined || data.maxAmount !== undefined) {
    filters.amount = {};
    if (data.minAmount !== undefined) filters.amount.$gte = data.minAmount;
    if (data.maxAmount !== undefined) filters.amount.$lte = data.maxAmount;
  }

  if (data.search?.trim()) {
    const search = data.search.trim();
    const categoryIds = await Category.find({
      user: userId,
      name: { $regex: escapeRegExp(search), $options: 'i' },
    }).distinct('_id');

    const or = [
      { note: { $regex: escapeRegExp(search), $options: 'i' } },
      ...(categoryIds.length ? [{ category: { $in: categoryIds } }] : []),
    ];
    const numeric = Number(search.replace(/,/g, ''));
    if (search !== '' && Number.isFinite(numeric)) or.push({ amount: numeric });
    filters.$or = or;
  }

  return filters;
};

const csvEscape = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};


export const uploadTransactionAttachment = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'Please select an attachment', 400);
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
    if (!allowed.has(req.file.mimetype)) return sendError(res, 'Only JPG, PNG, WEBP and PDF files are allowed', 400);

    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET });
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `spendwise/${req.user._id}`, resource_type: 'auto' },
          (error, result) => error ? reject(error) : resolve(result)
        );
        stream.end(req.file.buffer);
      });
      return sendSuccess(res, 'Attachment uploaded', { url: uploaded.secure_url, publicId: uploaded.public_id, originalName: req.file.originalname }, 201);
    }

    const uploadDir = path.resolve(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const ext = path.extname(req.file.originalname).replace(/[^.a-zA-Z0-9]/g, '').slice(0, 10) || '';
    const filename = `${req.user._id}-${randomUUID()}${ext}`;
    await fs.writeFile(path.join(uploadDir, filename), req.file.buffer);
    const url = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    return sendSuccess(res, 'Attachment uploaded', { url, publicId: filename, originalName: req.file.originalname }, 201);
  } catch (error) { next(error); }
};

export const getTransactions = async (req, res, next) => {
  try {
    const parsed = transactionQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors);

    const data = parsed.data;
    const filters = await buildFilters(req.user._id, data);
    const sortMap = {
      newest: { date: -1, createdAt: -1 },
      oldest: { date: 1, createdAt: 1 },
      highest: { amount: -1, date: -1 },
      lowest: { amount: 1, date: -1 },
    };

    const [items, total] = await Promise.all([
      Transaction.find(filters)
        .populate('category', 'name type icon')
        .populate('account', 'name type')
        .sort(sortMap[data.sort])
        .skip((data.page - 1) * data.limit)
        .limit(data.limit)
        .lean(),
      Transaction.countDocuments(filters),
    ]);

    return sendSuccess(res, 'Transactions fetched', {
      items,
      pagination: {
        page: data.page,
        limit: data.limit,
        total,
        pages: Math.ceil(total / data.limit),
        hasNextPage: data.page * data.limit < total,
        hasPrevPage: data.page > 1,
      },
    });
  } catch (error) { next(error); }
};

export const createTransaction = async (req, res, next) => {
  try {
    const parsed = transactionSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors);

    const { category, account, type } = parsed.data;
    if (!mongoose.Types.ObjectId.isValid(category) || !mongoose.Types.ObjectId.isValid(account)) {
      return sendError(res, 'Invalid category or account', 400);
    }
    const [categoryDoc, accountDoc] = await Promise.all([
      Category.findOne({ _id: category, user: req.user._id }),
      Account.findOne({ _id: account, user: req.user._id }),
    ]);
    if (!categoryDoc) return sendError(res, 'Category not found', 404);
    if (!accountDoc) return sendError(res, 'Account not found', 404);
    if (categoryDoc.type !== type) return sendError(res, 'Category does not match transaction type', 400);

    const date = parsed.data.date ? normalizeDate(`${parsed.data.date}T12:00:00`) : new Date();
    const payload = {
      ...parsed.data,
      user: req.user._id,
      date,
      recurring: Boolean(parsed.data.recurring),
      recurrenceFrequency: parsed.data.recurring ? parsed.data.recurrenceFrequency || 'Monthly' : null,
      recurrenceStartDate: parsed.data.recurring ? date : null,
      nextOccurrence: null,
    };

    if (payload.recurring) {
      const next = new Date(date);
      if (payload.recurrenceFrequency === 'Daily') next.setDate(next.getDate() + 1);
      if (payload.recurrenceFrequency === 'Weekly') next.setDate(next.getDate() + 7);
      if (payload.recurrenceFrequency === 'Monthly') next.setMonth(next.getMonth() + 1);
      if (payload.recurrenceFrequency === 'Yearly') next.setFullYear(next.getFullYear() + 1);
      payload.nextOccurrence = next;
    }

    const transaction = await Transaction.create(payload);
    await transaction.populate([{ path: 'category', select: 'name type icon' }, { path: 'account', select: 'name type' }]);
    return sendSuccess(res, 'Transaction created successfully', transaction, 201);
  } catch (error) { next(error); }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid transaction ID', 400);
    const transaction = await Transaction.findOne({ _id: id, user: req.user._id })
      .populate('category', 'name type icon').populate('account', 'name type');
    if (!transaction) return sendError(res, 'Transaction not found', 404);
    return sendSuccess(res, 'Transaction fetched', transaction);
  } catch (error) { next(error); }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid transaction ID', 400);
    const parsed = transactionSchema.partial().safeParse(req.body);
    if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors);

    const existing = await Transaction.findOne({ _id: id, user: req.user._id });
    if (!existing) return sendError(res, 'Transaction not found', 404);
    const finalType = parsed.data.type || existing.type;
    const finalCategory = parsed.data.category || existing.category;
    const finalAccount = parsed.data.account || existing.account;

    if (!mongoose.Types.ObjectId.isValid(finalCategory) || !mongoose.Types.ObjectId.isValid(finalAccount)) {
      return sendError(res, 'Invalid category or account', 400);
    }
    const [categoryDoc, accountDoc] = await Promise.all([
      Category.findOne({ _id: finalCategory, user: req.user._id }),
      Account.findOne({ _id: finalAccount, user: req.user._id }),
    ]);
    if (!categoryDoc) return sendError(res, 'Category not found', 404);
    if (!accountDoc) return sendError(res, 'Account not found', 404);
    if (categoryDoc.type !== finalType) return sendError(res, 'Category does not match transaction type', 400);

    const changes = { ...parsed.data };
    if (parsed.data.date) changes.date = normalizeDate(`${parsed.data.date}T12:00:00`);
    if (parsed.data.recurring === false) {
      changes.recurrenceFrequency = null;
      changes.nextOccurrence = null;
      changes.recurrenceActive = false;
    } else if (parsed.data.recurring === true || (existing.recurring && (parsed.data.recurrenceFrequency || parsed.data.date))) {
      const frequency = parsed.data.recurrenceFrequency || existing.recurrenceFrequency || 'Monthly';
      const base = changes.date || existing.date || new Date();
      const nextDate = new Date(base);
      if (frequency === 'Daily') nextDate.setDate(nextDate.getDate() + 1);
      if (frequency === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
      if (frequency === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      if (frequency === 'Yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
      changes.recurring = true;
      changes.recurrenceFrequency = frequency;
      changes.recurrenceStartDate = changes.date || existing.recurrenceStartDate || existing.date;
      changes.nextOccurrence = nextDate;
      changes.recurrenceActive = true;
    }

    const updated = await Transaction.findOneAndUpdate(
      { _id: id, user: req.user._id }, { $set: changes }, { new: true, runValidators: true }
    ).populate('category', 'name type icon').populate('account', 'name type');
    return sendSuccess(res, 'Transaction updated successfully', updated);
  } catch (error) { next(error); }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid transaction ID', 400);
    const transaction = await Transaction.findOneAndDelete({ _id: id, user: req.user._id });
    if (!transaction) return sendError(res, 'Transaction not found', 404);
    return sendSuccess(res, 'Transaction deleted successfully');
  } catch (error) { next(error); }
};

export const exportTransactions = async (req, res, next) => {
  try {
    const query = transactionQuerySchema.safeParse({ ...req.query, page: 1, limit: 100 });
    if (!query.success) return sendError(res, 'Validation failed', 400, query.error.flatten().fieldErrors);
    const filters = await buildFilters(req.user._id, query.data);
    const transactions = await Transaction.find(filters)
      .populate('category', 'name').populate('account', 'name').sort({ date: -1 }).lean();

    const rows = [['Date', 'Type', 'Category', 'Account', 'Amount', 'Note']];
    for (const item of transactions) {
      rows.push([
        item.date ? new Date(item.date).toISOString().slice(0, 10) : '',
        item.type,
        item.category?.name || '',
        item.account?.name || '',
        item.amount,
        item.note || '',
      ]);
    }
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="spendwise-transactions.csv"');
    return res.status(200).send(`\uFEFF${csv}`);
  } catch (error) { next(error); }
};
