import { z } from 'zod'

export const expenseFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required').max(1000),
  amount: z.coerce.number().min(0.01, 'Amount must be at least 0.01'),
  tax_amount: z.coerce.number().min(0).optional().default(0),
  expense_date: z.string().min(1, 'Date is required'),
  due_date: z.string().optional().default(''),
  vendor: z.string().max(200).optional().default(''),
  payment_method: z.string().optional().default(''),
  payment_status: z.string().optional().default('unpaid'),
  notes: z.string().max(2000).optional().default('')
})

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>

export const EXPENSE_CATEGORIES = [
  'rent', 'utilities', 'salaries', 'supplies', 'marketing', 'transportation',
  'maintenance', 'insurance', 'taxes', 'software', 'hardware', 'professional_services',
  'food', 'travel', 'other'
] as const
