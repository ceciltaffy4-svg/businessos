-- ============================================================================
-- Business OS — Seed Data
-- Demo data for development and testing
-- ============================================================================

-- Products
INSERT INTO products (id, sku, name, description, category, unit, cost_price, selling_price, tax_rate, stock_quantity, min_stock_level, barcode, is_active, notes) VALUES
  ('a1b2c3d4-0001-4000-8001-000000000001', 'LAP-HP-PRO', 'HP ProBook 450 G10', 'Business laptop, 16GB RAM, 512GB SSD', 'Electronics', 'pc', 650.00, 899.00, 20.0, 25, 5, '8806091234567', 1, ''),
  ('a1b2c3d4-0001-4000-8001-000000000002', 'MON-DELL-27', 'Dell 27" 4K Monitor', 'UltraSharp U2723QE USB-C hub', 'Electronics', 'pc', 350.00, 499.00, 20.0, 12, 3, '8806091234568', 1, ''),
  ('a1b2c3d4-0001-4000-8001-000000000003', 'CHR-OFFCE-EX', 'Executive Office Chair', 'Ergonomic mesh back, lumbar support', 'Furniture', 'pc', 210.00, 349.00, 20.0, 8, 2, '8806091234569', 1, ''),
  ('a1b2c3d4-0001-4000-8001-000000000004', 'DESK-STAND', 'Adjustable Standing Desk', 'Electric height adjustment 120x60cm', 'Furniture', 'pc', 380.00, 599.00, 20.0, 3, 2, '8806091234570', 1, 'LOW STOCK'),
  ('a1b2c3d4-0001-4000-8001-000000000005', 'CAB-CAT6-3M', 'Cat6 Ethernet Cable 3m', 'Gigabit, shielded, snagless', 'Accessories', 'pc', 3.50, 7.99, 20.0, 200, 50, '8806091234571', 1, ''),
  ('a1b2c3d4-0001-4000-8001-000000000006', 'SW-NET-24', 'Cisco SG350-24 Switch', '24-port gigabit managed switch', 'Networking', 'pc', 520.00, 749.00, 20.0, 0, 2, '8806091234572', 0, 'Discontinued'),
  ('a1b2c3d4-0001-4000-8001-000000000007', 'LIC-OFF365-BP', 'Microsoft 365 Business Premium', 'Annual subscription per user', 'Software', 'license', 120.00, 180.00, 0.0, 50, 10, '', 1, ''),
  ('a1b2c3d4-0001-4000-8001-000000000008', 'SRV-HR-CONSULT', 'HR Consulting — hourly rate', 'On-site HR advisory services', 'Services', 'hour', 0.00, 150.00, 20.0, 9999, 0, '', 1, 'Service — no stock limit');

-- Customers
INSERT INTO customers (id, code, name, company, email, phone, city, payment_terms, credit_limit) VALUES
  ('b2c3d4e5-0002-4000-8002-000000000001', 'C001', 'Acme Corporation', 'Acme Corp Ltd.', 'orders@acme.com', '+1-555-0100', 'New York', 'net_30', 50000.00),
  ('b2c3d4e5-0002-4000-8002-000000000002', 'C002', 'Globex Inc.', 'Globex Industries', 'purchasing@globex.com', '+1-555-0200', 'Chicago', 'net_15', 25000.00),
  ('b2c3d4e5-0002-4000-8002-000000000003', 'C003', 'Initech', 'Initech Solutions', 'billing@initech.com', '+1-555-0300', 'Austin', 'cod', 10000.00);

-- Employees
INSERT INTO employees (id, employee_code, first_name, last_name, email, position, department, hire_date, salary) VALUES
  ('c3d4e5f6-0003-4000-8003-000000000001', 'E001', 'Alice', 'Johnson', 'alice@businessos.local', 'Sales Manager', 'sales', '2022-03-15', 85000.00),
  ('c3d4e5f6-0003-4000-8003-000000000002', 'E002', 'Bob', 'Smith', 'bob@businessos.local', 'Sales Representative', 'sales', '2023-06-01', 55000.00),
  ('c3d4e5f6-0003-4000-8003-000000000003', 'E003', 'Carol', 'Williams', 'carol@businessos.local', 'Accountant', 'admin', '2021-11-01', 62000.00);

-- Sales
INSERT INTO sales (id, invoice_number, customer_id, employee_id, sale_date, status, subtotal, tax_total, discount_total, grand_total, amount_paid, payment_status) VALUES
  ('d4e5f6a7-0004-4000-8004-000000000001', 'INV-2026-0001', 'b2c3d4e5-0002-4000-8002-000000000001', 'c3d4e5f6-0003-4000-8003-000000000001', '2026-06-01', 'completed', 1798.00, 359.60, 100.00, 2057.60, 2057.60, 'paid'),
  ('d4e5f6a7-0004-4000-8004-000000000002', 'INV-2026-0002', 'b2c3d4e5-0002-4000-8002-000000000002', 'c3d4e5f6-0003-4000-8003-000000000002', '2026-06-02', 'pending', 749.00, 149.80, 0.00, 898.80, 300.00, 'partial');

-- Sale Items
INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, discount, tax_rate, tax_amount)
VALUES
  ('e5f6a7b8-0005-4000-8005-000000000001', 'd4e5f6a7-0004-4000-8004-000000000001', 'a1b2c3d4-0001-4000-8001-000000000001', 2, 899.00, 100.00, 20.0, 359.60),
  ('e5f6a7b8-0005-4000-8005-000000000002', 'd4e5f6a7-0004-4000-8004-000000000002', 'a1b2c3d4-0001-4000-8001-000000000002', 1, 499.00, 0.00, 20.0, 99.80),
  ('e5f6a7b8-0005-4000-8005-000000000003', 'd4e5f6a7-0004-4000-8004-000000000002', 'a1b2c3d4-0001-4000-8001-000000000003', 1, 349.00, 0.00, 20.0, 69.80);

-- Sale Payments
INSERT INTO sale_payments (id, sale_id, amount, payment_date, payment_method, reference)
VALUES
  ('f6a7b8c9-0006-4000-8006-000000000001', 'd4e5f6a7-0004-4000-8004-000000000001', 2057.60, '2026-06-01', 'transfer', 'TRF-001'),
  ('f6a7b8c9-0006-4000-8006-000000000002', 'd4e5f6a7-0004-4000-8004-000000000002', 300.00, '2026-06-02', 'cash', '');

-- Expenses
INSERT INTO expenses (id, expense_number, category, description, amount, tax_amount, expense_date, vendor, payment_status) VALUES
  ('a7b8c9d0-0007-4000-8007-000000000001', 'EXP-2026-0001', 'rent', 'Office rent — June 2026', 3500.00, 0.00, '2026-06-01', 'Landlord Properties LLC', 'paid'),
  ('a7b8c9d0-0007-4000-8007-000000000002', 'EXP-2026-0002', 'utilities', 'Electricity + Internet', 450.00, 0.00, '2026-06-03', 'City Power Co', 'paid'),
  ('a7b8c9d0-0007-4000-8007-000000000003', 'EXP-2026-0003', 'supplies', 'Office supplies — paper, toner', 280.00, 56.00, '2026-06-04', 'OfficeMart', 'unpaid');

-- App Settings
INSERT INTO app_settings (key, value) VALUES
  ('business_name', '"Business OS Demo"'),
  ('business_email', '"admin@businessos.local"'),
  ('business_phone', '"+1-555-0000"'),
  ('tax_default_rate', '20'),
  ('invoice_prefix', '"INV"');
