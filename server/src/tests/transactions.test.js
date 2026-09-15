import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import Account from '../models/Account.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';

jest.setTimeout(60000);
let mongoServer;
let tokenA;
let tokenB;
let categoryA;
let accountA;
let transactionA;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'spendwise-transactions-test' });
});
afterAll(async () => { await mongoose.disconnect(); await mongoServer.stop(); });

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Transaction.deleteMany({}), Category.deleteMany({}), Account.deleteMany({}), Budget.deleteMany({}), Goal.deleteMany({})]);
  const regA = await request(app).post('/api/auth/register').send({ name:'User A', email:'a@test.com', password:'password123', confirmPassword:'password123', preferredCurrency:'INR' });
  const regB = await request(app).post('/api/auth/register').send({ name:'User B', email:'b@test.com', password:'password123', confirmPassword:'password123', preferredCurrency:'INR' });
  tokenA = regA.body.data.token; tokenB = regB.body.data.token;
  const userA = await User.findOne({ email:'a@test.com' });
  categoryA = await Category.findOne({ user:userA._id, type:'Expense', name:'Food' });
  accountA = await Account.findOne({ user:userA._id, name:'Cash' });
  const created = await request(app).post('/api/transactions').set('Authorization',`Bearer ${tokenA}`).send({ amount:250, type:'Expense', category:String(categoryA._id), account:String(accountA._id), note:'Lunch', date:'2026-09-14' });
  transactionA = created.body.data;
});

describe('transaction CRUD and isolation', () => {
  it('creates and lists transactions', async () => {
    const res = await request(app).get('/api/transactions').set('Authorization',`Bearer ${tokenA}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].note).toBe('Lunch');
  });

  it('updates own transaction', async () => {
    const res = await request(app).patch(`/api/transactions/${transactionA._id}`).set('Authorization',`Bearer ${tokenA}`).send({ amount:300 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.amount).toBe(300);
  });

  it('deletes own transaction', async () => {
    const res = await request(app).delete(`/api/transactions/${transactionA._id}`).set('Authorization',`Bearer ${tokenA}`);
    expect(res.statusCode).toBe(200);
    expect(await Transaction.countDocuments({ _id:transactionA._id })).toBe(0);
  });

  it('blocks user B from GET/PATCH/DELETE on user A transaction', async () => {
    for (const method of ['get','patch','delete']) {
      let req = request(app)[method](`/api/transactions/${transactionA._id}`).set('Authorization',`Bearer ${tokenB}`);
      if (method === 'patch') req = req.send({ amount:999 });
      const res = await req;
      expect(res.statusCode).toBe(404);
    }
  });

  it('exports real CSV with populated names', async () => {
    const res = await request(app).get('/api/transactions/export?type=Expense').set('Authorization',`Bearer ${tokenA}`);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('Date,Type,Category,Account,Amount,Note');
    expect(res.text).toContain('Food');
    expect(res.text).toContain('Cash');
    expect(res.text).toContain('Lunch');
  });
});
