import { contextBridge, ipcRenderer } from 'electron'

const api = {
  products: {
    list: (filters?: unknown) => ipcRenderer.invoke('products:list', filters),
    get: (id: string) => ipcRenderer.invoke('products:get', id),
    create: (input: unknown) => ipcRenderer.invoke('products:create', input),
    update: (id: string, input: unknown) => ipcRenderer.invoke('products:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('products:delete', id)
  },
  customers: {
    list: (filters?: unknown) => ipcRenderer.invoke('customers:list', filters),
    get: (id: string) => ipcRenderer.invoke('customers:get', id),
    getPurchaseHistory: (id: string, page?: number, pageSize?: number) =>
      ipcRenderer.invoke('customers:getPurchaseHistory', id, page, pageSize),
    create: (input: unknown) => ipcRenderer.invoke('customers:create', input),
    update: (id: string, input: unknown) => ipcRenderer.invoke('customers:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('customers:delete', id)
  },
  employees: {
    list: (filters?: unknown) => ipcRenderer.invoke('employees:list', filters),
    get: (id: string) => ipcRenderer.invoke('employees:get', id),
    create: (input: unknown) => ipcRenderer.invoke('employees:create', input),
    update: (id: string, input: unknown) => ipcRenderer.invoke('employees:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('employees:delete', id)
  },
  sales: {
    list: (filters?: unknown) => ipcRenderer.invoke('sales:list', filters),
    get: (id: string) => ipcRenderer.invoke('sales:get', id),
    create: (input: unknown) => ipcRenderer.invoke('sales:create', input),
    addPayment: (saleId: string, payment: unknown) => ipcRenderer.invoke('sales:addPayment', saleId, payment),
    updateStatus: (id: string, status: string) => ipcRenderer.invoke('sales:updateStatus', id, status),
    delete: (id: string) => ipcRenderer.invoke('sales:delete', id)
  },
  expenses: {
    list: (filters?: unknown) => ipcRenderer.invoke('expenses:list', filters),
    get: (id: string) => ipcRenderer.invoke('expenses:get', id),
    create: (input: unknown) => ipcRenderer.invoke('expenses:create', input),
    update: (id: string, input: unknown) => ipcRenderer.invoke('expenses:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('expenses:delete', id)
  },
  analytics: {
    dashboard: () => ipcRenderer.invoke('analytics:dashboard'),
    dailySales: (days?: number) => ipcRenderer.invoke('analytics:dailySales', days),
    weeklySales: (weeks?: number) => ipcRenderer.invoke('analytics:weeklySales', weeks),
    monthlySales: (months?: number) => ipcRenderer.invoke('analytics:monthlySales', months),
    topProducts: (limit?: number) => ipcRenderer.invoke('analytics:topProducts', limit),
    lowStock: () => ipcRenderer.invoke('analytics:lowStock'),
    expenseSummary: (months?: number) => ipcRenderer.invoke('analytics:expenseSummary', months),
    profitEstimate: (months?: number) => ipcRenderer.invoke('analytics:profitEstimate', months)
  },
  llm: {
    checkConnection: () => ipcRenderer.invoke('llm:checkConnection'),
    listModels: () => ipcRenderer.invoke('llm:listModels'),
    chat: (message: string, history?: unknown[]) => ipcRenderer.invoke('llm:chat', message, history),
    generateReport: (reportType: string) => ipcRenderer.invoke('llm:generateReport', reportType),
    predictShortages: () => ipcRenderer.invoke('llm:predictShortages'),
    getConfig: () => ipcRenderer.invoke('llm:getConfig'),
    configure: (config: { host?: string; model?: string }) => ipcRenderer.invoke('llm:configure', config)
  },
  automation: {
    backup: () => ipcRenderer.invoke('automation:backup'),
    listBackups: () => ipcRenderer.invoke('automation:listBackups'),
    schedulerState: () => ipcRenderer.invoke('automation:schedulerState'),
    runLowStockCheck: () => ipcRenderer.invoke('automation:runLowStockCheck')
  },
  pos: {
    searchProducts: (query: string) => ipcRenderer.invoke('pos:searchProducts', query),
    lookupProduct: (query: string) => ipcRenderer.invoke('pos:lookupProduct', query),
    checkout: (input: unknown) => ipcRenderer.invoke('pos:checkout', input),
    printReceipt: (result: unknown) => ipcRenderer.invoke('pos:printReceipt', result),
    getReceiptHtml: (result: unknown) => ipcRenderer.invoke('pos:getReceiptHtml', result)
  },
  update: {
    onStatus: (cb: (status: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, status: unknown) => cb(status)
      ipcRenderer.on('update:status', handler)
      return () => ipcRenderer.removeListener('update:status', handler)
    },
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    currentVersion: () => ipcRenderer.invoke('update:currentVersion')
  },
  license: {
    validate: () => ipcRenderer.invoke('license:validate'),
    activate: (payload: { key: string; licensee: string; edition?: string }) =>
      ipcRenderer.invoke('license:activate', payload),
    deactivate: () => ipcRenderer.invoke('license:deactivate'),
    generate: (payload: { licensee: string; edition?: string }) =>
      ipcRenderer.invoke('license:generate', payload),
    machineId: () => ipcRenderer.invoke('license:machineId')
  }
}

contextBridge.exposeInMainWorld('api', api)
