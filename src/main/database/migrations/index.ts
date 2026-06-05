import type Database from 'better-sqlite3'
import { migration001 } from './001_initial'
import { migration002 } from './002_indexes_settings'

const migrations = [migration001, migration002]

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const applied = new Set(
    db
      .prepare('SELECT version FROM schema_migrations')
      .all()
      .map((row: { version: number }) => row.version)
  )

  for (const migration of migrations) {
    if (!applied.has(migration.version)) {
      migration.up(db)
      db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(
        migration.version,
        migration.name
      )
    }
  }
}
