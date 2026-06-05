import type Database from 'better-sqlite3'

export const migration002 = {
  version: 2,
  name: 'performance_indexes_and_defaults',
  up(db: Database.Database): void {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
      CREATE INDEX IF NOT EXISTS idx_sale_payments_date ON sale_payments(payment_date);
      CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor);
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE INDEX IF NOT EXISTS idx_sales_due_date ON sales(due_date);

      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('business_name', 'Your Business Name');
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('business_address', '123 Main Street, City');
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('business_phone', '+1-555-0000');
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('business_email', 'info@business.com');
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('business_tax_id', 'TAX-123456');
    `)
  }
}
