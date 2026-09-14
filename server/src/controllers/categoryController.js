import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import { categorySchema } from '../validators/accountValidators.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.user._id }).sort({ type: 1, name: 1 });
    return sendSuccess(res, 'Categories fetched', categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors);
    }

    const normalized = { ...parsed.data, name: parsed.data.name.trim(), user: req.user._id };

    const existing = await Category.findOne({
      user: req.user._id,
      type: normalized.type,
      name: { $regex: `^${normalized.name}$`, $options: 'i' },
    });

    if (existing) {
      return sendError(res, `Category "${normalized.name}" already exists for this user`, 409);
    }

    const category = await Category.create(normalized);
    return sendSuccess(res, 'Category created', category, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid category ID', 400);
    }

    const parsed = categorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors);
    }

    const category = await Category.findOne({ _id: id, user: req.user._id });
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    if (parsed.data.name) {
      const duplicate = await Category.findOne({
        user: req.user._id,
        type: parsed.data.type || category.type,
        name: { $regex: `^${parsed.data.name.trim()}$`, $options: 'i' },
        _id: { $ne: id },
      });

      if (duplicate) {
        return sendError(res, `Category "${parsed.data.name.trim()}" already exists for this user`, 409);
      }
    }

    Object.assign(category, parsed.data);
    await category.save();
    return sendSuccess(res, 'Category updated', category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid category ID', 400);
    }

    const usageCount = await Transaction.countDocuments({ user: req.user._id, category: id });
    if (usageCount > 0) {
      return sendError(res, `This category is used by ${usageCount} transactions and cannot be deleted.`, 400);
    }

    const category = await Category.findOneAndDelete({ _id: id, user: req.user._id });
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    return sendSuccess(res, 'Category deleted');
  } catch (error) {
    next(error);
  }
};
