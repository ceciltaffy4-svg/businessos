import { ipcMain } from 'electron'
import { customerService } from '../services'

export function registerCustomerIpc(): void {
  ipcMain.handle('customers:list', (_event, filters) => {
    try {
      const result = customerService.list(filters)
      return { success: true, data: result.data, meta: { total: result.total, page: result.page, pageSize: result.pageSize } }
    } catch (error) {
      return { success: false, error: { code: 'CUSTOMERS_LIST_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('customers:get', (_event, id: string) => {
    try {
      const customer = customerService.get(id)
      return { success: true, data: customer }
    } catch (error) {
      return { success: false, error: { code: 'CUSTOMER_NOT_FOUND', message: (error as Error).message } }
    }
  })

  ipcMain.handle('customers:getPurchaseHistory', (_event, id: string, page?: number, pageSize?: number) => {
    try {
      const result = customerService.getPurchaseHistory(id, page, pageSize)
      return { success: true, data: result.data, meta: { total: result.total, page: result.page, pageSize: result.pageSize } }
    } catch (error) {
      return { success: false, error: { code: 'CUSTOMER_HISTORY_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('customers:create', (_event, input) => {
    try {
      const customer = customerService.create(input)
      return { success: true, data: customer }
    } catch (error) {
      return { success: false, error: { code: 'CUSTOMER_CREATE_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('customers:update', (_event, id: string, input) => {
    try {
      const customer = customerService.update(id, input)
      return { success: true, data: customer }
    } catch (error) {
      return { success: false, error: { code: 'CUSTOMER_UPDATE_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('customers:delete', (_event, id: string) => {
    try {
      customerService.delete(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: { code: 'CUSTOMER_DELETE_ERROR', message: (error as Error).message } }
    }
  })
}
