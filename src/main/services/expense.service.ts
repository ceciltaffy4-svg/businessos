import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { expenseRepo, type ExpenseFilters } from '../database/repositories'

const createExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  tax_amount: z.number().min(0).optional().default(0),
  expense_date: z.string().optional().default(() => new Date().toISOString()),
  due_date: z.string().optional().default(''),
  employee_id: z.string().uuid().optional().nullable().default(null),
  vendor: z.string().optional().default(''),
  payment_method: z.string().optional().default(''),
  payment_status: z.string().optional().default('unpaid'),
  receipt_path: z.string().optional().default(''),
  is_recurring: z.number().min(0).max(1).optional().default(0),
  recurring_frequency: z.string().optional().default(''),
  notes: z.string().optional().default('')
})

const updateExpenseSchema = createExpenseSchema.partial()

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>

export const expenseService = {
  list(filters: ExpenseFilters) {
    return expenseRepo.findAll(filters)
  },

  get(id: string) {
    const expense = expenseRepo.findById(id)
    if (!expense) throw new Error('Expense not found')
    return expense
  },

  create(input: CreateExpenseInput) {
    const data = createExpenseSchema.parse(input)
    return expenseRepo.create({ id: uuid(), ...data })
  },

  update(id: string, input: UpdateExpenseInput) {
    const data = updateExpenseSchema.parse(input)
    const updated = expenseRepo.update(id, data)
    if (!updated) throw new Error('Expense not found')
    return updated
  },

  delete(id: string) {
    expenseRepo.delete(id)
  }
}
