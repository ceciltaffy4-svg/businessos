import type Database from 'better-sqlite3'

export const migration001 = {
  version: 1,
  name: 'initial_schema',
  up(db: Database.Database): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT NOT NULL DEFAULT 'general',
        unit TEXT NOT NULL DEFAULT 'pc',
        cost_price REAL NOT NULL DEFAULT 0,
        selling_price REAL NOT NULL DEFAULT 0,
        tax_rate REAL NOT NULL DEFAULT 0,
        stock_quantity REAL NOT NULL DEFAULT 0,
        min_stock_level REAL NOT NULL DEFAULT 0,
        barcode TEXT DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_products_category ON products(category);
      CREATE INDEX idx_products_sku ON products(sku);
      CREATE INDEX idx_products_active ON products(is_active);

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        company TEXT DEFAULT '',
        email TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        mobile TEXT DEFAULT '',
        address_line1 TEXT DEFAULT '',
        address_line2 TEXT DEFAULT '',
        city TEXT DEFAULT '',
        state TEXT DEFAULT '',
        postal_code TEXT DEFAULT '',
        country TEXT DEFAULT '',
        tax_id TEXT DEFAULT '',
        payment_terms TEXT NOT NULL DEFAULT 'net_30',
        credit_limit REAL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_customers_code ON customers(code);
      CREATE INDEX idx_customers_active ON customers(is_active);

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        employee_code TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE DEFAULT '',
        phone TEXT DEFAULT '',
        position TEXT NOT NULL,
        department TEXT NOT NULL,
        hire_date TEXT DEFAULT '',
        termination_date TEXT DEFAULT '',
        employment_type TEXT NOT NULL DEFAULT 'full_time',
        salary REAL DEFAULT 0,
        pay_frequency TEXT NOT NULL DEFAULT 'monthly',
        tax_id TEXT DEFAULT '',
        address TEXT DEFAULT '',
        emergency_contact TEXT DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_employees_code ON employees(employee_code);
      CREATE INDEX idx_employees_dept ON employees(department);
      CREATE INDEX idx_employees_active ON employees(is_active);

      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id TEXT NOT NULL REFERENCES customers(id),
        employee_id TEXT REFERENCES employees(id),
        sale_date TEXT NOT NULL DEFAULT (datetime('now')),
        due_date TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        subtotal REAL NOT NULL DEFAULT 0,
        tax_total REAL NOT NULL DEFAULT 0,
        discount_total REAL NOT NULL DEFAULT 0,
        grand_total REAL NOT NULL DEFAULT 0,
        amount_paid REAL NOT NULL DEFAULT 0,
        balance_due REAL GENERATED ALWAYS AS (grand_total - amount_paid) STORED,
        payment_method TEXT DEFAULT '',
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_sales_customer ON sales(customer_id);
      CREATE INDEX idx_sales_date ON sales(sale_date);
      CREATE INDEX idx_sales_status ON sales(status);
      CREATE INDEX idx_sales_payment ON sales(payment_status);

      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id),
        quantity REAL NOT NULL DEFAULT 0,
        unit_price REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        tax_rate REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        total REAL GENERATED ALWAYS AS ((quantity * unit_price - discount) + tax_amount) STORED
      );

      CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);

      CREATE TABLE IF NOT EXISTS sale_payments (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        amount REAL NOT NULL DEFAULT 0,
        payment_date TEXT NOT NULL DEFAULT (datetime('now')),
        payment_method TEXT DEFAULT '',
        reference TEXT DEFAULT '',
        notes TEXT DEFAULT ''
      );

      CREATE INDEX idx_sale_payments_sale ON sale_payments(sale_id);

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        expense_number TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        expense_date TEXT NOT NULL DEFAULT (datetime('now')),
        due_date TEXT DEFAULT '',
        employee_id TEXT REFERENCES employees(id),
        vendor TEXT DEFAULT '',
        payment_method TEXT DEFAULT '',
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        receipt_path TEXT DEFAULT '',
        is_recurring INTEGER NOT NULL DEFAULT 0,
        recurring_frequency TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_expenses_category ON expenses(category);
      CREATE INDEX idx_expenses_date ON expenses(expense_date);
      CREATE INDEX idx_expenses_status ON expenses(payment_status);

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        changes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
      CREATE INDEX idx_audit_date ON audit_log(created_at);
    `)
  },
  down(db: Database.Database): void {
    db.exec(`
      DROP TABLE IF EXISTS sale_payments;
      DROP TABLE IF EXISTS sale_items;
      DROP TABLE IF EXISTS sales;
      DROP TABLE IF EXISTS expenses;
      DROP TABLE IF EXISTS employees;
      DROP TABLE IF EXISTS customers;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS app_settings;
      DROP TABLE IF EXISTS audit_log;
    `)
  }
}
