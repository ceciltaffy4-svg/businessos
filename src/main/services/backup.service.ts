import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'
import { config } from '../utils/config'
import { logger } from '../utils/logger'

function getBackupDir(): string {
  const dir = join(config.userDataPath, 'backups')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export const backupService = {
  createBackup(): { path: string; size: number } {
    const backupDir = getBackupDir()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = join(backupDir, `data-${timestamp}.db`)

    copyFileSync(config.dbPath, backupPath)
    const stats = statSync(backupPath)

    logger.info(`Backup created: ${backupPath}`)
    return { path: backupPath, size: stats.size }
  },

  listBackups(): Array<{ name: string; date: string; size: number }> {
    const backupDir = getBackupDir()
    if (!existsSync(backupDir)) return []

    const files = readdirSync(backupDir)
      .filter((f: string) => f.endsWith('.db'))
      .map((f: string) => {
        const st = statSync(join(backupDir, f))
        return { name: f, date: st.mtime.toISOString(), size: st.size }
      })
      .sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date))

    return files
  },

  cleanOldBackups(retainDays = 30): number {
    const backupDir = getBackupDir()
    if (!existsSync(backupDir)) return 0

    const cutoff = Date.now() - retainDays * 24 * 60 * 60 * 1000
    let deleted = 0

    const files = readdirSync(backupDir)
    for (const f of files) {
      const fp = join(backupDir, f)
      const st = statSync(fp)
      if (st.mtime.getTime() < cutoff) {
        unlinkSync(fp)
        deleted++
      }
    }

    if (deleted > 0) logger.info(`Cleaned ${deleted} old backups`)
    return deleted
  }
}
