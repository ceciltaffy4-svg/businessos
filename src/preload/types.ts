export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
  meta?: { total: number; page: number; pageSize: number }
}

export interface ProductFilters {
  search?: string
  category?: string
  is_active?: number
  low_stock?: boolean
  page?: number
  pageSize?: number
}

export interface CustomerFilters {
  search?: string
  is_active?: number
  page?: number
  pageSize?: number
}

export interface EmployeeFilters {
  search?: string
  department?: string
  is_active?: number
  page?: number
  pageSize?: number
}

export interface SaleFilters {
  customer_id?: string
  status?: string
  payment_status?: string
  date_from?: string
  date_to?: string
  page?: number
  pageSize?: number
}

export interface ExpenseFilters {
  category?: string
  payment_status?: string
  date_from?: string
  date_to?: string
  employee_id?: string
  page?: number
  pageSize?: number
}

export interface PosCartItem {
  product_id: string
  sku: string
  name: string
  unit: string
  quantity: number
  unit_price: number
  discount: number
  tax_rate: number
  stock_quantity: number
}

export interface PosPayment {
  amount: number
  payment_method: string
}

export interface PosCheckoutInput {
  items: PosCartItem[]
  customer_id?: string | null
  employee_id?: string | null
  notes?: string
  payments: PosPayment[]
}

export interface PosCheckoutResult {
  sale_id: string
  invoice_number: string
  grand_total: number
  amount_paid: number
  change_due: number
  items: Array<{ name: string; sku: string; quantity: number; unit_price: number; total: number }>
  sale_date: string
  customer_name?: string
}

export interface ElectronAPI {
  products: {
    list: (filters?: ProductFilters) => Promise<ApiResponse<unknown>>
    get: (id: string) => Promise<ApiResponse<unknown>>
    create: (input: unknown) => Promise<ApiResponse<unknown>>
    update: (id: string, input: unknown) => Promise<ApiResponse<unknown>>
    delete: (id: string) => Promise<ApiResponse<unknown>>
  }
  customers: {
    list: (filters?: CustomerFilters) => Promise<ApiResponse<unknown>>
    get: (id: string) => Promise<ApiResponse<unknown>>
    getPurchaseHistory: (id: string, page?: number, pageSize?: number) => Promise<ApiResponse<unknown>>
    create: (input: unknown) => Promise<ApiResponse<unknown>>
    update: (id: string, input: unknown) => Promise<ApiResponse<unknown>>
    delete: (id: string) => Promise<ApiResponse<unknown>>
  }
  employees: {
    list: (filters?: EmployeeFilters) => Promise<ApiResponse<unknown>>
    get: (id: string) => Promise<ApiResponse<unknown>>
    create: (input: unknown) => Promise<ApiResponse<unknown>>
    update: (id: string, input: unknown) => Promise<ApiResponse<unknown>>
    delete: (id: string) => Promise<ApiResponse<unknown>>
  }
  sales: {
    list: (filters?: SaleFilters) => Promise<ApiResponse<unknown>>
    get: (id: string) => Promise<ApiResponse<unknown>>
    create: (input: unknown) => Promise<ApiResponse<unknown>>
    addPayment: (saleId: string, payment: unknown) => Promise<ApiResponse<unknown>>
    updateStatus: (id: string, status: string) => Promise<ApiResponse<unknown>>
    delete: (id: string) => Promise<ApiResponse<unknown>>
  }
  pos: {
    searchProducts: (query: string) => Promise<ApiResponse<unknown>>
    lookupProduct: (query: string) => Promise<ApiResponse<unknown>>
    checkout: (input: PosCheckoutInput) => Promise<ApiResponse<unknown>>
    printReceipt: (result: PosCheckoutResult) => Promise<ApiResponse<unknown>>
    getReceiptHtml: (result: PosCheckoutResult) => Promise<ApiResponse<unknown>>
  }
  analytics: {
    dashboard: () => Promise<ApiResponse<unknown>>
    dailySales: (days?: number) => Promise<ApiResponse<unknown>>
    weeklySales: (weeks?: number) => Promise<ApiResponse<unknown>>
    monthlySales: (months?: number) => Promise<ApiResponse<unknown>>
    topProducts: (limit?: number) => Promise<ApiResponse<unknown>>
    lowStock: () => Promise<ApiResponse<unknown>>
    expenseSummary: (months?: number) => Promise<ApiResponse<unknown>>
    profitEstimate: (months?: number) => Promise<ApiResponse<unknown>>
  }
  automation: {
    backup: () => Promise<ApiResponse<unknown>>
    listBackups: () => Promise<ApiResponse<unknown>>
    schedulerState: () => Promise<ApiResponse<unknown>>
    runLowStockCheck: () => Promise<ApiResponse<unknown>>
  }
  llm: {
    checkConnection: () => Promise<ApiResponse<unknown>>
    listModels: () => Promise<ApiResponse<unknown>>
    chat: (message: string, history?: unknown[]) => Promise<ApiResponse<unknown>>
    generateReport: (reportType: string) => Promise<ApiResponse<unknown>>
    predictShortages: () => Promise<ApiResponse<unknown>>
    getConfig: () => Promise<ApiResponse<unknown>>
    configure: (config: { host?: string; model?: string }) => Promise<ApiResponse<unknown>>
  }
  expenses: {
    list: (filters?: ExpenseFilters) => Promise<ApiResponse<unknown>>
    get: (id: string) => Promise<ApiResponse<unknown>>
    create: (input: unknown) => Promise<ApiResponse<unknown>>
    update: (id: string, input: unknown) => Promise<ApiResponse<unknown>>
    delete: (id: string) => Promise<ApiResponse<unknown>>
  }
  update: {
    onStatus: (cb: (status: unknown) => void) => () => void
    check: () => Promise<ApiResponse<unknown>>
    download: () => Promise<ApiResponse<unknown>>
    install: () => Promise<ApiResponse<unknown>>
    currentVersion: () => Promise<ApiResponse<unknown>>
  }
  license: {
    validate: () => Promise<ApiResponse<unknown>>
    activate: (payload: { key: string; licensee: string; edition?: string }) => Promise<ApiResponse<unknown>>
    deactivate: () => Promise<ApiResponse<unknown>>
    generate: (payload: { licensee: string; edition?: string }) => Promise<ApiResponse<unknown>>
    machineId: () => Promise<ApiResponse<unknown>>
  }
}
