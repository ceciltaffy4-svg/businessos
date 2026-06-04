import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import { customerFormSchema, PAYMENT_TERMS, type CustomerFormValues } from './customer.schema'
import type { Customer } from '../../types'

interface CustomerFormProps {
  customer?: Customer | null
  onSave: (data: CustomerFormValues) => Promise<void>
  onCancel: () => void
}

const emptyForm: CustomerFormValues = {
  code: '',
  name: '',
  company: '',
  email: '',
  phone: '',
  mobile: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  tax_id: '',
  payment_terms: 'net_30',
  credit_limit: 0,
  notes: ''
}

export default function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [form, setForm] = useState<CustomerFormValues>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormValues, string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (customer) {
      setForm({
        code: customer.code,
        name: customer.name,
        company: customer.company ?? '',
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        mobile: customer.mobile ?? '',
        address_line1: customer.address_line1 ?? '',
        address_line2: customer.address_line2 ?? '',
        city: customer.city ?? '',
        state: customer.state ?? '',
        postal_code: customer.postal_code ?? '',
        country: customer.country ?? '',
        tax_id: customer.tax_id ?? '',
        payment_terms: customer.payment_terms,
        credit_limit: customer.credit_limit,
        notes: customer.notes ?? ''
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
  }, [customer])

  const handleChange = (field: keyof CustomerFormValues, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = customerFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CustomerFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CustomerFormValues
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

  const inputClass = (field: keyof CustomerFormValues) =>
    `w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
      errors[field] ? 'border-red-400 focus:ring-red-500' : 'border-surface-300'
    }`

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Code *</label>
          <input type="text" value={form.code} onChange={(e) => handleChange('code', e.target.value)} className={inputClass('code')} placeholder="e.g. C004" />
          {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
          <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass('name')} placeholder="Full name or business name" />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-surface-700 mb-1">Company</label>
          <input type="text" value={form.company} onChange={(e) => handleChange('company', e.target.value)} className={inputClass('company')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className={inputClass('email')} placeholder="email@example.com" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Phone</label>
          <input type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className={inputClass('phone')} placeholder="+1-555-0100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Mobile</label>
          <input type="text" value={form.mobile} onChange={(e) => handleChange('mobile', e.target.value)} className={inputClass('mobile')} />
        </div>
      </div>

      <div className="border-t border-surface-200 pt-4">
        <h3 className="text-sm font-semibold text-surface-700 mb-3">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-surface-700 mb-1">Address Line 1</label>
            <input type="text" value={form.address_line1} onChange={(e) => handleChange('address_line1', e.target.value)} className={inputClass('address_line1')} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-surface-700 mb-1">Address Line 2</label>
            <input type="text" value={form.address_line2} onChange={(e) => handleChange('address_line2', e.target.value)} className={inputClass('address_line2')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">City</label>
            <input type="text" value={form.city} onChange={(e) => handleChange('city', e.target.value)} className={inputClass('city')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">State</label>
            <input type="text" value={form.state} onChange={(e) => handleChange('state', e.target.value)} className={inputClass('state')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Postal Code</label>
            <input type="text" value={form.postal_code} onChange={(e) => handleChange('postal_code', e.target.value)} className={inputClass('postal_code')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Country</label>
            <input type="text" value={form.country} onChange={(e) => handleChange('country', e.target.value)} className={inputClass('country')} />
          </div>
        </div>
      </div>

      <div className="border-t border-surface-200 pt-4">
        <h3 className="text-sm font-semibold text-surface-700 mb-3">Business Terms</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Tax ID</label>
            <input type="text" value={form.tax_id} onChange={(e) => handleChange('tax_id', e.target.value)} className={inputClass('tax_id')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Payment Terms</label>
            <select value={form.payment_terms} onChange={(e) => handleChange('payment_terms', e.target.value)} className={inputClass('payment_terms')}>
              {PAYMENT_TERMS.map((pt) => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Credit Limit ($)</label>
            <input type="number" min="0" step="100" value={form.credit_limit} onChange={(e) => handleChange('credit_limit', parseFloat(e.target.value) || 0)} className={inputClass('credit_limit')} />
            {errors.credit_limit && <p className="mt-1 text-xs text-red-600">{errors.credit_limit}</p>}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1">Notes</label>
        <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} className={inputClass('notes')} rows={3} placeholder="Optional notes about this customer..." />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
        </Button>
      </div>
    </form>
  )
}
