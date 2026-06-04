import { getDatabase } from '../connection'

export interface EmployeeRow {
  id: string
  employee_code: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  department: string
  hire_date: string
  termination_date: string
  employment_type: string
  salary: number
  pay_frequency: string
  tax_id: string
  address: string
  emergency_contact: string
  is_active: number
  created_at: string
  updated_at: string
}

export interface EmployeeFilters {
  search?: string
  department?: string
  is_active?: number
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export const employeeRepo = {
  findAll(filters: EmployeeFilters = {}): PaginatedResult<EmployeeRow> {
    const db = getDatabase()
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters.search) {
      conditions.push('(first_name LIKE ? OR last_name LIKE ? OR employee_code LIKE ? OR email LIKE ?)')
      const q = `%${filters.search}%`
      params.push(q, q, q, q)
    }
    if (filters.department) {
      conditions.push('department = ?')
      params.push(filters.department)
    }
    if (filters.is_active !== undefined) {
      conditions.push('is_active = ?')
      params.push(filters.is_active)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 50
    const offset = (page - 1) * pageSize

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM employees ${where}`).get(...params) as { count: number }

    const rows = db
      .prepare(`SELECT * FROM employees ${where} ORDER BY last_name ASC, first_name ASC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as EmployeeRow[]

    return { data: rows, total: countRow.count, page, pageSize }
  },

  findById(id: string): EmployeeRow | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM employees WHERE id = ?').get(id) as EmployeeRow | undefined
  },

  create(data: Omit<EmployeeRow, 'created_at' | 'updated_at'>): EmployeeRow {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO employees (id, employee_code, first_name, last_name, email, phone,
        position, department, hire_date, termination_date, employment_type,
        salary, pay_frequency, tax_id, address, emergency_contact, is_active)
      VALUES (@id, @employee_code, @first_name, @last_name, @email, @phone,
        @position, @department, @hire_date, @termination_date, @employment_type,
        @salary, @pay_frequency, @tax_id, @address, @emergency_contact, @is_active)
    `)
    stmt.run(data)
    return this.findById(data.id)!
  },

  update(id: string, data: Partial<Omit<EmployeeRow, 'id' | 'created_at' | 'updated_at'>>): EmployeeRow | undefined {
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
    db.prepare(`UPDATE employees SET ${sets.join(', ')} WHERE id = @id`).run(params)
    return this.findById(id)
  },

  delete(id: string): void {
    const db = getDatabase()
    db.prepare("UPDATE employees SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id)
  }
}
