import { z } from 'zod'

export const customerFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Customer code is required')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Za-z0-9-]+$/, 'Code must contain only letters, numbers, and hyphens'),
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  company: z.string().max(200).optional().default(''),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).default(''),
  phone: z.string().max(30).optional().default(''),
  mobile: z.string().max(30).optional().default(''),
  address_line1: z.string().max(200).optional().default(''),
  address_line2: z.string().max(200).optional().default(''),
  city: z.string().max(100).optional().default(''),
  state: z.string().max(100).optional().default(''),
  postal_code: z.string().max(20).optional().default(''),
  country: z.string().max(100).optional().default(''),
  tax_id: z.string().max(50).optional().default(''),
  payment_terms: z.string().optional().default('net_30'),
  credit_limit: z.coerce.number().min(0, 'Credit limit cannot be negative').optional().default(0),
  notes: z.string().max(5000).optional().default('')
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

export const PAYMENT_TERMS = [
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
  { value: 'net_60', label: 'Net 60' },
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'due_on_receipt', label: 'Due on Receipt' }
] as const
