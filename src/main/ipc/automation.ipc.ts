import { ipcMain } from 'electron'
import { backupService } from '../services'
import { getSchedulerState } from '../automation/scheduler'
import { checkLowStock } from '../automation/tasks/low-stock.task'

export function registerAutomationIpc(): void {
  ipcMain.handle('automation:backup', () => {
    try {
      const result = backupService.createBackup()
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: { code: 'BACKUP_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('automation:listBackups', () => {
    try {
      const backups = backupService.listBackups()
      return { success: true, data: backups }
    } catch (error) {
      return { success: false, error: { code: 'BACKUP_LIST_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('automation:schedulerState', () => {
    try {
      const state = getSchedulerState()
      return { success: true, data: state }
    } catch (error) {
      return { success: false, error: { code: 'SCHEDULER_STATE_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('automation:runLowStockCheck', () => {
    try {
      checkLowStock()
      return { success: true }
    } catch (error) {
      return { success: false, error: { code: 'TASK_ERROR', message: (error as Error).message } }
    }
  })
}
