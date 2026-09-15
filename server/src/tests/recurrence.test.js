import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { generateRecurringOccurrences } from '../jobs/recurringJobs.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Account from '../models/Account.js';

jest.setTimeout(60000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'spendwise-recurring-test' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Recurring transaction utility', () => {
  beforeEach(async () => {
    await Transaction.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});
    await Account.deleteMany({});
  });

  it('creates a new occurrence once for a due recurring transaction', async () => {
    const user = await User.create({ name: 'User', email: 'rec@example.com', passwordHash: 'hash' });
    const category = await Category.create({ user: user._id, name: 'Salary', type: 'Income', icon: 'badge' });
    const account = await Account.create({ user: user._id, name: 'Bank', type: 'Bank Account' });

    const base = await Transaction.create({
      user: user._id,
      amount: 2500,
      type: 'Income',
      category: category._id,
      account: account._id,
      recurring: true,
      recurrenceFrequency: 'Monthly',
      recurrenceStartDate: new Date(),
      nextOccurrence: new Date(Date.now() - 1000),
      recurrenceActive: true,
    });

    await generateRecurringOccurrences();
    const occurrences = await Transaction.find({ recurrenceSource: base._id.toString() }).countDocuments();

    expect(occurrences).toBeGreaterThan(0);
  });
});
