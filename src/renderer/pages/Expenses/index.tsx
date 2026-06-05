import { useState, useEffect, useCallback } from 'react'
import api from '../../lib/api'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Pagination from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ExpenseForm from './ExpenseForm'
import type { Expense } from '../../types'
import type { ExpenseFormValues } from './expense.schema'

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null)
  const [categories, setCategories] = useState<string[]>([])

  const pageSize = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    const result = await api.expenses.list({
      category: categoryFilter || undefined,
      payment_status: paymentFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
      pageSize
    })
    if (result.success) {
      setExpenses(result.data as Expense[])
      if (result.meta) setTotal(result.meta.total)
    }
    setLoading(false)
  }, [categoryFilter, paymentFilter, dateFrom, dateTo, page, pageSize])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    const cats = [...new Set(expenses.map((e) => e.category))]
    setCategories(cats.sort())
  }, [expenses])

  const handleSave = async (data: ExpenseFormValues) => {
    if (editing) {
      await api.expenses.update(editing.id, data)
    } else {
      await api.expenses.create(data)
    }
    setFormOpen(false)
    setEditing(null)
    await fetch()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await api.expenses.delete(deleteConfirm.id)
    setDeleteConfirm(null)
    await fetch()
  }

  const paymentVariant = (s: string): 'success' | 'warning' | 'danger' => {
    switch (s) {
      case 'paid': return 'success'
      case 'partial': return 'warning'
      case 'unpaid': return 'danger'
      default: return 'danger'
    }
  }

  const columns: Column<Expense>[] = [
    {
      key: 'expense_number',
      header: 'Ref',
      render: (e) => <span className="font-mono text-xs font-medium">{e.expense_number}</span>
    },
    {
      key: 'expense_date',
      header: 'Date',
      render: (e) => <span className="text-sm">{new Date(e.expense_date).toLocaleDateString()}</span>
    },
    {
      key: 'category',
      header: 'Category',
      render: (e) => <Badge variant="info">{e.category}</Badge>
    },
    {
      key: 'description',
      header: 'Description',
      render: (e) => (
        <div>
          <p className="text-sm font-medium truncate max-w-xs">{e.description}</p>
          {e.vendor && <p className="text-xs text-surface-500">{e.vendor}</p>}
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (e) => (
        <div className="text-right">
          <p className="font-mono font-semibold">${e.amount.toFixed(2)}</p>
          {e.tax_amount > 0 && <p className="text-xs text-surface-500">+${e.tax_amount.toFixed(2)} tax</p>}
        </div>
      ),
      className: 'text-right'
    },
    {
      key: 'payment_status',
      header: 'Status',
      render: (e) => <Badge variant={paymentVariant(e.payment_status)}>{e.payment_status}</Badge>,
      className: 'text-center'
    },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setEditing(e); setFormOpen(true) }}>Edit</Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(e)}>Delete</Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }}>+ Add Expense</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Payment</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        keyExtractor={(e) => e.id}
        loading={loading}
        emptyMessage="No expenses found."
      />

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <ExpenseForm expense={editing} onSave={handleSave} onCancel={() => { setFormOpen(false); setEditing(null) }} />
      </Modal>

      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Delete Expense">
        <p className="text-surface-600 mb-6">
          Are you sure you want to delete expense <strong>{deleteConfirm?.expense_number}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
