import { getDatabase } from '../connection'

export interface ExpenseRow {
  id: string
  expense_number: string
  category: string
  description: string
  amount: number
  tax_amount: number
  expense_date: string
  due_date: string
  employee_id: string | null
  vendor: string
  payment_method: string
  payment_status: string
  receipt_path: string
  is_recurring: number
  recurring_frequency: string
  notes: string
  created_at: string
  updated_at: string
}

export interface ExpenseFilters {
  category?: string
  payment_status?: string
  date_from?: string
  date_to?: string
  employee_id?: string
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

function generateExpenseNumber(): string {
  const db = getDatabase()
  const year = new Date().getFullYear()
  const count = (
    db.prepare("SELECT COUNT(*) as count FROM expenses WHERE strftime('%Y', expense_date) = ?").get(String(year)) as {
      count: number
    }
  ).count
  return `EXP-${year}-${String(count + 1).padStart(4, '0')}`
}

export const expenseRepo = {
  findAll(filters: ExpenseFilters = {}): PaginatedResult<ExpenseRow> {
    const db = getDatabase()
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters.category) {
      conditions.push('category = ?')
      params.push(filters.category)
    }
    if (filters.payment_status) {
      conditions.push('payment_status = ?')
      params.push(filters.payment_status)
    }
    if (filters.employee_id) {
      conditions.push('employee_id = ?')
      params.push(filters.employee_id)
    }
    if (filters.date_from) {
      conditions.push('expense_date >= ?')
      params.push(filters.date_from)
    }
    if (filters.date_to) {
      conditions.push('expense_date <= ?')
      params.push(filters.date_to)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 50
    const offset = (page - 1) * pageSize

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM expenses ${where}`).get(...params) as { count: number }

    const rows = db
      .prepare(`SELECT * FROM expenses ${where} ORDER BY expense_date DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as ExpenseRow[]

    return { data: rows, total: countRow.count, page, pageSize }
  },

  findById(id: string): ExpenseRow | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as ExpenseRow | undefined
  },

  create(data: Omit<ExpenseRow, 'created_at' | 'updated_at' | 'expense_number'>): ExpenseRow {
    const db = getDatabase()
    const id = data.id
    const expenseNumber = generateExpenseNumber()
    db.prepare(
      `INSERT INTO expenses (id, expense_number, category, description, amount, tax_amount,
        expense_date, due_date, employee_id, vendor, payment_method, payment_status,
        receipt_path, is_recurring, recurring_frequency, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, expenseNumber, data.category, data.description, data.amount, data.tax_amount,
      data.expense_date, data.due_date, data.employee_id, data.vendor,
      data.payment_method, data.payment_status, data.receipt_path,
      data.is_recurring, data.recurring_frequency, data.notes
    )
    return this.findById(id)!
  },

  update(id: string, data: Partial<Omit<ExpenseRow, 'id' | 'expense_number' | 'created_at' | 'updated_at'>>): ExpenseRow | undefined {
    const db = getDatabase()
    const sets: string[] = []
    const params: Record<string, unknown> = { id }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sets.push(`${key} = @${key}`)
        params[key] = value
      }
    }
    if (sets.length === 0) return this.findById(id)

    sets.push("updated_at = datetime('now')")
    db.prepare(`UPDATE expenses SET ${sets.join(', ')} WHERE id = @id`).run(params)
    return this.findById(id)
  },

  delete(id: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id)
  }
}
