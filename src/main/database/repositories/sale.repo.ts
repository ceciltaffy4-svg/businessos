import { getDatabase } from '../connection'
import { v4 as uuid } from 'uuid'

export interface SaleRow {
  id: string
  invoice_number: string
  customer_id: string
  employee_id: string | null
  sale_date: string
  due_date: string
  status: string
  subtotal: number
  tax_total: number
  discount_total: number
  grand_total: number
  amount_paid: number
  balance_due: number
  payment_method: string
  payment_status: string
  notes: string
  created_at: string
  updated_at: string
}

export interface SaleItemRow {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount: number
  tax_rate: number
  tax_amount: number
  total: number
}

export interface SalePaymentRow {
  id: string
  sale_id: string
  amount: number
  payment_date: string
  payment_method: string
  reference: string
  notes: string
}

export interface SaleWithRelations extends SaleRow {
  items: SaleItemRow[]
  payments: SalePaymentRow[]
  customer_name?: string
  employee_name?: string
}

export interface SaleFilters {
  customer_id?: string
  status?: string
  payment_status?: string
  date_from?: string
  date_to?: string
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

function generateInvoiceNumber(): string {
  const db = getDatabase()
  const year = new Date().getFullYear()
  const count = (
    db.prepare("SELECT COUNT(*) as count FROM sales WHERE strftime('%Y', sale_date) = ?").get(String(year)) as {
      count: number
    }
  ).count
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`
}

export const saleRepo = {
  findAll(filters: SaleFilters = {}): PaginatedResult<SaleWithRelations> {
    const db = getDatabase()
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters.customer_id) {
      conditions.push('s.customer_id = ?')
      params.push(filters.customer_id)
    }
    if (filters.status) {
      conditions.push('s.status = ?')
      params.push(filters.status)
    }
    if (filters.payment_status) {
      conditions.push('s.payment_status = ?')
      params.push(filters.payment_status)
    }
    if (filters.date_from) {
      conditions.push('s.sale_date >= ?')
      params.push(filters.date_from)
    }
    if (filters.date_to) {
      conditions.push('s.sale_date <= ?')
      params.push(filters.date_to)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 50
    const offset = (page - 1) * pageSize

    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM sales s ${where}`)
      .get(...params) as { count: number }

    const rows = db
      .prepare(
        `SELECT s.*, c.name as customer_name, e.first_name || ' ' || e.last_name as employee_name
         FROM sales s
         LEFT JOIN customers c ON c.id = s.customer_id
         LEFT JOIN employees e ON e.id = s.employee_id
         ${where}
         ORDER BY s.sale_date DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as (SaleRow & { customer_name: string; employee_name: string })[]

    const data = rows.map((row) => ({
      ...row,
      items: this.findItems(row.id),
      payments: this.findPayments(row.id)
    }))

    return { data, total: countRow.count, page, pageSize }
  },

  findById(id: string): SaleWithRelations | undefined {
    const db = getDatabase()
    const row = db
      .prepare(
        `SELECT s.*, c.name as customer_name, e.first_name || ' ' || e.last_name as employee_name
         FROM sales s
         LEFT JOIN customers c ON c.id = s.customer_id
         LEFT JOIN employees e ON e.id = s.employee_id
         WHERE s.id = ?`
      )
      .get(id) as (SaleRow & { customer_name: string; employee_name: string }) | undefined

    if (!row) return undefined

    return {
      ...row,
      items: this.findItems(id),
      payments: this.findPayments(id)
    }
  },

  findItems(saleId: string): SaleItemRow[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId) as SaleItemRow[]
  },

  addItem(item: Omit<SaleItemRow, 'id' | 'total'>): SaleItemRow {
    const db = getDatabase()
    const id = uuid()
    db.prepare(
      `INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, discount, tax_rate, tax_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, item.sale_id, item.product_id, item.quantity, item.unit_price, item.discount, item.tax_rate, item.tax_amount)
    return db.prepare('SELECT * FROM sale_items WHERE id = ?').get(id) as SaleItemRow
  },

  findPayments(saleId: string): SalePaymentRow[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM sale_payments WHERE sale_id = ? ORDER BY payment_date DESC').all(saleId) as SalePaymentRow[]
  },

  addPayment(payment: Omit<SalePaymentRow, 'id'>): SalePaymentRow {
    const db = getDatabase()
    const id = uuid()
    db.prepare(
      `INSERT INTO sale_payments (id, sale_id, amount, payment_date, payment_method, reference, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, payment.sale_id, payment.amount, payment.payment_date, payment.payment_method, payment.reference, payment.notes)

    this.recalculatePaymentStatus(payment.sale_id)
    return db.prepare('SELECT * FROM sale_payments WHERE id = ?').get(id) as SalePaymentRow
  },

  recalculatePaymentStatus(saleId: string): void {
    const db = getDatabase()
    const sale = db.prepare('SELECT grand_total FROM sales WHERE id = ?').get(saleId) as { grand_total: number } | undefined
    if (!sale) return

    const totalPaid = (
      db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM sale_payments WHERE sale_id = ?').get(saleId) as { total: number }
    ).total

    let paymentStatus = 'unpaid'
    if (totalPaid >= sale.grand_total && sale.grand_total > 0) {
      paymentStatus = 'paid'
    } else if (totalPaid > 0) {
      paymentStatus = 'partial'
    }

    db.prepare("UPDATE sales SET amount_paid = ?, payment_status = ?, updated_at = datetime('now') WHERE id = ?").run(
      totalPaid,
      paymentStatus,
      saleId
    )
  },

  create(data: {
    customer_id: string
    employee_id?: string
    sale_date?: string
    due_date?: string
    notes?: string
    items: Array<{
      product_id: string
      quantity: number
      unit_price: number
      discount?: number
      tax_rate?: number
      tax_amount?: number
    }>
    payments?: Array<{
      amount: number
      payment_date?: string
      payment_method?: string
      reference?: string
    }>
  }): SaleWithRelations {
    const db = getDatabase()
    const id = uuid()
    const invoiceNumber = generateInvoiceNumber()
    const now = new Date().toISOString()

    let subtotal = 0
    let taxTotal = 0
    let discountTotal = 0

    const itemRows = data.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount ?? 0,
      tax_rate: item.tax_rate ?? 0,
      tax_amount: item.tax_amount ?? 0
    }))

    for (const item of itemRows) {
      subtotal += item.quantity * item.unit_price
      discountTotal += item.discount
      taxTotal += item.tax_amount
    }

    const grandTotal = subtotal - discountTotal + taxTotal

    const transaction = db.transaction(() => {
      db.prepare(
        `INSERT INTO sales (id, invoice_number, customer_id, employee_id, sale_date, due_date,
           status, subtotal, tax_total, discount_total, grand_total, amount_paid, payment_status, notes)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, 0, 'unpaid', ?)`
      ).run(id, invoiceNumber, data.customer_id, data.employee_id ?? null, data.sale_date ?? now, data.due_date ?? '', subtotal, taxTotal, discountTotal, grandTotal, data.notes ?? '')

      for (const item of itemRows) {
        const itemId = uuid()
        db.prepare(
          `INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, discount, tax_rate, tax_amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(itemId, id, item.product_id, item.quantity, item.unit_price, item.discount, item.tax_rate, item.tax_amount)

        db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?').run(item.quantity, item.product_id)
      }

      if (data.payments && data.payments.length > 0) {
        for (const payment of data.payments) {
          const paymentId = uuid()
          db.prepare(
            `INSERT INTO sale_payments (id, sale_id, amount, payment_date, payment_method, reference)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).run(paymentId, id, payment.amount, payment.payment_date ?? now, payment.payment_method ?? '', payment.reference ?? '')
        }
        this.recalculatePaymentStatus(id)
      }

      db.exec(`INSERT INTO audit_log (entity_type, entity_id, action, changes)
               VALUES ('sale', '${id}', 'create', '{"invoice_number": "${invoiceNumber}"}')`)
    })

    transaction()

    return this.findById(id)!
  },

  updateStatus(id: string, status: string): void {
    const db = getDatabase()
    db.prepare("UPDATE sales SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)
  },

  delete(id: string): void {
    const db = getDatabase()
    const transaction = db.transaction(() => {
      const items = db.prepare('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?').all(id) as {
        product_id: string
        quantity: number
      }[]
      for (const item of items) {
        db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?').run(item.quantity, item.product_id)
      }
      db.prepare('DELETE FROM sale_payments WHERE sale_id = ?').run(id)
      db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(id)
      db.prepare('DELETE FROM sales WHERE id = ?').run(id)
    })
    transaction()
  }
}
