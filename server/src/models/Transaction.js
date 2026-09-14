import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    type: {
      type: String,
      enum: ['Income', 'Expense'],
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    attachment: {
      url: String,
      publicId: String,
      originalName: String,
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    recurrenceFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly', null],
      default: null,
    },
    nextOccurrence: {
      type: Date,
      default: null,
    },
    recurrenceStartDate: {
      type: Date,
      default: null,
    },
    parentRecurringTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    recurrenceActive: {
      type: Boolean,
      default: true,
    },
    recurrenceSource: {
      type: String,
      default: null,
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index(
  { recurrenceSource: 1, scheduledFor: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      recurrenceSource: { $type: 'string' },
      scheduledFor: { $type: 'date' },
    },
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
