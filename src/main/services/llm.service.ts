import { chat, checkConnection, configureOllama, getOllamaConfig, listModels, type OllamaConfig, type OllamaMessage } from '../llm/ollama.client'
import { buildSchemaContext, buildRecentDataContext } from '../llm/context-builder'
import { SYSTEM_PROMPT, SQL_GENERATION_PROMPT, REPORT_PROMPT, PREDICTION_PROMPT } from '../llm/prompts'
import { validateQuery, extractSqlBlocks } from '../llm/security-guard'
import { getDatabase } from '../database/connection'
import { logger } from '../utils/logger'

export interface LlmChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface LlmResponse {
  answer: string
  sql_executed?: string
  sql_results?: unknown
  requires_confirmation?: boolean
  confirmation_message?: string
}

export const llmService = {
  configure(cfg: OllamaConfig): void {
    configureOllama(cfg)
  },

  getConfig() {
    return getOllamaConfig()
  },

  checkConnection() {
    return checkConnection()
  },

  listModels() {
    return listModels()
  },

  async chat(
    userMessage: string,
    history: LlmChatMessage[] = []
  ): Promise<LlmResponse> {
    const schema = buildSchemaContext()
    const recentData = buildRecentDataContext()

    const messages: OllamaMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: schema },
      { role: 'system', content: recentData }
    ]

    for (const msg of history.slice(-10)) {
      messages.push({ role: msg.role, content: msg.content })
    }

    messages.push({ role: 'user', content: userMessage })

    const response = await chat(messages)

    const sqlBlocks = extractSqlBlocks(response)
    let sqlExecuted: string | undefined
    let sqlResults: unknown

    if (sqlBlocks.length > 0) {
      for (const rawSql of sqlBlocks) {
        const validation = validateQuery(rawSql)
        if (!validation.safe) {
          logger.warn(`[LLM] Blocked unsafe query: ${validation.reason}`)
          continue
        }

        try {
          const db = getDatabase()
          const stmt = db.prepare(validation.query)
          const rows = stmt.all()
          sqlExecuted = validation.query
          sqlResults = rows

          logger.info(`[LLM] Executed SQL: ${validation.query.slice(0, 200)}... (${(rows as unknown[]).length} rows)`)

          const followUp = await chat([
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'system', content: 'The user asked a question and you generated a SQL query. The query results are below. Summarize them for the user in a natural, helpful way.' },
            { role: 'user', content: `Original question: ${userMessage}` },
            { role: 'user', content: `Executed SQL: ${validation.query}` },
            { role: 'user', content: `Results: ${JSON.stringify(rows.slice(0, 20))}` }
          ])

          return {
            answer: followUp,
            sql_executed: validation.query,
            sql_results: rows
          }
        } catch (err) {
          const error = err as Error
          logger.error('[LLM] SQL execution error', error)
          return {
            answer: `I tried to query the database but encountered an error:\n\n\`\`\`\n${error.message}\n\`\`\`\n\nWould you like me to try a different approach?`,
            sql_executed: validation.query
          }
        }
      }
    }

    return {
      answer: response
    }
  },

  async generateReport(reportType: string): Promise<LlmResponse> {
    const schema = buildSchemaContext()
    const recentData = buildRecentDataContext()

    let specificPrompt = ''
    switch (reportType) {
      case 'daily_sales':
        specificPrompt = 'Generate a daily sales report for today. Include total revenue, order count, average order value, top products sold, and payment method breakdown. If today has no data, show the most recent day with data.'
        break
      case 'weekly_sales':
        specificPrompt = 'Generate a weekly sales summary for this week. Include day-by-day breakdown, total revenue, compare to previous week if data is available.'
        break
      case 'inventory':
        specificPrompt = 'Generate an inventory status report. Show total products, low stock items, out of stock items, and the total value of current inventory (stock_quantity * cost_price).'
        break
      case 'profit_loss':
        specificPrompt = 'Generate a profit and loss summary. Show total revenue, cost of goods sold, gross profit, total expenses, net profit. Include the period this covers.'
        break
      case 'customer':
        specificPrompt = 'Generate a customer summary report. Show total customers, top customers by spending, and any customers with outstanding balances.'
        break
      default:
        specificPrompt = `Generate a report about: ${reportType}`
    }

    const messages: OllamaMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: schema },
      { role: 'system', content: recentData },
      { role: 'system', content: REPORT_PROMPT },
      { role: 'user', content: specificPrompt }
    ]

    const response = await chat(messages)

    const sqlBlocks = extractSqlBlocks(response)
    let sqlExecuted: string | undefined
    let sqlResults: unknown

    if (sqlBlocks.length > 0) {
      for (const rawSql of sqlBlocks) {
        const validation = validateQuery(rawSql)
        if (!validation.safe) continue

        try {
          const db = getDatabase()
          sqlExecuted = validation.query
          sqlResults = db.prepare(validation.query).all()
        } catch { /* report can still proceed without SQL execution */ }
      }
    }

    return {
      answer: response,
      sql_executed: sqlExecuted,
      sql_results: sqlResults
    }
  },

  async predictShortages(): Promise<LlmResponse> {
    const db = getDatabase()

    const products = db
      .prepare(
        `SELECT p.id, p.name, p.sku, p.stock_quantity, p.min_stock_level,
                COALESCE(AVG(si.quantity), 0) as avg_daily_sales
         FROM products p
         LEFT JOIN sale_items si ON si.product_id = p.id
         LEFT JOIN sales s ON s.id = si.sale_id
           AND s.sale_date >= date('now', '-30 days')
           AND s.status != 'cancelled'
         WHERE p.is_active = 1
         GROUP BY p.id
         ORDER BY p.stock_quantity ASC`
      )
      .all() as Array<{
        id: string
        name: string
        sku: string
        stock_quantity: number
        min_stock_level: number
        avg_daily_sales: number
      }>

    const productsWithProjection = products.map((p) => {
      const dailyRate = p.avg_daily_sales || 0.1
      const daysUntilStockout = dailyRate > 0 ? Math.floor(p.stock_quantity / dailyRate) : 999
      return { ...p, daily_rate: Math.round(dailyRate * 10) / 10, days_until_stockout: daysUntilStockout }
    })

    const atRisk = productsWithProjection.filter((p) => p.days_until_stockout <= 30)

    const predictionData = {
      total_products_analyzed: products.length,
      products_at_risk: atRisk.length,
      at_risk_products: atRisk
    }

    const dataSummary = JSON.stringify(predictionData, null, 2)

    const messages: OllamaMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: PREDICTION_PROMPT },
      { role: 'user', content: `Here is the inventory analysis data:\n\n${dataSummary}\n\nBased on this data, which products need immediate attention and what reorder quantities do you recommend?` }
    ]

    const response = await chat(messages)

    return {
      answer: response,
      sql_results: predictionData
    }
  }
}
