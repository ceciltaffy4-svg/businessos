import { getDatabase } from '../connection'

export interface ProductRow {
  id: string
  sku: string
  name: string
  description: string
  category: string
  unit: string
  cost_price: number
  selling_price: number
  tax_rate: number
  stock_quantity: number
  min_stock_level: number
  barcode: string
  is_active: number
  notes: string
  created_at: string
  updated_at: string
}

export interface ProductFilters {
  search?: string
  category?: string
  is_active?: number
  low_stock?: boolean
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export const productRepo = {
  findAll(filters: ProductFilters = {}): PaginatedResult<ProductRow> {
    const db = getDatabase()
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters.search) {
      conditions.push('(name LIKE ? OR sku LIKE ? OR barcode LIKE ?)')
      const q = `%${filters.search}%`
      params.push(q, q, q)
    }
    if (filters.category) {
      conditions.push('category = ?')
      params.push(filters.category)
    }
    if (filters.is_active !== undefined) {
      conditions.push('is_active = ?')
      params.push(filters.is_active)
    }
    if (filters.low_stock) {
      conditions.push('stock_quantity <= min_stock_level')
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 50
    const offset = (page - 1) * pageSize

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM products ${where}`).get(...params) as { count: number }

    const rows = db
      .prepare(`SELECT * FROM products ${where} ORDER BY name ASC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as ProductRow[]

    return { data: rows, total: countRow.count, page, pageSize }
  },

  findById(id: string): ProductRow | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined
  },

  findBySku(sku: string): ProductRow | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM products WHERE sku = ?').get(sku) as ProductRow | undefined
  },

  findByBarcode(barcode: string): ProductRow | undefined {
    const db = getDatabase()
    if (!barcode) return undefined
    return db.prepare('SELECT * FROM products WHERE barcode = ? AND is_active = 1').get(barcode) as ProductRow | undefined
  },

  searchForPos(query: string): ProductRow[] {
    const db = getDatabase()
    const q = `%${query}%`
    return db
      .prepare(
        `SELECT * FROM products WHERE is_active = 1 AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?) ORDER BY name ASC LIMIT 20`
      )
      .all(q, q, q) as ProductRow[]
  },

  findAllActive(): ProductRow[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC').all() as ProductRow[]
  },

  create(data: Omit<ProductRow, 'created_at' | 'updated_at'>): ProductRow {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO products (id, sku, name, description, category, unit, cost_price, selling_price,
        tax_rate, stock_quantity, min_stock_level, barcode, is_active, notes)
      VALUES (@id, @sku, @name, @description, @category, @unit, @cost_price, @selling_price,
        @tax_rate, @stock_quantity, @min_stock_level, @barcode, @is_active, @notes)
    `)
    stmt.run(data)
    return this.findById(data.id)!
  },

  update(id: string, data: Partial<Omit<ProductRow, 'id' | 'created_at' | 'updated_at'>>): ProductRow | undefined {
    const db = getDatabase()
    const sets: string[] = []
    const params: Record<string, unknown> = { id }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sets.push(`${key} = @${key}`)
        params[key] = value
      }
    }

    if (sets.length === 0) return this.findById(id)

    sets.push("updated_at = datetime('now')")
    db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = @id`).run(params)
    return this.findById(id)
  },

  delete(id: string): void {
    const db = getDatabase()
    db.prepare("UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id)
  },

  hardDelete(id: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM products WHERE id = ?').run(id)
  }
}
