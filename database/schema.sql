-- ============================================================================
-- Business OS — Production Database Schema
-- SQLite 3.x
-- ============================================================================

-- Enable WAL mode for concurrent reads during writes
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000;

-- ============================================================================
-- PRODUCTS
-- ============================================================================
-- Core inventory entity. All monetary values stored as REAL (formatted at UI).
-- Soft deletes via is_active to preserve referential integrity with sales.
CREATE TABLE IF NOT EXISTS products (
    id              TEXT PRIMARY KEY,                          -- UUID v4 (client-generated)
    sku             TEXT UNIQUE NOT NULL,                      -- Stock Keeping Unit
    name            TEXT NOT NULL,
    description     TEXT DEFAULT '',
    category        TEXT NOT NULL DEFAULT 'general',           -- See categories lookup
    unit            TEXT NOT NULL DEFAULT 'pc',                -- pc, kg, m, liter, hour
    cost_price      REAL NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    selling_price   REAL NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
    tax_rate        REAL NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
    stock_quantity  REAL NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_level REAL NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0),
    barcode         TEXT DEFAULT '',                           -- EAN-13 / UPC
    is_active       INTEGER NOT NULL DEFAULT 1,               -- 1=active, 0=archived
    notes           TEXT DEFAULT '',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku     ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_active  ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(stock_quantity) WHERE stock_quantity <= min_stock_level;

-- ============================================================================
-- CUSTOMERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id              TEXT PRIMARY KEY,
    code            TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    company         TEXT DEFAULT '',
    email           TEXT DEFAULT '',
    phone           TEXT DEFAULT '',
    mobile          TEXT DEFAULT '',
    address_line1   TEXT DEFAULT '',
    address_line2   TEXT DEFAULT '',
    city            TEXT DEFAULT '',
    state           TEXT DEFAULT '',
    postal_code     TEXT DEFAULT '',
    country         TEXT DEFAULT '',
    tax_id          TEXT DEFAULT '',
    payment_terms   TEXT NOT NULL DEFAULT 'net_30',            -- net_15, net_30, cod
    credit_limit    REAL DEFAULT 0 CHECK (credit_limit >= 0),
    is_active       INTEGER NOT NULL DEFAULT 1,
    notes           TEXT DEFAULT '',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_code   ON customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

-- ============================================================================
-- EMPLOYEES
-- ============================================================================
-- Tax_id field to be encrypted via Electron safeStorage at the application layer.
CREATE TABLE IF NOT EXISTS employees (
    id                TEXT PRIMARY KEY,
    employee_code     TEXT UNIQUE NOT NULL,
    first_name        TEXT NOT NULL,
    last_name         TEXT NOT NULL,
    email             TEXT UNIQUE DEFAULT '',
    phone             TEXT DEFAULT '',
    position          TEXT NOT NULL,
    department        TEXT NOT NULL,                           -- sales, admin, production, etc.
    hire_date         TEXT DEFAULT '',
    termination_date  TEXT DEFAULT '',
    employment_type   TEXT NOT NULL DEFAULT 'full_time',       -- full_time, part_time, contractor
    salary            REAL DEFAULT 0 CHECK (salary >= 0),
    pay_frequency     TEXT NOT NULL DEFAULT 'monthly',
    tax_id            TEXT DEFAULT '',                         -- ENCRYPTED at app layer
    address           TEXT DEFAULT '',
    emergency_contact TEXT DEFAULT '',
    is_active         INTEGER NOT NULL DEFAULT 1,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_employees_code  ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_dept  ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);

-- ============================================================================
-- SALES
-- ============================================================================
-- Parent entity. balance_due is a STORED generated column — always consistent.
CREATE TABLE IF NOT EXISTS sales (
    id              TEXT PRIMARY KEY,
    invoice_number  TEXT UNIQUE NOT NULL,                      -- INV-YYYY-NNNN
    customer_id     TEXT NOT NULL REFERENCES customers(id),
    employee_id     TEXT REFERENCES employees(id),
    sale_date       TEXT NOT NULL DEFAULT (datetime('now')),
    due_date        TEXT DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'pending',           -- pending, completed, cancelled, refunded
    subtotal        REAL NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_total       REAL NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
    discount_total  REAL NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
    grand_total     REAL NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
    amount_paid     REAL NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    balance_due     REAL GENERATED ALWAYS AS (grand_total - amount_paid) STORED,
    payment_method  TEXT DEFAULT '',
    payment_status  TEXT NOT NULL DEFAULT 'unpaid',            -- unpaid, partial, paid, refunded
    notes           TEXT DEFAULT '',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sales_customer  ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date      ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_status    ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_payment   ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_invoice   ON sales(invoice_number);

-- ============================================================================
-- SALE ITEMS (child of sales)
-- ============================================================================
-- total is STORED generated — computed at INSERT/UPDATE time, never stale.
-- Deleting a sale CASCADES to its items.
CREATE TABLE IF NOT EXISTS sale_items (
    id          TEXT PRIMARY KEY,
    sale_id     TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id  TEXT NOT NULL REFERENCES products(id),
    quantity    REAL NOT NULL DEFAULT 0 CHECK (quantity > 0),
    unit_price  REAL NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    discount    REAL NOT NULL DEFAULT 0 CHECK (discount >= 0),
    tax_rate    REAL NOT NULL DEFAULT 0,
    tax_amount  REAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total       REAL GENERATED ALWAYS AS ((quantity * unit_price - discount) + tax_amount) STORED
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale    ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- ============================================================================
-- SALE PAYMENTS (child of sales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sale_payments (
    id             TEXT PRIMARY KEY,
    sale_id        TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    amount         REAL NOT NULL DEFAULT 0 CHECK (amount > 0),
    payment_date   TEXT NOT NULL DEFAULT (datetime('now')),
    payment_method TEXT DEFAULT '',                            -- cash, card, transfer, check
    reference      TEXT DEFAULT '',
    notes          TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON sale_payments(sale_id);

-- ============================================================================
-- EXPENSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
    id                 TEXT PRIMARY KEY,
    expense_number     TEXT UNIQUE NOT NULL,                   -- EXP-YYYY-NNNN
    category           TEXT NOT NULL,                          -- utilities, rent, supplies, salaries, travel, etc.
    description        TEXT NOT NULL,
    amount             REAL NOT NULL DEFAULT 0 CHECK (amount >= 0),
    tax_amount         REAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    expense_date       TEXT NOT NULL DEFAULT (datetime('now')),
    due_date           TEXT DEFAULT '',
    employee_id        TEXT REFERENCES employees(id),
    vendor             TEXT DEFAULT '',
    payment_method     TEXT DEFAULT '',
    payment_status     TEXT NOT NULL DEFAULT 'unpaid',         -- unpaid, paid
    receipt_path       TEXT DEFAULT '',                        -- local file path
    is_recurring       INTEGER NOT NULL DEFAULT 0,
    recurring_frequency TEXT DEFAULT '',
    notes              TEXT DEFAULT '',
    created_at         TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status   ON expenses(payment_status);

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- Migration tracker
CREATE TABLE IF NOT EXISTS schema_migrations (
    version    INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Key-value settings (business info, tax defaults, invoice numbering)
CREATE TABLE IF NOT EXISTS app_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Immutable audit trail
CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,                                 -- product, customer, sale, expense, employee
    entity_id   TEXT NOT NULL,
    action      TEXT NOT NULL,                                 -- create, update, delete, payment
    changes     TEXT DEFAULT '',                               -- JSON diff of before/after
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_date   ON audit_log(created_at);
