import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import { logger } from '../utils/logger'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

export type UpdateStatus =
  | { type: 'checking' }
  | { type: 'available'; version: string; releaseNotes?: string }
  | { type: 'not-available'; version: string }
  | { type: 'downloading'; percent: number }
  | { type: 'downloaded' }
  | { type: 'error'; message: string }

type StatusCallback = (status: UpdateStatus) => void

let statusCallback: StatusCallback | null = null

export function onUpdateStatus(cb: StatusCallback): void {
  statusCallback = cb
}

function emit(status: UpdateStatus): void {
  statusCallback?.(status)
}

autoUpdater.on('checking-for-update', () => {
  logger.info('[Update] Checking for updates...')
  emit({ type: 'checking' })
})

autoUpdater.on('update-available', (info) => {
  logger.info(`[Update] Update available: ${info.version}`)
  emit({ type: 'available', version: info.version, releaseNotes: info.releaseNotes })
})

autoUpdater.on('update-not-available', (info) => {
  logger.info(`[Update] No update available (current: ${info.version})`)
  emit({ type: 'not-available', version: info.version })
})

autoUpdater.on('download-progress', (progress) => {
  emit({ type: 'downloading', percent: Math.round(progress.percent) })
})

autoUpdater.on('update-downloaded', () => {
  logger.info('[Update] Update downloaded')
  emit({ type: 'downloaded' })
})

autoUpdater.on('error', (err) => {
  logger.error('[Update] Error', err)
  emit({ type: 'error', message: err.message })
})

export const updateService = {
  init(mainWindow: BrowserWindow): void {
    autoUpdater.logger = logger
    try {
      autoUpdater.checkForUpdates()
    } catch (err) {
      logger.error('[Update] Initial check failed', err)
    }
  },

  checkForUpdates(): void {
    autoUpdater.checkForUpdates()
  },

  downloadUpdate(): void {
    autoUpdater.downloadUpdate()
  },

  quitAndInstall(): void {
    setImmediate(() => {
      autoUpdater.quitAndInstall()
    })
  },

  getCurrentVersion(): string {
    return autoUpdater.currentVersion?.format() ?? '1.0.0'
  },

  getFeedURL(): string {
    return autoUpdater.getFeedURL?.() ?? ''
  }
}
