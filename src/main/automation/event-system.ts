type AutomationEventHandler = (data: unknown) => void

interface AutomationEventMap {
  'low-stock-alert': Array<{ product_id: string; name: string; sku: string; stock_quantity: number; min_stock_level: number }>
  'invoice-reminder': Array<{ invoice_number: string; customer_name: string; balance_due: number; due_date: string }>
  'backup-created': { path: string; size: number }
  'reorder-suggestion': Array<{ product_id: string; name: string; sku: string; suggested_order: number }>
  'automation-error': { task: string; error: string }
}

class AutomationEventSystem {
  private handlers = new Map<string, Set<AutomationEventHandler>>()

  on<K extends keyof AutomationEventMap>(event: K, handler: (data: AutomationEventMap[K]) => void): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler as AutomationEventHandler)
  }

  off<K extends keyof AutomationEventMap>(event: K, handler: (data: AutomationEventMap[K]) => void): void {
    this.handlers.get(event)?.delete(handler as AutomationEventHandler)
  }

  emit<K extends keyof AutomationEventMap>(event: K, data: AutomationEventMap[K]): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data)
      } catch (err) {
        console.error(`[Automation] Error in handler for ${String(event)}:`, err)
      }
    })
  }
}

export const automationEvents = new AutomationEventSystem()
