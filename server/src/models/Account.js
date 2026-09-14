import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Cash', 'Bank Account', 'Credit Card', 'Wallet', 'Savings', 'Other'],
      default: 'Cash',
    },
    openingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    icon: {
      type: String,
      default: 'wallet',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
  },
  { timestamps: true }
);

accountSchema.index({ user: 1, name: 1 }, { unique: true });

const Account = mongoose.model('Account', accountSchema);
export default Account;
