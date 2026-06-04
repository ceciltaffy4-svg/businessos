import { getDatabase } from '../connection'

export interface CustomerRow {
  id: string
  code: string
  name: string
  company: string
  email: string
  phone: string
  mobile: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  tax_id: string
  payment_terms: string
  credit_limit: number
  is_active: number
  notes: string
  created_at: string
  updated_at: string
}

export interface CustomerFilters {
  search?: string
  is_active?: number
  page?: number
  pageSize?: number
}

export interface CustomerStats {
  total_orders: number
  total_spent: number
  outstanding_balance: number
  last_purchase_date: string | null
}

export interface PurchaseHistoryRow {
  id: string
  invoice_number: string
  sale_date: string
  grand_total: number
  amount_paid: number
  balance_due: number
  status: string
  payment_status: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export const customerRepo = {
  findAll(filters: CustomerFilters = {}): PaginatedResult<CustomerRow> {
    const db = getDatabase()
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters.search) {
      conditions.push('(name LIKE ? OR code LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ?)')
      const q = `%${filters.search}%`
      params.push(q, q, q, q, q)
    }
    if (filters.is_active !== undefined) {
      conditions.push('is_active = ?')
      params.push(filters.is_active)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 50
    const offset = (page - 1) * pageSize

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM customers ${where}`).get(...params) as { count: number }

    const rows = db
      .prepare(`SELECT * FROM customers ${where} ORDER BY name ASC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as CustomerRow[]

    return { data: rows, total: countRow.count, page, pageSize }
  },

  findAllWithBalances(filters: CustomerFilters = {}): PaginatedResult<CustomerRow & { outstanding_balance: number }> {
    const db = getDatabase()
    const conditions: string[] = ['c.is_active = 1']
    const params: unknown[] = []

    if (filters.search) {
      conditions.push('(c.name LIKE ? OR c.code LIKE ? OR c.company LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)')
      const q = `%${filters.search}%`
      params.push(q, q, q, q, q)
    }

    const where = `WHERE ${conditions.join(' AND ')}`
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 50
    const offset = (page - 1) * pageSize

    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM customers c ${where}`)
      .get(...params) as { count: number }

    const rows = db
      .prepare(
        `SELECT c.*, COALESCE(SUM(s.balance_due), 0) as outstanding_balance
         FROM customers c
         LEFT JOIN sales s ON s.customer_id = c.id AND s.status != 'cancelled'
         ${where}
         GROUP BY c.id
         ORDER BY outstanding_balance DESC, c.name ASC
         LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as (CustomerRow & { outstanding_balance: number })[]

    return { data: rows, total: countRow.count, page, pageSize }
  },

  findById(id: string): CustomerRow | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as CustomerRow | undefined
  },

  findByCode(code: string): CustomerRow | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM customers WHERE code = ?').get(code) as CustomerRow | undefined
  },

  getStats(id: string): CustomerStats {
    const db = getDatabase()
    const stats = db
      .prepare(
        `SELECT
           COUNT(*) as total_orders,
           COALESCE(SUM(grand_total), 0) as total_spent,
           COALESCE(SUM(CASE WHEN status != 'cancelled' THEN balance_due ELSE 0 END), 0) as outstanding_balance,
           MAX(sale_date) as last_purchase_date
         FROM sales WHERE customer_id = ?`
      )
      .get(id) as CustomerStats
    return stats
  },

  getPurchaseHistory(
    customerId: string,
    page = 1,
    pageSize = 20
  ): PaginatedResult<PurchaseHistoryRow> {
    const db = getDatabase()
    const offset = (page - 1) * pageSize

    const countRow = db
      .prepare('SELECT COUNT(*) as count FROM sales WHERE customer_id = ?')
      .get(customerId) as { count: number }

    const rows = db
      .prepare(
        `SELECT id, invoice_number, sale_date, grand_total, amount_paid, balance_due, status, payment_status
         FROM sales WHERE customer_id = ?
         ORDER BY sale_date DESC
         LIMIT ? OFFSET ?`
      )
      .all(customerId, pageSize, offset) as PurchaseHistoryRow[]

    return { data: rows, total: countRow.count, page, pageSize }
  },

  create(data: Omit<CustomerRow, 'created_at' | 'updated_at'>): CustomerRow {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO customers (id, code, name, company, email, phone, mobile,
        address_line1, address_line2, city, state, postal_code, country, tax_id,
        payment_terms, credit_limit, is_active, notes)
      VALUES (@id, @code, @name, @company, @email, @phone, @mobile,
        @address_line1, @address_line2, @city, @state, @postal_code, @country, @tax_id,
        @payment_terms, @credit_limit, @is_active, @notes)
    `)
    stmt.run(data)
    return this.findById(data.id)!
  },

  update(id: string, data: Partial<Omit<CustomerRow, 'id' | 'created_at' | 'updated_at'>>): CustomerRow | undefined {
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
    db.prepare(`UPDATE customers SET ${sets.join(', ')} WHERE id = @id`).run(params)
    return this.findById(id)
  },

  delete(id: string): void {
    const db = getDatabase()
    db.prepare("UPDATE customers SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id)
  }
}
