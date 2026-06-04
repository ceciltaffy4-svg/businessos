import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { productRepo, type ProductFilters } from '../database/repositories'

const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  category: z.string().optional().default('general'),
  unit: z.string().optional().default('pc'),
  cost_price: z.number().min(0).optional().default(0),
  selling_price: z.number().min(0).optional().default(0),
  tax_rate: z.number().min(0).optional().default(0),
  stock_quantity: z.number().min(0).optional().default(0),
  min_stock_level: z.number().min(0).optional().default(0),
  barcode: z.string().optional().default(''),
  notes: z.string().optional().default('')
})

const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>

export const productService = {
  list(filters: ProductFilters) {
    return productRepo.findAll(filters)
  },

  get(id: string) {
    const product = productRepo.findById(id)
    if (!product) throw new Error('Product not found')
    return product
  },

  create(input: CreateProductInput) {
    const data = createProductSchema.parse(input)
    const existing = productRepo.findBySku(data.sku)
    if (existing) throw new Error(`Product with SKU "${data.sku}" already exists`)
    return productRepo.create({ id: uuid(), ...data, is_active: 1 })
  },

  update(id: string, input: UpdateProductInput) {
    const data = updateProductSchema.parse(input)
    if (data.sku) {
      const existing = productRepo.findBySku(data.sku)
      if (existing && existing.id !== id) {
        throw new Error(`Product with SKU "${data.sku}" already exists`)
      }
    }
    const updated = productRepo.update(id, data)
    if (!updated) throw new Error('Product not found')
    return updated
  },

  delete(id: string) {
    productRepo.delete(id)
  }
}
