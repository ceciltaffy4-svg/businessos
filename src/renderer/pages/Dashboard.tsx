import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../lib/api'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

interface DashboardData {
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

interface DailySale {
  date: string
  total: number
  count: number
}

interface TopProduct {
  product_id: string
  name: string
  sku: string
  quantity_sold: number
  revenue: number
}

interface LowStockItem {
  id: string
  sku: string
  name: string
  category: string
  stock_quantity: number
  min_stock_level: number
  reorder_amount: number
}

interface ExpenseCat {
  category: string
  total: number
  count: number
  percentage: number
}

interface ProfitData {
  revenue: number
  cost_of_goods: number
  gross_profit: number
  gross_margin: number
  expenses: number
  net_profit: number
  period: string
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function Dashboard() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<DashboardData | null>(null)
  const [dailySales, setDailySales] = useState<DailySale[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [expenses, setExpenses] = useState<ExpenseCat[]>([])
  const [profit, setProfit] = useState<ProfitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [d, ds, tp, ls, es, p] = await Promise.all([
      api.analytics.dashboard(),
      viewMode === 'daily' ? api.analytics.dailySales(30) : api.analytics.monthlySales(12),
      api.analytics.topProducts(8),
      api.analytics.lowStock(),
      api.analytics.expenseSummary(1),
      api.analytics.profitEstimate(1)
    ])
    if (d.success) setOverview(d.data as DashboardData)
    if (ds.success) setDailySales(ds.data as DailySale[])
    if (tp.success) setTopProducts(tp.data as TopProduct[])
    if (ls.success) setLowStock(ls.data as LowStockItem[])
    if (es.success) setExpenses(es.data as ExpenseCat[])
    if (p.success) setProfit(p.data as ProfitData)
    setLoading(false)
  }, [viewMode])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading || !overview) {
    return <div className="text-surface-500 py-12 text-center">Loading dashboard...</div>
  }

  const chartData = dailySales.map((d) => ({
    date: d.date.slice(5),
    total: d.total,
    count: d.count
  }))

  const profitPieData = profit
    ? [
        { name: 'Cost of Goods', value: profit.cost_of_goods },
        { name: 'Gross Profit', value: profit.gross_profit },
        { name: 'Expenses', value: profit.expenses }
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p className="text-surface-500 text-sm mt-0.5">Real-time business overview</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'daily' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('daily')}
          >
            30 Days
          </Button>
          <Button
            variant={viewMode === 'monthly' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('monthly')}
          >
            12 Months
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Today Sales" value={`$${overview.today_sales.toFixed(2)}`} sub={`${overview.today_count} orders`} />
        <StatCard label="This Week" value={`$${overview.week_sales.toFixed(2)}`} />
        <StatCard label="This Month" value={`$${overview.month_sales.toFixed(2)}`} />
        <StatCard label="Pending Invoices" value={`${overview.pending_invoices}`} sub={`$${overview.pending_invoice_total.toFixed(2)}`} color={overview.pending_invoices > 0 ? 'text-red-600' : ''} />
        <StatCard label="Low Stock" value={`${overview.low_stock_count}`} sub="items" color={overview.low_stock_count > 0 ? 'text-red-600' : ''} />
        <StatCard label="Customers" value={`${overview.total_customers}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-surface-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">
            {viewMode === 'daily' ? 'Daily Sales (30 days)' : 'Monthly Sales (12 months)'}
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Summary */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Profit (Last Month)</h2>
          {profit ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-surface-500">Revenue</span><span className="font-semibold">${profit.revenue.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">COGS</span><span className="text-red-600">-${profit.cost_of_goods.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm font-medium border-t border-surface-200 pt-2"><span>Gross Profit</span><span className={profit.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}>${profit.gross_profit.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">Gross Margin</span><span className="font-medium">{profit.gross_margin}%</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">Expenses</span><span className="text-red-600">-${profit.expenses.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base border-t border-surface-200 pt-2"><span>Net Profit</span><span className={profit.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>${profit.net_profit.toFixed(2)}</span></div>
              {profitPieData.length > 0 && (
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={profitPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={60} dataKey="value" paddingAngle={2}>
                        {profitPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <p className="text-surface-400 text-sm">No data yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm">
          <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-900">Top Products</h2>
            <button onClick={() => navigate('/products')} className="text-sm text-brand-600 hover:text-brand-700">View All</button>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-6 text-surface-400 text-sm text-center">No sales data yet.</div>
          ) : (
            <div className="divide-y divide-surface-100">
              {topProducts.map((p, i) => (
                <div key={p.product_id} className="px-6 py-3 flex items-center gap-4">
                  <span className="text-xs font-bold text-surface-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-surface-500 font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${p.revenue.toFixed(2)}</p>
                    <p className="text-xs text-surface-500">{p.quantity_sold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense Summary */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm">
          <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-900">Expenses This Month</h2>
            <button onClick={() => navigate('/expenses')} className="text-sm text-brand-600 hover:text-brand-700">View All</button>
          </div>
          {expenses.length === 0 ? (
            <div className="p-6 text-surface-400 text-sm text-center">No expenses recorded.</div>
          ) : (
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expenses} cx="50%" cy="50%" outerRadius={70} dataKey="total" nameKey="category" label={({ category, percentage }) => `${category} ${percentage}%`}>
                    {expenses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {expenses.map((e, i) => (
                  <div key={e.category} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 capitalize">{e.category}</span>
                    <span className="font-mono">${e.total.toFixed(2)}</span>
                    <span className="text-surface-400 text-xs">{e.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm">
          <div className="px-6 py-4 border-b border-red-100 flex items-center gap-2">
            <Badge variant="danger">{lowStock.length} items</Badge>
            <h2 className="text-lg font-semibold text-surface-900">Low Stock Alerts</h2>
            <div className="ml-auto">
              <button onClick={() => navigate('/products')} className="text-sm text-brand-600 hover:text-brand-700">Manage</button>
            </div>
          </div>
          <div className="divide-y divide-surface-100">
            {lowStock.slice(0, 6).map((item) => (
              <div key={item.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-surface-500 font-mono">{item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-red-600 font-bold">{item.stock_quantity}</p>
                  <p className="text-xs text-surface-500">Min: {item.min_stock_level} | Reorder: {item.reorder_amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-4">
      <p className="text-xs text-surface-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${color ?? 'text-surface-900'}`}>{value}</p>
      {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
    </div>
  )
}
