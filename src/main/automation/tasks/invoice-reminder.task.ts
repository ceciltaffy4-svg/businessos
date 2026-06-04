import { getDatabase } from '../../database/connection'
import { logger } from '../../utils/logger'
import { automationEvents } from '../event-system'

export function checkOverdueInvoices(): void {
  try {
    const db = getDatabase()
    const today = new Date().toISOString().slice(0, 10)

    const invoices = db
      .prepare(
        `SELECT s.invoice_number, c.name as customer_name, s.balance_due, s.due_date
         FROM sales s
         JOIN customers c ON c.id = s.customer_id
         WHERE s.payment_status IN ('unpaid', 'partial')
           AND s.status NOT IN ('cancelled', 'refunded')
           AND s.due_date != ''
           AND s.due_date < ?
         ORDER BY s.due_date ASC`
      )
      .all(today) as Array<{ invoice_number: string; customer_name: string; balance_due: number; due_date: string }>

    if (invoices.length > 0) {
      logger.info(`[Automation] Invoice reminder: ${invoices.length} overdue invoices`)
      automationEvents.emit('invoice-reminder', invoices)
    }
  } catch (error) {
    logger.error('[Automation] Invoice reminder check failed', error)
    automationEvents.emit('automation-error', { task: 'invoice-reminder', error: (error as Error).message })
  }
}
