export interface Product {
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

export interface Customer {
  id: string
  code: string
  name: string
  company: string
  email: string
  phone: string
  mobile: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  tax_id: string
  payment_terms: string
  credit_limit: number
  is_active: number
  notes: string
  created_at: string
  updated_at: string
}

export interface Employee {
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

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount: number
  tax_rate: number
  tax_amount: number
  total: number
}

export interface SalePayment {
  id: string
  sale_id: string
  amount: number
  payment_date: string
  payment_method: string
  reference: string
  notes: string
}

export interface Sale {
  id: string
  invoice_number: string
  customer_id: string
  employee_id: string | null
  sale_date: string
  due_date: string
  status: string
  subtotal: number
  tax_total: number
  discount_total: number
  grand_total: number
  amount_paid: number
  balance_due: number
  payment_method: string
  payment_status: string
  notes: string
  created_at: string
  updated_at: string
  items: SaleItem[]
  payments: SalePayment[]
  customer_name?: string
  employee_name?: string
}

export interface Expense {
  id: string
  expense_number: string
  category: string
  description: string
  amount: number
  tax_amount: number
  expense_date: string
  due_date: string
  employee_id: string | null
  vendor: string
  payment_method: string
  payment_status: string
  receipt_path: string
  is_recurring: number
  recurring_frequency: string
  notes: string
  created_at: string
  updated_at: string
}
