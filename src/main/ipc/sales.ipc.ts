import { ipcMain } from 'electron'
import { saleService } from '../services'

export function registerSaleIpc(): void {
  ipcMain.handle('sales:list', (_event, filters) => {
    try {
      const result = saleService.list(filters)
      return { success: true, data: result.data, meta: { total: result.total, page: result.page, pageSize: result.pageSize } }
    } catch (error) {
      return { success: false, error: { code: 'SALES_LIST_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('sales:get', (_event, id: string) => {
    try {
      const sale = saleService.get(id)
      return { success: true, data: sale }
    } catch (error) {
      return { success: false, error: { code: 'SALE_NOT_FOUND', message: (error as Error).message } }
    }
  })

  ipcMain.handle('sales:create', (_event, input) => {
    try {
      const sale = saleService.create(input)
      return { success: true, data: sale }
    } catch (error) {
      return { success: false, error: { code: 'SALE_CREATE_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('sales:addPayment', (_event, saleId: string, payment) => {
    try {
      const result = saleService.addPayment(saleId, payment)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: { code: 'SALE_PAYMENT_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('sales:updateStatus', (_event, id: string, status: string) => {
    try {
      saleService.updateStatus(id, status)
      return { success: true }
    } catch (error) {
      return { success: false, error: { code: 'SALE_UPDATE_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('sales:delete', (_event, id: string) => {
    try {
      saleService.delete(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: { code: 'SALE_DELETE_ERROR', message: (error as Error).message } }
    }
  })
}
