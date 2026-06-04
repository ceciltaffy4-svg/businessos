import { getDatabase } from '../database/connection'

export interface SchemaTable {
  name: string
  columns: Array<{ name: string; type: string; nullable: boolean; pk: boolean }>
  row_count: number
}

let cachedSchema: SchemaTable[] | null = null
let cacheTime = 0

function getTableInfo(db: ReturnType<typeof getDatabase>): SchemaTable[] {
  const now = Date.now()
  if (cachedSchema && now - cacheTime < 60000) return cachedSchema

  const tables = ['products', 'customers', 'employees', 'sales', 'sale_items', 'sale_payments', 'expenses']
  const schema: SchemaTable[] = []

  for (const table of tables) {
    const columns = db
      .prepare(`PRAGMA table_info(${table})`)
      .all() as Array<{ name: string; type: string; notnull: number; pk: number }>

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number }

    schema.push({
      name: table,
      columns: columns.map((c) => ({
        name: c.name,
        type: c.type,
        nullable: c.notnull === 0,
        pk: c.pk === 1
      })),
      row_count: countRow.count
    })
  }

  cachedSchema = schema
  cacheTime = now
  return schema
}

export function buildSchemaContext(): string {
  const db = getDatabase()
  const schema = getTableInfo(db)

  let context = 'DATABASE SCHEMA:\n'
  for (const table of schema) {
    context += `\nTABLE: ${table.name} (${table.row_count} rows)\n`
    context += 'COLUMNS:\n'
    for (const col of table.columns) {
      const flags = [col.pk ? 'PK' : '', !col.nullable ? 'NOT NULL' : ''].filter(Boolean).join(', ')
      context += `  - ${col.name} (${col.type})${flags ? ` [${flags}]` : ''}\n`
    }
  }
  return context
}

export function buildRecentDataContext(): string {
  const db = getDatabase()

  const recentSales = db
    .prepare(
      `SELECT s.invoice_number, s.grand_total, s.sale_date, c.name as customer, s.status
       FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
       ORDER BY s.sale_date DESC LIMIT 5`
    )
    .all() as Array<{ invoice_number: string; grand_total: number; sale_date: string; customer: string | null; status: string }>

  const lowStock = db
    .prepare(
      `SELECT name, sku, stock_quantity, min_stock_level
       FROM products WHERE is_active = 1 AND stock_quantity <= min_stock_level
       LIMIT 5`
    )
    .all() as Array<{ name: string; sku: string; stock_quantity: number; min_stock_level: number }>

  const todaySales = db
    .prepare(
      `SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count
       FROM sales WHERE date(sale_date) = date('now') AND status != 'cancelled'`
    )
    .get() as { total: number; count: number }

  let context = 'RECENT DATA SUMMARY:\n'

  context += `\n--- Today's Sales ---\n`
  context += `Total: $${todaySales.total.toFixed(2)}\n`
  context += `Orders: ${todaySales.count}\n`

  context += `\n--- Recent Sales (Last 5) ---\n`
  for (const s of recentSales) {
    context += `  ${s.invoice_number}: $${s.grand_total.toFixed(2)} on ${s.sale_date} by ${s.customer || 'Walk-in'} [${s.status}]\n`
  }

  if (lowStock.length > 0) {
    context += `\n--- Low Stock Alerts (${lowStock.length} items) ---\n`
    for (const p of lowStock) {
      context += `  ${p.name} (${p.sku}): ${p.stock_quantity} left, min ${p.min_stock_level}\n`
    }
  }

  return context
}

export function clearSchemaCache(): void {
  cachedSchema = null
  cacheTime = 0
}
