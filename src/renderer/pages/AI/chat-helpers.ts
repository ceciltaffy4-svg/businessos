export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sql_executed?: string
  sql_results?: unknown
}

let counter = 0
export function createMessage(role: 'user' | 'assistant', content: string, extras?: Partial<ChatMessage>): ChatMessage {
  return {
    id: `msg-${++counter}-${Date.now()}`,
    role,
    content,
    timestamp: new Date(),
    ...extras
  }
}

export const QUICK_ACTIONS = [
  { label: 'Today\'s Sales', query: "What were my sales today?" },
  { label: 'Low Stock', query: "Which products are running low on stock?" },
  { label: 'Top Customers', query: "Show me my top customers by spending." },
  { label: 'Profit Summary', query: "What is my profit for this month?" },
  { label: 'Inventory Report', query: "Generate an inventory status report." },
  { label: 'Predict Shortages', query: "Which products will run out of stock soon?" }
]
