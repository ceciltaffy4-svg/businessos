import { z } from 'zod'

export const productFormSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be 50 characters or less')
    .regex(/^[A-Za-z0-9-]+$/, 'SKU must contain only letters, numbers, and hyphens'),
  name: z.string().min(1, 'Product name is required').max(200, 'Name must be 200 characters or less'),
  description: z.string().max(2000).optional().default(''),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  cost_price: z.coerce.number().min(0, 'Cost price cannot be negative'),
  selling_price: z.coerce.number().min(0, 'Selling price cannot be negative'),
  tax_rate: z.coerce.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%'),
  stock_quantity: z.coerce.number().min(0, 'Stock quantity cannot be negative'),
  min_stock_level: z.coerce.number().min(0, 'Min stock level cannot be negative'),
  barcode: z.string().max(50).optional().default(''),
  notes: z.string().max(2000).optional().default('')
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const CATEGORIES = [
  'general',
  'electronics',
  'furniture',
  'accessories',
  'networking',
  'software',
  'services',
  'raw_material',
  'packaging',
  'other'
] as const

export const UNITS = ['pc', 'kg', 'g', 'm', 'cm', 'liter', 'ml', 'hour', 'day', 'month', 'license'] as const
