import { ipcMain } from 'electron'
import { licenseService } from '../services/license.service'
import { z } from 'zod'

const activateSchema = z.object({
  key: z.string().min(1),
  licensee: z.string().min(1),
  edition: z.string().optional()
})

export function registerLicenseIpc(): void {
  ipcMain.handle('license:validate', () => {
    try {
      const result = licenseService.validate()
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('license:activate', (_event, payload: unknown) => {
    try {
      const parsed = activateSchema.parse(payload)
      const ok = licenseService.activate(parsed.key, parsed.licensee, parsed.edition)
      if (ok) {
        return { success: true, data: licenseService.validate() }
      }
      return { success: false, error: 'Invalid license key' }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('license:deactivate', () => {
    try {
      licenseService.deactivate()
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('license:generate', (_event, payload: { licensee: string; edition?: string }) => {
    const key = licenseService.generateLicense(payload.licensee, payload.edition)
    return { success: true, data: key }
  })

  ipcMain.handle('license:machineId', () => {
    return { success: true, data: licenseService.getMachineId() }
  })
}
