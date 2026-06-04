import { getDatabase } from '../../database/connection'
import { logger } from '../../utils/logger'
import { automationEvents } from '../event-system'

export function checkLowStock(): void {
  try {
    const db = getDatabase()
    const items = db
      .prepare(
        `SELECT id, name, sku, stock_quantity, min_stock_level
         FROM products
         WHERE is_active = 1 AND stock_quantity <= min_stock_level
         ORDER BY stock_quantity ASC`
      )
      .all() as Array<{ id: string; name: string; sku: string; stock_quantity: number; min_stock_level: number }>

    if (items.length > 0) {
      logger.info(`[Automation] Low stock alert: ${items.length} products`)
      automationEvents.emit('low-stock-alert', items)
    }
  } catch (error) {
    logger.error('[Automation] Low stock check failed', error)
    automationEvents.emit('automation-error', { task: 'low-stock', error: (error as Error).message })
  }
}
