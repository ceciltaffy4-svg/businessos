import { getDatabase } from '../database/connection'
import { v4 as uuid } from 'uuid'
import { productRepo } from '../database/repositories'

export interface PosCartItem {
  product_id: string
  quantity: number
  unit_price: number
  discount: number
  tax_rate: number
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

export interface PosCheckoutLineItem {
  name: string
  sku: string
  quantity: number
  unit_price: number
  total: number
}

export interface PosCheckoutResult {
  sale_id: string
  invoice_number: string
  grand_total: number
  amount_paid: number
  change_due: number
  items: PosCheckoutLineItem[]
  sale_date: string
  customer_name?: string
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

  validateStock(
    items: Array<{ product_id: string; quantity: number }>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    for (const item of items) {
      const product = productRepo.findById(item.product_id)
      if (!product) {
        errors.push(`Product ${item.product_id} not found`)
        continue
      }
      if (item.quantity <= 0) {
        errors.push(`Quantity for "${product.name}" must be positive`)
        continue
      }
      if (item.quantity > product.stock_quantity) {
        errors.push(
          `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, requested: ${item.quantity}`
        )
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

    let invoiceNumber = ''
    let receiptItems: PosCheckoutLineItem[] = []

    const transaction = db.transaction(() => {
      const year = new Date().getFullYear()
      const count = (
        db.prepare("SELECT COUNT(*) as count FROM sales WHERE strftime('%Y', sale_date) = ?").get(String(year)) as {
          count: number
        }
      ).count
      invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`

      db.prepare(
        `INSERT INTO sales (id, invoice_number, customer_id, employee_id, sale_date,
           status, subtotal, tax_total, discount_total, grand_total, amount_paid, payment_status, notes)
         VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, 'paid', ?)`
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
        input.notes ?? ''
      )

      for (const item of input.items) {
        const product = db.prepare('SELECT name, sku FROM products WHERE id = ?').get(item.product_id) as
          | { name: string; sku: string }
          | undefined
        if (!product) throw new Error(`Product ${item.product_id} not found`)

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

        receiptItems.push({
          name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price - item.discount
        })
      }

      for (const payment of input.payments) {
        const paymentId = uuid()
        db.prepare(
          `INSERT INTO sale_payments (id, sale_id, amount, payment_date, payment_method)
           VALUES (?, ?, ?, ?, ?)`
        ).run(paymentId, saleId, payment.amount, now, payment.payment_method)
      }

      db.prepare(
        `INSERT INTO audit_log (id, entity_type, entity_id, action, changes, created_at)
         VALUES (?, 'sale', ?, 'create', ?, ?)`
      ).run(uuid(), saleId, JSON.stringify({ invoice_number: invoiceNumber }), now)
    })

    transaction()

    let customerName: string | undefined
    if (input.customer_id) {
      const customer = db.prepare('SELECT name FROM customers WHERE id = ?').get(input.customer_id) as
        | { name: string }
        | undefined
      customerName = customer?.name
    }

    return {
      sale_id: saleId,
      invoice_number: invoiceNumber,
      grand_total: grandTotal,
      amount_paid: totalPaid,
      change_due: Math.max(0, totalPaid - grandTotal),
      items: receiptItems,
      sale_date: now,
      customer_name: customerName
    }
  }
}
