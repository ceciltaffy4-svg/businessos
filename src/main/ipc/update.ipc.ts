import { ipcMain } from 'electron'
import { updateService, UpdateStatus } from '../services/update.service'

export function registerUpdateIpc(mainWindow: Electron.BrowserWindow): void {
  updateService.init(mainWindow)

  updateService.onUpdateStatus((status: UpdateStatus) => {
    mainWindow.webContents.send('update:status', status)
  })

  ipcMain.handle('update:check', () => {
    updateService.checkForUpdates()
    return { success: true }
  })

  ipcMain.handle('update:download', () => {
    updateService.downloadUpdate()
    return { success: true }
  })

  ipcMain.handle('update:install', () => {
    updateService.quitAndInstall()
    return { success: true }
  })

  ipcMain.handle('update:currentVersion', () => {
    return { success: true, data: updateService.getCurrentVersion() }
  })
}
