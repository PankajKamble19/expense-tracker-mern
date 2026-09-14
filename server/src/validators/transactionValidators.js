import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const dateString = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Enter a valid date');

export const transactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  type: z.enum(['Income', 'Expense']),
  category: objectId,
  account: objectId,
  note: z.string().trim().max(200).optional().or(z.literal('')),
  date: dateString.optional(),
  attachment: z.object({
    url: z.string().url().max(2048),
    publicId: z.string().trim().min(1).max(500),
    originalName: z.string().trim().min(1).max(255),
  }).strict().optional(),
  recurring: z.boolean().optional(),
  recurrenceFrequency: z.enum(['Daily', 'Weekly', 'Monthly', 'Yearly']).optional().nullable(),
}).strict();

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: z.enum(['Income', 'Expense']).optional(),
  category: objectId.optional(),
  account: objectId.optional(),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).default('newest'),
}).strict().superRefine((data, ctx) => {
  if (data.minAmount !== undefined && data.maxAmount !== undefined && data.minAmount > data.maxAmount) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['maxAmount'], message: 'Maximum amount must be at least the minimum amount' });
  }
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date must be on or after start date' });
  }
});

export const analyticsQuerySchema = z.object({
  range: z.enum(['Week', 'Month', '3 Months', 'Year']).default('Month'),
}).strict();
