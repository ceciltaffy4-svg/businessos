import { registerProductIpc } from './products.ipc'
import { registerCustomerIpc } from './customers.ipc'
import { registerEmployeeIpc } from './employees.ipc'
import { registerSaleIpc } from './sales.ipc'
import { registerExpenseIpc } from './expenses.ipc'
import { registerPosIpc } from './pos.ipc'
import { registerAnalyticsIpc } from './analytics.ipc'
import { registerAutomationIpc } from './automation.ipc'
import { registerLlmIpc } from './llm.ipc'
import { registerLicenseIpc } from './license.ipc'
import type { BrowserWindow } from 'electron'

export function registerAllIpcHandlers(mainWindow?: BrowserWindow): void {
  registerProductIpc()
  registerCustomerIpc()
  registerEmployeeIpc()
  registerSaleIpc()
  registerExpenseIpc()
  registerPosIpc()
  registerAnalyticsIpc()
  registerAutomationIpc()
  registerLlmIpc()
  registerLicenseIpc()
}
