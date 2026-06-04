import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { customerRepo, type CustomerFilters } from '../database/repositories'

const phoneRegex = /^[\d\s\-+()]*$/

const createCustomerSchema = z.object({
  code: z.string().min(1, 'Customer code is required').max(50),
  name: z.string().min(1, 'Name is required').max(200),
  company: z.string().max(200).optional().default(''),
  email: z.string().email('Invalid email').optional().or(z.literal('')).default(''),
  phone: z.string().regex(phoneRegex, 'Invalid phone format').max(30).optional().default(''),
  mobile: z.string().regex(phoneRegex, 'Invalid phone format').max(30).optional().default(''),
  address_line1: z.string().max(200).optional().default(''),
  address_line2: z.string().max(200).optional().default(''),
  city: z.string().max(100).optional().default(''),
  state: z.string().max(100).optional().default(''),
  postal_code: z.string().max(20).optional().default(''),
  country: z.string().max(100).optional().default(''),
  tax_id: z.string().max(50).optional().default(''),
  payment_terms: z.string().optional().default('net_30'),
  credit_limit: z.number().min(0, 'Credit limit cannot be negative').optional().default(0),
  notes: z.string().max(5000).optional().default('')
})

const updateCustomerSchema = createCustomerSchema.partial()

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>

export const customerService = {
  list(filters: CustomerFilters) {
    return customerRepo.findAllWithBalances(filters)
  },

  get(id: string) {
    const customer = customerRepo.findById(id)
    if (!customer) throw new Error('Customer not found')
    const stats = customerRepo.getStats(id)
    return { ...customer, stats }
  },

  getPurchaseHistory(customerId: string, page?: number, pageSize?: number) {
    const customer = customerRepo.findById(customerId)
    if (!customer) throw new Error('Customer not found')
    return customerRepo.getPurchaseHistory(customerId, page, pageSize)
  },

  create(input: CreateCustomerInput) {
    const data = createCustomerSchema.parse(input)
    const existing = customerRepo.findByCode(data.code)
    if (existing) throw new Error(`Customer with code "${data.code}" already exists`)
    return customerRepo.create({ id: uuid(), ...data, is_active: 1 })
  },

  update(id: string, input: UpdateCustomerInput) {
    const data = updateCustomerSchema.parse(input)
    if (data.code) {
      const existing = customerRepo.findByCode(data.code)
      if (existing && existing.id !== id) {
        throw new Error(`Customer with code "${data.code}" already exists`)
      }
    }
    const updated = customerRepo.update(id, data)
    if (!updated) throw new Error('Customer not found')
    return updated
  },

  delete(id: string) {
    customerRepo.delete(id)
  }
}
