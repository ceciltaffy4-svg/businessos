import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { employeeRepo, type EmployeeFilters } from '../database/repositories'

const createEmployeeSchema = z.object({
  employee_code: z.string().min(1, 'Employee code is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')).default(''),
  phone: z.string().optional().default(''),
  position: z.string().min(1, 'Position is required'),
  department: z.string().min(1, 'Department is required'),
  hire_date: z.string().optional().default(''),
  termination_date: z.string().optional().default(''),
  employment_type: z.string().optional().default('full_time'),
  salary: z.number().min(0).optional().default(0),
  pay_frequency: z.string().optional().default('monthly'),
  tax_id: z.string().optional().default(''),
  address: z.string().optional().default(''),
  emergency_contact: z.string().optional().default('')
})

const updateEmployeeSchema = createEmployeeSchema.partial()

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>

export const employeeService = {
  list(filters: EmployeeFilters) {
    return employeeRepo.findAll(filters)
  },

  get(id: string) {
    const employee = employeeRepo.findById(id)
    if (!employee) throw new Error('Employee not found')
    return employee
  },

  create(input: CreateEmployeeInput) {
    const data = createEmployeeSchema.parse(input)
    return employeeRepo.create({ id: uuid(), ...data, is_active: 1 })
  },

  update(id: string, input: UpdateEmployeeInput) {
    const data = updateEmployeeSchema.parse(input)
    const updated = employeeRepo.update(id, data)
    if (!updated) throw new Error('Employee not found')
    return updated
  },

  delete(id: string) {
    employeeRepo.delete(id)
  }
}
