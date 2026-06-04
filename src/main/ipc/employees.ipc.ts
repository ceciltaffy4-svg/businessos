import { ipcMain } from 'electron'
import { employeeService } from '../services'

export function registerEmployeeIpc(): void {
  ipcMain.handle('employees:list', (_event, filters) => {
    try {
      const result = employeeService.list(filters)
      return { success: true, data: result.data, meta: { total: result.total, page: result.page, pageSize: result.pageSize } }
    } catch (error) {
      return { success: false, error: { code: 'EMPLOYEES_LIST_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('employees:get', (_event, id: string) => {
    try {
      const employee = employeeService.get(id)
      return { success: true, data: employee }
    } catch (error) {
      return { success: false, error: { code: 'EMPLOYEE_NOT_FOUND', message: (error as Error).message } }
    }
  })

  ipcMain.handle('employees:create', (_event, input) => {
    try {
      const employee = employeeService.create(input)
      return { success: true, data: employee }
    } catch (error) {
      return { success: false, error: { code: 'EMPLOYEE_CREATE_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('employees:update', (_event, id: string, input) => {
    try {
      const employee = employeeService.update(id, input)
      return { success: true, data: employee }
    } catch (error) {
      return { success: false, error: { code: 'EMPLOYEE_UPDATE_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('employees:delete', (_event, id: string) => {
    try {
      employeeService.delete(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: { code: 'EMPLOYEE_DELETE_ERROR', message: (error as Error).message } }
    }
  })
}
