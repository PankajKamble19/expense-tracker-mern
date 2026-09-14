import mongoose from 'mongoose';
import Goal from '../models/Goal.js';
import { goalSchema } from '../validators/accountValidators.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    return sendSuccess(res, 'Goals fetched', goals);
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const parsed = goalSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors);
    }

    const goal = await Goal.create({
      ...parsed.data,
      user: req.user._id,
      targetDate: new Date(parsed.data.targetDate),
    });

    return sendSuccess(res, 'Goal created', goal, 201);
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid goal ID', 400);
    }

    const parsed = goalSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors);
    }

    const goal = await Goal.findOne({ _id: id, user: req.user._id });
    if (!goal) {
      return sendError(res, 'Goal not found', 404);
    }

    if (parsed.data.targetDate) {
      parsed.data.targetDate = new Date(parsed.data.targetDate);
    }

    Object.assign(goal, parsed.data);
    await goal.save();
    return sendSuccess(res, 'Goal updated', goal);
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid goal ID', 400);
    }

    const goal = await Goal.findOneAndDelete({ _id: id, user: req.user._id });
    if (!goal) {
      return sendError(res, 'Goal not found', 404);
    }

    return sendSuccess(res, 'Goal deleted');
  } catch (error) {
    next(error);
  }
};
