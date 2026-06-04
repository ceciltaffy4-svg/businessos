import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import { productFormSchema, CATEGORIES, UNITS, type ProductFormValues } from './product.schema'
import type { Product } from '../../types'

interface ProductFormProps {
  product?: Product | null
  onSave: (data: ProductFormValues) => Promise<void>
  onCancel: () => void
}

const emptyForm: ProductFormValues = {
  sku: '',
  name: '',
  description: '',
  category: 'general',
  unit: 'pc',
  cost_price: 0,
  selling_price: 0,
  tax_rate: 0,
  stock_quantity: 0,
  min_stock_level: 0,
  barcode: '',
  notes: ''
}

export default function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormValues>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setForm({
        sku: product.sku,
        name: product.name,
        description: product.description ?? '',
        category: product.category,
        unit: product.unit,
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        tax_rate: product.tax_rate,
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level,
        barcode: product.barcode ?? '',
        notes: product.notes ?? ''
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
  }, [product])

  const handleChange = (field: keyof ProductFormValues, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = productFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ProductFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProductFormValues
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

  const inputClass = (field: keyof ProductFormValues) =>
    `w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
      errors[field]
        ? 'border-red-400 focus:ring-red-500'
        : 'border-surface-300'
    }`

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">SKU *</label>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => handleChange('sku', e.target.value)}
            className={inputClass('sku')}
            placeholder="e.g. LAP-HP-PRO"
          />
          {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={inputClass('name')}
            placeholder="Product name"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className={inputClass('description')}
            rows={3}
            placeholder="Optional description"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Category *</label>
          <select
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className={inputClass('category')}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Unit *</label>
          <select
            value={form.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            className={inputClass('unit')}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Cost Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.cost_price}
            onChange={(e) => handleChange('cost_price', parseFloat(e.target.value) || 0)}
            className={inputClass('cost_price')}
          />
          {errors.cost_price && <p className="mt-1 text-xs text-red-600">{errors.cost_price}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Selling Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.selling_price}
            onChange={(e) => handleChange('selling_price', parseFloat(e.target.value) || 0)}
            className={inputClass('selling_price')}
          />
          {errors.selling_price && <p className="mt-1 text-xs text-red-600">{errors.selling_price}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Tax Rate (%)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.tax_rate}
            onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) || 0)}
            className={inputClass('tax_rate')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Barcode</label>
          <input
            type="text"
            value={form.barcode}
            onChange={(e) => handleChange('barcode', e.target.value)}
            className={inputClass('barcode')}
            placeholder="EAN-13 / UPC"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Stock Quantity</label>
          <input
            type="number"
            step="1"
            min="0"
            value={form.stock_quantity}
            onChange={(e) => handleChange('stock_quantity', parseFloat(e.target.value) || 0)}
            className={inputClass('stock_quantity')}
          />
          {errors.stock_quantity && <p className="mt-1 text-xs text-red-600">{errors.stock_quantity}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Min Stock Level</label>
          <input
            type="number"
            step="1"
            min="0"
            value={form.min_stock_level}
            onChange={(e) => handleChange('min_stock_level', parseFloat(e.target.value) || 0)}
            className={inputClass('min_stock_level')}
          />
          {errors.min_stock_level && <p className="mt-1 text-xs text-red-600">{errors.min_stock_level}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-surface-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className={inputClass('notes')}
            rows={2}
            placeholder="Optional notes"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}
