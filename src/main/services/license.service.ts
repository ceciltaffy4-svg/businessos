import { machineIdSync } from 'node-machine-id'
import { createHash } from 'crypto'
import { getDatabase } from '../database/connection'
import { logger } from '../utils/logger'

const SECRET_SALT = 'b0s-0ffline-s3cr3t-k3y'
const LICENSE_TABLE = 'app_settings'
const LICENSE_KEY_FIELD = 'license_key'
const LICENSEE_FIELD = 'licensee_name'
const LICENSE_EDITION_FIELD = 'license_edition'

export interface LicenseInfo {
  activated: boolean
  key?: string
  licensee?: string
  edition?: string
  expires_at?: string
  machine_id?: string
}

function hashMachineId(machineId: string): string {
  return createHash('sha256')
    .update(machineId + SECRET_SALT)
    .digest('hex')
    .toUpperCase()
    .slice(0, 32)
    .replace(/(.{4})/g, '$1-')
    .slice(0, 35)
}

function formatLicenseKey(raw: string): string {
  return raw.replace(/(.{4})/g, '$1-').slice(0, 35)
}

export const licenseService = {
  init(): void {
    const db = getDatabase()
    db.exec(`
      CREATE TABLE IF NOT EXISTS license (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `)
  },

  generateLicense(licensee: string, edition: string = 'professional', expiresAt?: string): string {
    const machineId = machineIdSync()
    const raw = `${machineId}:${licensee}:${edition}:${expiresAt ?? 'permanent'}:${SECRET_SALT}`
    const key = createHash('sha256').update(raw).digest('hex').toUpperCase()
    return formatLicenseKey(key)
  },

  activate(licenseKey: string, licensee: string, edition: string = 'professional'): boolean {
    const cleaned = licenseKey.replace(/-/g, '').toLowerCase()
    if (cleaned.length !== 32) {
      logger.warn('[License] Invalid key length')
      return false
    }

    const db = getDatabase()
    db.prepare(`INSERT OR REPLACE INTO app_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))`).run(LICENSE_KEY_FIELD, licenseKey)
    db.prepare(`INSERT OR REPLACE INTO app_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))`).run(LICENSEE_FIELD, licensee)
    db.prepare(`INSERT OR REPLACE INTO app_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))`).run(LICENSE_EDITION_FIELD, edition)

    logger.info(`[License] Activated: ${licensee} (${edition})`)
    return true
  },

  validate(): LicenseInfo {
    const db = getDatabase()

    const stored = db
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get(LICENSE_KEY_FIELD) as { value: string } | undefined

    const licensee = (
      db.prepare('SELECT value FROM app_settings WHERE key = ?').get(LICENSEE_FIELD) as { value: string } | undefined
    )?.value

    const edition = (
      db.prepare('SELECT value FROM app_settings WHERE key = ?').get(LICENSE_EDITION_FIELD) as { value: string } | undefined
    )?.value

    if (!stored || !licensee) {
      return { activated: false }
    }

    return {
      activated: true,
      key: stored.value,
      licensee,
      edition: edition ?? 'professional'
    }
  },

  deactivate(): void {
    const db = getDatabase()
    db.prepare('DELETE FROM app_settings WHERE key = ?').run(LICENSE_KEY_FIELD)
    db.prepare('DELETE FROM app_settings WHERE key = ?').run(LICENSEE_FIELD)
    db.prepare('DELETE FROM app_settings WHERE key = ?').run(LICENSE_EDITION_FIELD)
    logger.info('[License] Deactivated')
  },

  getMachineId(): string {
    try {
      return hashMachineId(machineIdSync())
    } catch {
      return 'UNKNOWN'
    }
  }
}
