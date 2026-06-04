import { z } from 'zod'
import { saleRepo, type SaleFilters } from '../database/repositories'

const createSaleItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  unit_price: z.number().min(0),
  discount: z.number().min(0).optional().default(0),
  tax_rate: z.number().min(0).optional().default(0),
  tax_amount: z.number().min(0).optional().default(0)
})

const createSalePaymentSchema = z.object({
  amount: z.number().min(0.01, 'Payment amount must be positive'),
  payment_date: z.string().optional(),
  payment_method: z.string().optional().default(''),
  reference: z.string().optional().default('')
})

const createSaleSchema = z.object({
  customer_id: z.string().uuid(),
  employee_id: z.string().uuid().optional(),
  sale_date: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional().default(''),
  items: z.array(createSaleItemSchema).min(1, 'At least one item is required'),
  payments: z.array(createSalePaymentSchema).optional()
})

export type CreateSaleInput = z.infer<typeof createSaleSchema>

export const saleService = {
  list(filters: SaleFilters) {
    return saleRepo.findAll(filters)
  },

  get(id: string) {
    const sale = saleRepo.findById(id)
    if (!sale) throw new Error('Sale not found')
    return sale
  },

  create(input: CreateSaleInput) {
    const data = createSaleSchema.parse(input)
    return saleRepo.create(data)
  },

  addPayment(saleId: string, payment: z.infer<typeof createSalePaymentSchema>) {
    const data = createSalePaymentSchema.parse(payment)
    const sale = saleRepo.findById(saleId)
    if (!sale) throw new Error('Sale not found')
    return saleRepo.addPayment({
      id: '',
      sale_id: saleId,
      amount: data.amount,
      payment_date: data.payment_date ?? new Date().toISOString(),
      payment_method: data.payment_method,
      reference: data.reference,
      notes: ''
    })
  },

  updateStatus(id: string, status: string) {
    const validStatuses = ['pending', 'completed', 'cancelled', 'refunded']
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }
    saleRepo.updateStatus(id, status)
  },

  delete(id: string) {
    saleRepo.delete(id)
  }
}
