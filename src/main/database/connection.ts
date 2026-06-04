import Database from 'better-sqlite3'
import { config } from '../utils/config'
import { logger } from '../utils/logger'
import { runMigrations } from './migrations'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return db
}

export function initializeDatabase(): void {
  if (db) return

  logger.info(`Opening database at ${config.dbPath}`)
  db = new Database(config.dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = -64000')

  runMigrations(db)
  logger.info('Database initialized successfully')
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    logger.info('Database closed')
  }
}
