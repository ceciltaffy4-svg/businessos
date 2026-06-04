import { useState, useEffect, useCallback } from 'react'
import api from '../../lib/api'
import { usePosStore } from '../../stores'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import SearchInput from '../../components/ui/SearchInput'
import type { PosCheckoutResult } from '../../../preload/types'
import type { Customer } from '../../types'

interface CheckoutModalProps {
  open: boolean
  onClose: () => void
  onComplete: (result: PosCheckoutResult) => void
}

export default function CheckoutModal({ open, onClose, onComplete }: CheckoutModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items = usePosStore((s) => s.items)
  const customerId = usePosStore((s) => s.customer_id)
  const customerName = usePosStore((s) => s.customer_name)
  const setCustomer = usePosStore((s) => s.setCustomer)
  const paymentMethod = usePosStore((s) => s.paymentMethod)
  const setPaymentMethod = usePosStore((s) => s.setPaymentMethod)
  const notes = usePosStore((s) => s.notes)
  const setNotes = usePosStore((s) => s.setNotes)
  const grandTotal = usePosStore((s) => s.grandTotal())

  const fetchCustomers = useCallback(async () => {
    const result = await api.customers.list({ search: customerSearch || undefined, is_active: 1, pageSize: 20 })
    if (result.success) {
      setCustomers(result.data as Customer[])
    }
  }, [customerSearch])

  useEffect(() => {
    if (open) fetchCustomers()
  }, [open, fetchCustomers])

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        items: items.map((i) => ({
          product_id: i.product_id,
          sku: i.sku,
          name: i.name,
          unit: i.unit,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount: i.discount,
          tax_rate: i.tax_rate,
          stock_quantity: i.stock_quantity
        })),
        customer_id: customerId,
        employee_id: null,
        notes,
        payments: [{ amount: grandTotal, payment_method: paymentMethod }]
      }

      const result = await api.pos.checkout(payload)
      if (result.success) {
        onComplete(result.data as PosCheckoutResult)
      } else {
        setError(result.error?.message ?? 'Checkout failed')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-auto">
        <div className="px-6 py-4 border-b border-surface-200">
          <h2 className="text-lg font-semibold text-surface-900">Complete Sale</h2>
          <p className="text-sm text-surface-500 mt-1">Review and confirm the transaction</p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Customer (optional)</label>
            <SearchInput
              value={customerSearch}
              onChange={setCustomerSearch}
              placeholder="Search customers..."
              debounce={200}
            />
            {customers.length > 0 && (
              <div className="mt-2 max-h-40 overflow-auto border border-surface-200 rounded-lg divide-y divide-surface-100">
                {customers.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCustomer(c.id, c.name)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-50 ${
                      customerId === c.id ? 'bg-brand-50 text-brand-700' : 'text-surface-700'
                    }`}
                  >
                    {c.name} {c.company ? `— ${c.company}` : ''}
                  </button>
                ))}
              </div>
            )}
            {customerName && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="info">{customerName}</Badge>
                <button
                  onClick={() => setCustomer(null, null)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="cash">Cash</option>
              <option value="card">Credit/Debit Card</option>
              <option value="transfer">Bank Transfer</option>
              <option value="check">Check</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          {/* Order Summary */}
          <div className="bg-surface-50 rounded-lg p-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-surface-600">Items</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-600">Total</span>
              <span className="font-bold text-lg text-brand-700">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-surface-200 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={handleCheckout} disabled={loading}>
            {loading ? 'Processing...' : `Complete Sale — $${grandTotal.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
