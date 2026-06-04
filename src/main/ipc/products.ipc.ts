import { ipcMain } from 'electron'
import { productService } from '../services'

export function registerProductIpc(): void {
  ipcMain.handle('products:list', (_event, filters) => {
    try {
      const result = productService.list(filters)
      return { success: true, data: result.data, meta: { total: result.total, page: result.page, pageSize: result.pageSize } }
    } catch (error) {
      return { success: false, error: { code: 'PRODUCTS_LIST_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('products:get', (_event, id: string) => {
    try {
      const product = productService.get(id)
      return { success: true, data: product }
    } catch (error) {
      return { success: false, error: { code: 'PRODUCT_NOT_FOUND', message: (error as Error).message } }
    }
  })

  ipcMain.handle('products:create', (_event, input) => {
    try {
      const product = productService.create(input)
      return { success: true, data: product }
    } catch (error) {
      return { success: false, error: { code: 'PRODUCT_CREATE_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('products:update', (_event, id: string, input) => {
    try {
      const product = productService.update(id, input)
      return { success: true, data: product }
    } catch (error) {
      return { success: false, error: { code: 'PRODUCT_UPDATE_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('products:delete', (_event, id: string) => {
    try {
      productService.delete(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: { code: 'PRODUCT_DELETE_ERROR', message: (error as Error).message } }
    }
  })
}
