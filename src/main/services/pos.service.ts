import { getDatabase } from '../database/connection'
import { v4 as uuid } from 'uuid'
import { productRepo } from '../database/repositories'

export interface PosCartItem {
  product_id: string
  sku: string
  name: string
  unit: string
  quantity: number
  unit_price: number
  discount: number
  tax_rate: number
  stock_quantity: number
}

export interface PosCheckoutInput {
  items: PosCartItem[]
  customer_id?: string | null
  employee_id?: string | null
  notes?: string
  payments: Array<{
    amount: number
    payment_method: string
  }>
}

export interface PosCheckoutResult {
  sale_id: string
  invoice_number: string
  grand_total: number
  amount_paid: number
  change_due: number
  items: Array<{
    name: string
    sku: string
    quantity: number
    unit_price: number
    total: number
  }>
  sale_date: string
  customer_name?: string
}

function generateInvoiceNumber(db: ReturnType<typeof getDatabase>): string {
  const year = new Date().getFullYear()
  const count = (
    db.prepare("SELECT COUNT(*) as count FROM sales WHERE strftime('%Y', sale_date) = ?").get(String(year)) as {
      count: number
    }
  ).count
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`
}

export const posService = {
  lookupProduct(query: string) {
    const db = getDatabase()
    if (!query) return null

    const byBarcode = productRepo.findByBarcode(query)
    if (byBarcode) return byBarcode

    const bySku = productRepo.findBySku(query)
    if (bySku) return bySku

    const byId = productRepo.findById(query)
    if (byId) return byId

    return null
  },

  searchProducts(query: string) {
    if (!query || query.length < 1) return productRepo.findAllActive()
    return productRepo.searchForPos(query)
  },

  validateStock(items: PosCartItem[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    for (const item of items) {
      if (item.quantity <= 0) {
        errors.push(`Quantity for "${item.name}" must be positive`)
        continue
      }
      if (item.quantity > item.stock_quantity) {
        errors.push(`Insufficient stock for "${item.name}". Available: ${item.stock_quantity}, requested: ${item.quantity}`)
      }
    }
    return { valid: errors.length === 0, errors }
  },

  checkout(input: PosCheckoutInput): PosCheckoutResult {
    const stockValidation = this.validateStock(input.items)
    if (!stockValidation.valid) {
      throw new Error(stockValidation.errors.join('\n'))
    }

    const db = getDatabase()
    const saleId = uuid()
    const invoiceNumber = generateInvoiceNumber(db)
    const now = new Date().toISOString()

    let subtotal = 0
    let taxTotal = 0
    let discountTotal = 0

    for (const item of input.items) {
      const lineSubtotal = item.quantity * item.unit_price
      subtotal += lineSubtotal
      discountTotal += item.discount
      const itemTax = lineSubtotal * (item.tax_rate / 100)
      taxTotal += itemTax
    }

    const grandTotal = subtotal - discountTotal + taxTotal
    const totalPaid = input.payments.reduce((sum, p) => sum + p.amount, 0)
    const changeDue = Math.max(0, totalPaid - grandTotal)

    const transaction = db.transaction(() => {
      db.prepare(
        `INSERT INTO sales (id, invoice_number, customer_id, employee_id, sale_date,
           status, subtotal, tax_total, discount_total, grand_total, amount_paid, payment_status, notes)
         VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        saleId,
        invoiceNumber,
        input.customer_id ?? null,
        input.employee_id ?? null,
        now,
        subtotal,
        taxTotal,
        discountTotal,
        grandTotal,
        grandTotal,
        'paid',
        input.notes ?? ''
      )

      for (const item of input.items) {
        const itemId = uuid()
        const itemTax = item.quantity * item.unit_price * (item.tax_rate / 100)
        db.prepare(
          `INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, discount, tax_rate, tax_amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(itemId, saleId, item.product_id, item.quantity, item.unit_price, item.discount, item.tax_rate, itemTax)

        db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?').run(
          item.quantity,
          item.product_id
        )
      }

      for (const payment of input.payments) {
        const paymentId = uuid()
        db.prepare(
          `INSERT INTO sale_payments (id, sale_id, amount, payment_date, payment_method)
           VALUES (?, ?, ?, ?, ?)`
        ).run(paymentId, saleId, payment.amount, now, payment.payment_method)
      }
    })

    transaction()

    let customerName: string | undefined
    if (input.customer_id) {
      const customer = db.prepare('SELECT name FROM customers WHERE id = ?').get(input.customer_id) as
        | { name: string }
        | undefined
      customerName = customer?.name
    }

    const receiptItems = input.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price - item.discount
    }))

    return {
      sale_id: saleId,
      invoice_number: invoiceNumber,
      grand_total: grandTotal,
      amount_paid: totalPaid,
      change_due: changeDue,
      items: receiptItems,
      sale_date: now,
      customer_name: customerName
    }
  }
}
