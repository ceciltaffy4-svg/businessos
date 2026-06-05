import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import type { Sale } from '../../types'

export default function SaleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const result = await api.sales.get(id)
    if (result.success) {
      setSale(result.data as Sale)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetch() }, [fetch])

  const handleStatusUpdate = async (status: string) => {
    if (!id) return
    await api.sales.updateStatus(id, status)
    await fetch()
  }

  if (loading || !sale) {
    return <div className="text-surface-500 py-12 text-center">Loading sale...</div>
  }

  const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    completed: 'success', pending: 'warning', cancelled: 'danger', refunded: 'info'
  }

  const paymentVariant: Record<string, 'success' | 'warning' | 'danger'> = {
    paid: 'success', partial: 'warning', unpaid: 'danger'
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/sales')} className="text-surface-500 hover:text-surface-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">Sale {sale.invoice_number}</h1>
        <Badge variant={statusVariant[sale.status] || 'default'}>{sale.status}</Badge>
        <Badge variant={paymentVariant[sale.payment_status] || 'danger'}>{sale.payment_status}</Badge>
        <div className="ml-auto flex gap-2">
          {sale.status === 'pending' && (
            <Button size="sm" onClick={() => handleStatusUpdate('completed')}>Mark Completed</Button>
          )}
          {sale.status !== 'cancelled' && (
            <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate('cancelled')}>Cancel Sale</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3">Sale Info</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-surface-500">Date</dt><dd>{new Date(sale.sale_date).toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-surface-500">Due Date</dt><dd>{sale.due_date ? new Date(sale.due_date).toLocaleDateString() : '\u2014'}</dd></div>
            <div className="flex justify-between"><dt className="text-surface-500">Customer</dt><dd>{sale.customer_name || '\u2014'}</dd></div>
            <div className="flex justify-between"><dt className="text-surface-500">Employee</dt><dd>{sale.employee_name || '\u2014'}</dd></div>
          </dl>
          {sale.notes && (
            <div className="mt-3 pt-3 border-t border-surface-200">
              <p className="text-xs text-surface-500 mb-1">Notes</p>
              <p className="text-sm">{sale.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3">Financial Summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-surface-500">Subtotal</dt><dd className="font-mono">${sale.subtotal.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-surface-500">Discount</dt><dd className="font-mono text-red-600">-${sale.discount_total.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-surface-500">Tax</dt><dd className="font-mono">${sale.tax_total.toFixed(2)}</dd></div>
            <div className="flex justify-between font-bold text-base border-t border-surface-200 pt-2 mt-2"><dt>Grand Total</dt><dd className="font-mono">${sale.grand_total.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-surface-500">Amount Paid</dt><dd className="font-mono text-green-600">${sale.amount_paid.toFixed(2)}</dd></div>
            <div className="flex justify-between font-semibold"><dt className="text-surface-500">Balance Due</dt><dd className={`font-mono ${sale.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>${sale.balance_due.toFixed(2)}</dd></div>
          </dl>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3">Payments</h2>
          {sale.payments.length === 0 ? (
            <p className="text-sm text-surface-400">No payments recorded</p>
          ) : (
            <div className="space-y-2">
              {sale.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-surface-50 dark:bg-surface-700">
                  <div>
                    <p className="font-medium capitalize">{p.payment_method}</p>
                    <p className="text-xs text-surface-500">{new Date(p.payment_date).toLocaleDateString()}</p>
                  </div>
                  <span className="font-mono font-semibold">${p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 shadow-sm">
        <div className="px-6 py-4 border-b border-surface-200">
          <h2 className="text-lg font-semibold">Items</h2>
        </div>
        {sale.items.length === 0 ? (
          <div className="p-6 text-center text-surface-500 text-sm">No items.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50 dark:bg-surface-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Product ID</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Discount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Tax</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {sale.items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono">{item.product_id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm font-mono text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm font-mono text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-right text-red-600">{item.discount > 0 ? `-$${item.discount.toFixed(2)}` : '\u2014'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-right">${item.tax_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-right font-semibold">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
