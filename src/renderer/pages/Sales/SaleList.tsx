import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import DataTable, { type Column } from '../../components/ui/DataTable'
import SearchInput from '../../components/ui/SearchInput'
import Pagination from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import type { Sale } from '../../types'

interface SaleRow extends Sale {
  customer_name?: string
  employee_name?: string
}

export default function SaleList() {
  const navigate = useNavigate()
  const [sales, setSales] = useState<SaleRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const pageSize = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    const result = await api.sales.list({
      status: statusFilter || undefined,
      payment_status: paymentFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
      pageSize
    })
    if (result.success) {
      setSales(result.data as SaleRow[])
      if (result.meta) setTotal(result.meta.total)
    }
    setLoading(false)
  }, [statusFilter, paymentFilter, dateFrom, dateTo, page, pageSize])

  useEffect(() => { fetch() }, [fetch])

  const statusVariant = (s: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    switch (s) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'danger'
      case 'refunded': return 'info'
      default: return 'default'
    }
  }

  const paymentVariant = (s: string): 'success' | 'warning' | 'danger' => {
    switch (s) {
      case 'paid': return 'success'
      case 'partial': return 'warning'
      case 'unpaid': return 'danger'
      default: return 'danger'
    }
  }

  const columns: Column<SaleRow>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice',
      render: (s) => (
        <button
          onClick={() => navigate(`/sales/${s.id}`)}
          className="font-mono text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline"
        >
          {s.invoice_number}
        </button>
      )
    },
    {
      key: 'sale_date',
      header: 'Date',
      render: (s) => <span className="text-sm text-surface-600">{new Date(s.sale_date).toLocaleDateString()}</span>
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (s) => <span className="text-sm">{s.customer_name || '\u2014'}</span>
    },
    {
      key: 'grand_total',
      header: 'Total',
      render: (s) => <span className="font-mono font-semibold">${s.grand_total.toFixed(2)}</span>,
      className: 'text-right'
    },
    {
      key: 'balance_due',
      header: 'Balance',
      render: (s) => (
        <span className={`font-mono ${s.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {s.balance_due > 0 ? `$${s.balance_due.toFixed(2)}` : '$0.00'}
        </span>
      ),
      className: 'text-right'
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <Badge variant={statusVariant(s.status)}>{s.status}</Badge>,
      className: 'text-center'
    },
    {
      key: 'payment_status',
      header: 'Payment',
      render: (s) => <Badge variant={paymentVariant(s.payment_status)}>{s.payment_status}</Badge>,
      className: 'text-center'
    },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/${s.id}`)}>View</Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sales</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Payment</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="To date"
        />
      </div>

      <DataTable
        columns={columns}
        data={sales}
        keyExtractor={(s) => s.id}
        loading={loading}
        emptyMessage="No sales found."
      />

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  )
}
