import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import DataTable, { type Column } from '../../components/ui/DataTable'
import SearchInput from '../../components/ui/SearchInput'
import Pagination from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import CustomerForm from './CustomerForm'
import { type CustomerFormValues } from './customer.schema'
import type { Customer } from '../../types'

interface CustomerWithBalance extends Customer {
  outstanding_balance: number
}

export default function CustomerList() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null)

  const pageSize = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    const result = await api.customers.list({ search: search || undefined, is_active: 1, page, pageSize })
    if (result.success) {
      setCustomers(result.data as CustomerWithBalance[])
      if (result.meta) setTotal(result.meta.total)
    }
    setLoading(false)
  }, [search, page, pageSize])

  useEffect(() => { fetch() }, [fetch])

  const handleSave = async (data: CustomerFormValues) => {
    if (editing) {
      await api.customers.update(editing.id, data)
    } else {
      await api.customers.create(data)
    }
    setFormOpen(false)
    setEditing(null)
    await fetch()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await api.customers.delete(deleteConfirm.id)
    setDeleteConfirm(null)
    await fetch()
  }

  const balanceVariant = (balance: number): 'success' | 'warning' | 'danger' => {
    if (balance === 0) return 'success'
    if (balance < 1000) return 'warning'
    return 'danger'
  }

  const columns: Column<CustomerWithBalance>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (c) => <span className="font-mono text-xs font-medium">{c.code}</span>
    },
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <button
          onClick={() => navigate(`/customers/${c.id}`)}
          className="font-medium text-brand-700 hover:text-brand-800 hover:underline text-left"
        >
          {c.name}
        </button>
      )
    },
    {
      key: 'company',
      header: 'Company',
      render: (c) => <span className="text-surface-500">{c.company || '—'}</span>
    },
    {
      key: 'email',
      header: 'Email',
      render: (c) => <span className="text-surface-500">{c.email || '—'}</span>
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (c) => <span className="text-surface-500">{c.phone || '—'}</span>
    },
    {
      key: 'outstanding_balance',
      header: 'Balance',
      render: (c) => (
        <Badge variant={balanceVariant(c.outstanding_balance)}>
          ${c.outstanding_balance.toFixed(2)}
        </Badge>
      ),
      className: 'text-right'
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/customers/${c.id}`)}>View</Button>
          <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setFormOpen(true) }}>Edit</Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(c)}>Delete</Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Customers</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }}>+ Add Customer</Button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-80">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search by name, code, company, email, or phone..."
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        keyExtractor={(c) => c.id}
        loading={loading}
        emptyMessage="No customers found. Add your first customer to get started."
      />

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <CustomerForm customer={editing} onSave={handleSave} onCancel={() => { setFormOpen(false); setEditing(null) }} />
      </Modal>

      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Delete Customer">
        <p className="text-surface-600 mb-6">
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This will archive the customer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
