import { app } from 'electron'
import { join } from 'path'

export const config = {
  dbPath: join(app.getPath('userData'), 'data.db'),
  dbBackupPath: join(app.getPath('userData'), 'data.db.backup'),
  receiptsDir: join(app.getPath('userData'), 'receipts'),
  userDataPath: app.getPath('userData')
}
