import { logger } from '../../utils/logger'
import { backupService } from '../../services/backup.service'
import { automationEvents } from '../event-system'

export function runBackup(): void {
  try {
    const result = backupService.createBackup()
    logger.info(`[Automation] Daily backup created: ${result.path}`)
    automationEvents.emit('backup-created', result)

    const cleaned = backupService.cleanOldBackups(30)
    if (cleaned > 0) {
      logger.info(`[Automation] Cleaned ${cleaned} old backups`)
    }
  } catch (error) {
    logger.error('[Automation] Backup task failed', error)
    automationEvents.emit('automation-error', { task: 'backup', error: (error as Error).message })
  }
}
