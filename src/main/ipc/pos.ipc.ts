import { ipcMain, BrowserWindow } from 'electron'
import { posService } from '../services/pos.service'
import { generateReceiptHtml } from '../services/receipt.service'

export function registerPosIpc(): void {
  ipcMain.handle('pos:searchProducts', (_event, query: string) => {
    try {
      const products = posService.searchProducts(query)
      return { success: true, data: products }
    } catch (error) {
      return { success: false, error: { code: 'POS_SEARCH_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('pos:lookupProduct', (_event, query: string) => {
    try {
      const product = posService.lookupProduct(query)
      if (!product) {
        return { success: true, data: null }
      }
      return { success: true, data: product }
    } catch (error) {
      return { success: false, error: { code: 'POS_LOOKUP_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('pos:checkout', (_event, input) => {
    try {
      const result = posService.checkout(input)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: { code: 'POS_CHECKOUT_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('pos:printReceipt', async (_event, checkoutResult) => {
    try {
      const html = generateReceiptHtml(checkoutResult)
      const win = new BrowserWindow({
        width: 380,
        height: 600,
        show: true,
        title: `Receipt ${checkoutResult.invoice_number}`,
        webPreferences: { contextIsolation: true, nodeIntegration: false }
      })
      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      return { success: true }
    } catch (error) {
      return { success: false, error: { code: 'POS_PRINT_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('pos:getReceiptHtml', (_event, checkoutResult) => {
    try {
      const html = generateReceiptHtml(checkoutResult)
      return { success: true, data: html }
    } catch (error) {
      return { success: false, error: { code: 'POS_RECEIPT_ERROR', message: (error as Error).message } }
    }
  })
}
