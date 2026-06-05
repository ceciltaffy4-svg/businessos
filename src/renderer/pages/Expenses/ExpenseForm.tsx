import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import { expenseFormSchema, EXPENSE_CATEGORIES, type ExpenseFormValues } from './expense.schema'
import type { Expense } from '../../types'

interface ExpenseFormProps {
  expense?: Expense | null
  onSave: (data: ExpenseFormValues) => Promise<void>
  onCancel: () => void
}

const emptyForm: ExpenseFormValues = {
  category: '',
  description: '',
  amount: 0,
  tax_amount: 0,
  expense_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  vendor: '',
  payment_method: '',
  payment_status: 'unpaid',
  notes: ''
}

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'credit_card', 'debit_card', 'check']
const PAYMENT_STATUSES = ['paid', 'unpaid']

export default function ExpenseForm({ expense, onSave, onCancel }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormValues>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormValues, string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (expense) {
      setForm({
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        tax_amount: expense.tax_amount,
        expense_date: expense.expense_date.slice(0, 10),
        due_date: expense.due_date ? expense.due_date.slice(0, 10) : '',
        vendor: expense.vendor || '',
        payment_method: expense.payment_method || '',
        payment_status: expense.payment_status,
        notes: expense.notes || ''
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
  }, [expense])

  const handleChange = (field: keyof ExpenseFormValues, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = expenseFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ExpenseFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ExpenseFormValues
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setSaving(true)
    try {
      await onSave(result.data)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = (field: keyof ExpenseFormValues) =>
    `w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
      errors[field] ? 'border-red-400 focus:ring-red-500' : 'border-surface-300'
    }`

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Category *</label>
          <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className={inputClass('category')}>
            <option value="">Select category...</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Expense Date *</label>
          <input type="date" value={form.expense_date} onChange={(e) => handleChange('expense_date', e.target.value)} className={inputClass('expense_date')} />
          {errors.expense_date && <p className="mt-1 text-xs text-red-600">{errors.expense_date}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-surface-700 mb-1">Description *</label>
          <input type="text" value={form.description} onChange={(e) => handleChange('description', e.target.value)} className={inputClass('description')} placeholder="What was this expense for?" />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Amount *</label>
          <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)} className={inputClass('amount')} />
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Tax Amount</label>
          <input type="number" min="0" step="0.01" value={form.tax_amount} onChange={(e) => handleChange('tax_amount', parseFloat(e.target.value) || 0)} className={inputClass('tax_amount')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Vendor</label>
          <input type="text" value={form.vendor} onChange={(e) => handleChange('vendor', e.target.value)} className={inputClass('vendor')} placeholder="Vendor or supplier" />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Due Date</label>
          <input type="date" value={form.due_date} onChange={(e) => handleChange('due_date', e.target.value)} className={inputClass('due_date')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Payment Method</label>
          <select value={form.payment_method} onChange={(e) => handleChange('payment_method', e.target.value)} className={inputClass('payment_method')}>
            <option value="">Select...</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Payment Status</label>
          <select value={form.payment_status} onChange={(e) => handleChange('payment_status', e.target.value)} className={inputClass('payment_status')}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-surface-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} className={inputClass('notes')} rows={2} placeholder="Optional notes..." />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving...' : expense ? 'Update Expense' : 'Create Expense'}
        </Button>
      </div>
    </form>
  )
}
