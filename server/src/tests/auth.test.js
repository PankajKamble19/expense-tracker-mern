import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import Account from '../models/Account.js';

jest.setTimeout(60000);

let mongoServer;
let authTokenForUserA;
let authTokenForUserB;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'spendwise-test' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Transaction.deleteMany({});
  await Category.deleteMany({});
  await Account.deleteMany({});
});

describe('Auth API', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      preferredCurrency: 'INR',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('user@example.com');
  });

  it('rejects duplicate registration', async () => {
    await User.create({
      name: 'Alice',
      email: 'dup@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Bob',
      email: 'dup@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      preferredCurrency: 'INR',
    });

    expect(res.statusCode).toBe(409);
  });

  it('rejects invalid login', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      preferredCurrency: 'INR',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'wrongpass',
    });

    expect(res.statusCode).toBe(401);
  });

  it('logs in successfully', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'login@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      preferredCurrency: 'INR',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe('login@example.com');
  });

  it('rejects protected endpoint without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

describe('User isolation and transaction security', () => {
  beforeEach(async () => {
    const userA = await User.create({
      name: 'User A',
      email: 'a@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      preferredCurrency: 'INR',
    });

    const userB = await User.create({
      name: 'User B',
      email: 'b@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      preferredCurrency: 'INR',
    });

    const categoryA = await Category.create({ user: userA._id, name: 'Food', type: 'Expense', icon: 'utensils' });
    const accountA = await Account.create({ user: userA._id, name: 'Cash', type: 'Cash', openingBalance: 1000 });
    const categoryB = await Category.create({ user: userB._id, name: 'Food', type: 'Expense', icon: 'utensils' });
    const accountB = await Account.create({ user: userB._id, name: 'Cash', type: 'Cash', openingBalance: 1000 });

    await Transaction.create({ user: userA._id, amount: 250, type: 'Expense', category: categoryA._id, account: accountA._id, note: 'A transaction' });
    await Transaction.create({ user: userB._id, amount: 300, type: 'Expense', category: categoryB._id, account: accountB._id, note: 'B transaction' });

    const responseA = await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'password123' });
    authTokenForUserA = responseA.body.data.token;

    const responseB = await request(app).post('/api/auth/login').send({ email: 'b@example.com', password: 'password123' });
    authTokenForUserB = responseB.body.data.token;
  });

  it('should prevent access to another user transaction', async () => {
    const userATransaction = await Transaction.findOne({ note: 'A transaction' });

    const res = await request(app)
      .get(`/api/transactions/${userATransaction._id}`)
      .set('Authorization', `Bearer ${authTokenForUserB}`);

    expect(res.statusCode).toBe(404);
  });

  it('should keep transaction list isolated', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${authTokenForUserB}`);

    const userB = await User.findOne({ email: 'b@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.items.every((item) => String(item.user) === String(userB._id))).toBe(true);
  });
});
