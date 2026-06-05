import { getDatabase } from '../database/connection'

export interface DailySalesRow {
  date: string
  total: number
  count: number
}

export interface MonthlySalesRow {
  month: string
  total: number
  count: number
}

export interface TopProductRow {
  product_id: string
  name: string
  sku: string
  quantity_sold: number
  revenue: number
}

export interface LowStockRow {
  id: string
  sku: string
  name: string
  category: string
  stock_quantity: number
  min_stock_level: number
  reorder_amount: number
}

export interface ExpenseSummaryRow {
  category: string
  total: number
  count: number
  percentage: number
}

export interface DashboardOverview {
  today_sales: number
  today_count: number
  week_sales: number
  month_sales: number
  pending_invoices: number
  pending_invoice_total: number
  low_stock_count: number
  total_products: number
  total_customers: number
  cash: number
  bank: number
}

export interface ProfitEstimate {
  revenue: number
  cost_of_goods: number
  gross_profit: number
  gross_margin: number
  expenses: number
  net_profit: number
  period: string
}

export const analyticsService = {
  getDashboardOverview(): DashboardOverview {
    const db = getDatabase()
    const now = new Date()
    const today = now.toISOString().slice(0, 10)

    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = weekStart.toISOString().slice(0, 10)

    const todaySales = db
      .prepare(
        `SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count
         FROM sales WHERE date(sale_date) = ? AND status != 'cancelled'`
      )
      .get(today) as { total: number; count: number }

    const weekSales = db
      .prepare(
        `SELECT COALESCE(SUM(grand_total), 0) as total
         FROM sales WHERE date(sale_date) >= ? AND status != 'cancelled'`
      )
      .get(weekStartStr) as { total: number }

    const monthSales = db
      .prepare(
        `SELECT COALESCE(SUM(grand_total), 0) as total
         FROM sales WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now') AND status != 'cancelled'`
      )
      .get() as { total: number }

    const pendingInvoices = db
      .prepare(
        `SELECT COUNT(*) as count, COALESCE(SUM(balance_due), 0) as total
         FROM sales WHERE payment_status IN ('unpaid', 'partial') AND status != 'cancelled'`
      )
      .get() as { count: number; total: number }

    const lowStock = db
      .prepare(
        `SELECT COUNT(*) as count FROM products WHERE is_active = 1 AND stock_quantity <= min_stock_level`
      )
      .get() as { count: number }

    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers WHERE is_active = 1').get() as { count: number }

    const paymentSums = db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as cash,
           COALESCE(SUM(CASE WHEN payment_method != 'cash' THEN amount ELSE 0 END), 0) as bank
         FROM sale_payments WHERE date(payment_date) = ?`
      )
      .get(today) as { cash: number; bank: number }

    return {
      today_sales: todaySales.total,
      today_count: todaySales.count,
      week_sales: weekSales.total,
      month_sales: monthSales.total,
      pending_invoices: pendingInvoices.count,
      pending_invoice_total: pendingInvoices.total,
      low_stock_count: lowStock.count,
      total_products: totalProducts.count,
      total_customers: totalCustomers.count,
      cash: paymentSums.cash,
      bank: paymentSums.bank
    }
  },

  getDailySales(days = 30): DailySalesRow[] {
    const db = getDatabase()
    return db
      .prepare(
        `SELECT date(sale_date) as date,
                COALESCE(SUM(grand_total), 0) as total,
                COUNT(*) as count
         FROM sales
         WHERE sale_date >= date('now', '-' || ? || ' days') AND status != 'cancelled'
         GROUP BY date(sale_date)
         ORDER BY date ASC`
      )
      .all(String(days)) as DailySalesRow[]
  },

  getWeeklySales(weeks = 12): MonthlySalesRow[] {
    const db = getDatabase()
    return db
      .prepare(
        `SELECT strftime('%Y-W%W', sale_date) as month,
                COALESCE(SUM(grand_total), 0) as total,
                COUNT(*) as count
         FROM sales
         WHERE sale_date >= date('now', '-' || ? || ' days') AND status != 'cancelled'
         GROUP BY month
         ORDER BY month ASC`
      )
      .all(String(weeks * 7)) as MonthlySalesRow[]
  },

  getMonthlySales(months = 12): MonthlySalesRow[] {
    const db = getDatabase()
    return db
      .prepare(
        `SELECT strftime('%Y-%m', sale_date) as month,
                COALESCE(SUM(grand_total), 0) as total,
                COUNT(*) as count
         FROM sales
         WHERE sale_date >= date('now', '-' || ? || ' months') AND status != 'cancelled'
         GROUP BY month
         ORDER BY month ASC`
      )
      .all(String(months)) as MonthlySalesRow[]
  },

  getTopProducts(limit = 10): TopProductRow[] {
    const db = getDatabase()
    return db
      .prepare(
        `SELECT p.id as product_id, p.name, p.sku,
                SUM(si.quantity) as quantity_sold,
                SUM(si.total) as revenue
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id AND s.status != 'cancelled'
         JOIN products p ON p.id = si.product_id
         GROUP BY p.id
         ORDER BY revenue DESC
         LIMIT ?`
      )
      .all(limit) as TopProductRow[]
  },

  getLowStockProducts(): LowStockRow[] {
    const db = getDatabase()
    return db
      .prepare(
        `SELECT id, sku, name, category, stock_quantity, min_stock_level,
                CAST(MAX(min_stock_level * 2 - stock_quantity, 0) AS INTEGER) as reorder_amount
         FROM products
         WHERE is_active = 1 AND stock_quantity <= min_stock_level
         ORDER BY stock_quantity ASC`
      )
      .all() as LowStockRow[]
  },

  getExpenseSummary(months = 1): ExpenseSummaryRow[] {
    const db = getDatabase()
    const total = db
      .prepare(
        `SELECT COALESCE(SUM(amount + tax_amount), 0) as total
         FROM expenses
         WHERE expense_date >= date('now', '-' || ? || ' months')`
      )
      .get(String(months)) as { total: number }

    const rows = db
      .prepare(
        `SELECT category,
                COALESCE(SUM(amount + tax_amount), 0) as total,
                COUNT(*) as count
         FROM expenses
         WHERE expense_date >= date('now', '-' || ? || ' months')
         GROUP BY category
         ORDER BY total DESC`
      )
      .all(String(months)) as ExpenseSummaryRow[]

    const grandTotal = total.total || 1
    return rows.map((r) => ({
      ...r,
      percentage: Math.round((r.total / grandTotal) * 100)
    }))
  },

  getProfitEstimate(months = 1): ProfitEstimate {
    const db = getDatabase()

    const revenue = db
      .prepare(
        `SELECT COALESCE(SUM(grand_total), 0) as total
         FROM sales
         WHERE sale_date >= date('now', '-' || ? || ' months') AND status != 'cancelled'`
      )
      .get(String(months)) as { total: number }

    const costOfGoods = db
      .prepare(
        `SELECT COALESCE(SUM(si.quantity * p.cost_price), 0) as total
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id AND s.status != 'cancelled'
         JOIN products p ON p.id = si.product_id
         WHERE s.sale_date >= date('now', '-' || ? || ' months')`
      )
      .get(String(months)) as { total: number }

    const expenses = db
      .prepare(
        `SELECT COALESCE(SUM(amount + tax_amount), 0) as total
         FROM expenses
         WHERE expense_date >= date('now', '-' || ? || ' months')`
      )
      .get(String(months)) as { total: number }

    const rev = revenue.total
    const cog = costOfGoods.total
    const exp = expenses.total
    const grossProfit = rev - cog
    const netProfit = grossProfit - exp
    const grossMargin = rev > 0 ? Math.round((grossProfit / rev) * 100) : 0

    return {
      revenue: rev,
      cost_of_goods: cog,
      gross_profit: grossProfit,
      gross_margin: grossMargin,
      expenses: exp,
      net_profit: netProfit,
      period: `Last ${months} month(s)`
    }
  }
}
