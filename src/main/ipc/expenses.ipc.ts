import { ipcMain } from 'electron'
import { expenseService } from '../services'

export function registerExpenseIpc(): void {
  ipcMain.handle('expenses:list', (_event, filters) => {
    try {
      const result = expenseService.list(filters)
      return { success: true, data: result.data, meta: { total: result.total, page: result.page, pageSize: result.pageSize } }
    } catch (error) {
      return { success: false, error: { code: 'EXPENSES_LIST_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('expenses:get', (_event, id: string) => {
    try {
      const expense = expenseService.get(id)
      return { success: true, data: expense }
    } catch (error) {
      return { success: false, error: { code: 'EXPENSE_NOT_FOUND', message: (error as Error).message } }
    }
  })

  ipcMain.handle('expenses:create', (_event, input) => {
    try {
      const expense = expenseService.create(input)
      return { success: true, data: expense }
    } catch (error) {
      return { success: false, error: { code: 'EXPENSE_CREATE_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('expenses:update', (_event, id: string, input) => {
    try {
      const expense = expenseService.update(id, input)
      return { success: true, data: expense }
    } catch (error) {
      return { success: false, error: { code: 'EXPENSE_UPDATE_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('expenses:delete', (_event, id: string) => {
    try {
      expenseService.delete(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: { code: 'EXPENSE_DELETE_ERROR', message: (error as Error).message } }
    }
  })
}
