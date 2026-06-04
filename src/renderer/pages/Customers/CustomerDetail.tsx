import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import CustomerForm from './CustomerForm'
import { type CustomerFormValues } from './customer.schema'
import type { Customer } from '../../types'

interface CustomerWithStats extends Customer {
  stats: {
    total_orders: number
    total_spent: number
    outstanding_balance: number
    last_purchase_date: string | null
  }
}

interface PurchaseRow {
  id: string
  invoice_number: string
  sale_date: string
  grand_total: number
  amount_paid: number
  balance_due: number
  status: string
  payment_status: string
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<CustomerWithStats | null>(null)
  const [purchases, setPurchases] = useState<PurchaseRow[]>([])
  const [purchaseTotal, setPurchaseTotal] = useState(0)
  const [purchasePage, setPurchasePage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const pageSize = 10

  const fetchCustomer = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const result = await api.customers.get(id)
    if (result.success) {
      setCustomer(result.data as CustomerWithStats)
    }
    setLoading(false)
  }, [id])

  const fetchHistory = useCallback(async () => {
    if (!id) return
    const result = await api.customers.getPurchaseHistory(id, purchasePage, pageSize)
    if (result.success) {
      setPurchases(result.data as PurchaseRow[])
      if (result.meta) setPurchaseTotal(result.meta.total)
    }
  }, [id, purchasePage])

  useEffect(() => { fetchCustomer() }, [fetchCustomer])
  useEffect(() => { fetchHistory() }, [fetchHistory])

  const handleSave = async (data: CustomerFormValues) => {
    if (!id) return
    await api.customers.update(id, data)
    setFormOpen(false)
    await fetchCustomer()
  }

  if (loading || !customer) {
    return <div className="text-surface-500 py-12 text-center">Loading customer...</div>
  }

  const statusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'danger'
      case 'refunded': return 'info'
      default: return 'default'
    }
  }

  const paymentVariant = (status: string): 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'paid': return 'success'
      case 'partial': return 'warning'
      case 'unpaid': return 'danger'
      default: return 'danger'
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/customers')} className="text-surface-500 hover:text-surface-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-surface-900">{customer.name}</h1>
        <Badge variant={customer.is_active ? 'success' : 'default'}>
          {customer.is_active ? 'Active' : 'Inactive'}
        </Badge>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setFormOpen(true)}>Edit</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-surface-200 shadow-sm">
          <p className="text-xs text-surface-500 uppercase tracking-wider">Total Orders</p>
          <p className="text-2xl font-bold mt-1">{customer.stats.total_orders}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-surface-200 shadow-sm">
          <p className="text-xs text-surface-500 uppercase tracking-wider">Total Spent</p>
          <p className="text-2xl font-bold mt-1">${customer.stats.total_spent.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-surface-200 shadow-sm">
          <p className="text-xs text-surface-500 uppercase tracking-wider">Outstanding</p>
          <p className={`text-2xl font-bold mt-1 ${customer.stats.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ${customer.stats.outstanding_balance.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-surface-200 shadow-sm">
          <p className="text-xs text-surface-500 uppercase tracking-wider">Last Purchase</p>
          <p className="text-lg font-semibold mt-1">
            {customer.stats.last_purchase_date
              ? new Date(customer.stats.last_purchase_date).toLocaleDateString()
              : 'Never'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Customer Info */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-surface-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-surface-500">Code</span><p className="font-mono font-medium">{customer.code}</p></div>
            <div><span className="text-surface-500">Company</span><p>{customer.company || '—'}</p></div>
            <div><span className="text-surface-500">Email</span><p>{customer.email || '—'}</p></div>
            <div><span className="text-surface-500">Phone</span><p>{customer.phone || '—'}</p></div>
            <div><span className="text-surface-500">Mobile</span><p>{customer.mobile || '—'}</p></div>
            <div><span className="text-surface-500">Tax ID</span><p>{customer.tax_id || '—'}</p></div>
          </div>
          <div className="mt-4 text-sm">
            <span className="text-surface-500">Address</span>
            <p className="mt-1">
              {[customer.address_line1, customer.address_line2, customer.city, customer.state, customer.postal_code, customer.country]
                .filter(Boolean)
                .join(', ') || '—'}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-surface-200 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-surface-500">Payment Terms</span><p className="font-medium">{customer.payment_terms.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</p></div>
            <div><span className="text-surface-500">Credit Limit</span><p className="font-medium">${customer.credit_limit.toFixed(2)}</p></div>
            <div><span className="text-surface-500">Created</span><p>{new Date(customer.created_at).toLocaleDateString()}</p></div>
            <div><span className="text-surface-500">Updated</span><p>{new Date(customer.updated_at).toLocaleDateString()}</p></div>
          </div>
          {customer.notes && (
            <div className="mt-4 pt-4 border-t border-surface-200">
              <span className="text-sm text-surface-500">Notes</span>
              <p className="mt-1 text-sm whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Right sidebar: quick actions */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button className="w-full justify-start" variant="secondary" onClick={() => navigate('/pos')}>
              Create Sale
            </Button>
            <Button className="w-full justify-start" variant="secondary" onClick={() => setFormOpen(true)}>
              Edit Customer
            </Button>
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-surface-700 mb-2">Terms</h3>
            <p className="text-xs text-surface-500">
              {customer.payment_terms === 'cod'
                ? 'This customer pays on delivery.'
                : `Payment is due within ${customer.payment_terms.replace('net_', '')} days.`}
            </p>
          </div>
        </div>
      </div>

      {/* Purchase History */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm">
        <div className="px-6 py-4 border-b border-surface-200">
          <h2 className="text-lg font-semibold text-surface-900">Purchase History</h2>
        </div>
        {purchases.length === 0 ? (
          <div className="p-6 text-center text-surface-500 text-sm">No purchases yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Balance</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {purchases.map((sale) => (
                  <tr key={sale.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{sale.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-surface-600">{new Date(sale.sale_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-mono text-right">${sale.grand_total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-right">${sale.amount_paid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-right font-semibold">{sale.balance_due > 0 ? `$${sale.balance_due.toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3 text-center"><Badge variant={statusVariant(sale.status)}>{sale.status}</Badge></td>
                    <td className="px-4 py-3 text-center"><Badge variant={paymentVariant(sale.payment_status)}>{sale.payment_status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 py-3">
          <Pagination page={purchasePage} pageSize={pageSize} total={purchaseTotal} onPageChange={setPurchasePage} />
        </div>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Edit Customer">
        <CustomerForm customer={customer} onSave={handleSave} onCancel={() => setFormOpen(false)} />
      </Modal>
    </div>
  )
}
