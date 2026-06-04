import { getDatabase } from '../../database/connection'
import { logger } from '../../utils/logger'
import { automationEvents } from '../event-system'

export function suggestReorder(): void {
  try {
    const db = getDatabase()
    const items = db
      .prepare(
        `SELECT id, name, sku, stock_quantity, min_stock_level,
                CAST(MAX(min_stock_level * 2 - stock_quantity, 0) AS INTEGER) as suggested_order
         FROM products
         WHERE is_active = 1 AND stock_quantity <= min_stock_level
         ORDER BY suggested_order DESC`
      )
      .all() as Array<{ id: string; name: string; sku: string; stock_quantity: number; min_stock_level: number; suggested_order: number }>

    const toReorder = items.filter((i) => i.suggested_order > 0)
    if (toReorder.length > 0) {
      logger.info(`[Automation] Reorder suggestion: ${toReorder.length} products need restocking`)
      automationEvents.emit('reorder-suggestion', toReorder)
    }
  } catch (error) {
    logger.error('[Automation] Reorder suggestion failed', error)
    automationEvents.emit('automation-error', { task: 'reorder-suggestion', error: (error as Error).message })
  }
}
