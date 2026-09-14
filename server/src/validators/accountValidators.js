import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().trim().min(2, 'Account name must be at least 2 characters').max(100),
  type: z.enum(['Cash', 'Bank Account', 'Credit Card', 'Wallet', 'Savings', 'Other']).default('Cash'),
  openingBalance: z.coerce.number().min(0, 'Opening balance cannot be negative').default(0),
  icon: z.string().trim().max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a six-digit hex value').optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters').max(100),
  type: z.enum(['Income', 'Expense']),
  icon: z.string().trim().max(50).optional(),
  custom: z.boolean().optional().default(true),
});

const validDateString = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const goalSchema = z.object({
  name: z.string().trim().min(2, 'Goal name must be at least 2 characters').max(100),
  targetAmount: z.coerce.number().positive('Target amount must be greater than zero'),
  currentAmount: z.coerce.number().min(0, 'Current amount cannot be negative').default(0),
  targetDate: z.string().refine(validDateString, 'Enter a valid target date'),
  icon: z.string().trim().max(50).optional(),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

export const budgetSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020),
  overallLimit: z.coerce.number().positive('Overall limit must be greater than zero'),
  categoryBudgets: z.array(
    z.object({
      category: z.string().min(1),
      limit: z.coerce.number().positive('Category limit must be greater than zero'),
    })
  ).optional().default([]),
}).superRefine((data, ctx) => {
  const ids = data.categoryBudgets.map((item) => item.category);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['categoryBudgets'],
      message: 'A category can only appear once in a budget',
    });
  }
});
