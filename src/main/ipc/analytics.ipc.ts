import { ipcMain } from 'electron'
import { analyticsService } from '../services'

export function registerAnalyticsIpc(): void {
  ipcMain.handle('analytics:dashboard', () => {
    try {
      const data = analyticsService.getDashboardOverview()
      return { success: true, data }
    } catch (error) {
      return { success: false, error: { code: 'ANALYTICS_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('analytics:dailySales', (_event, days?: number) => {
    try {
      const data = analyticsService.getDailySales(days ?? 30)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: { code: 'ANALYTICS_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('analytics:weeklySales', (_event, weeks?: number) => {
    try {
      const data = analyticsService.getWeeklySales(weeks ?? 12)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: { code: 'ANALYTICS_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('analytics:monthlySales', (_event, months?: number) => {
    try {
      const data = analyticsService.getMonthlySales(months ?? 12)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: { code: 'ANALYTICS_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('analytics:topProducts', (_event, limit?: number) => {
    try {
      const data = analyticsService.getTopProducts(limit ?? 10)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: { code: 'ANALYTICS_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('analytics:lowStock', () => {
    try {
      const data = analyticsService.getLowStockProducts()
      return { success: true, data }
    } catch (error) {
      return { success: false, error: { code: 'ANALYTICS_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('analytics:expenseSummary', (_event, months?: number) => {
    try {
      const data = analyticsService.getExpenseSummary(months ?? 1)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: { code: 'ANALYTICS_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('analytics:profitEstimate', (_event, months?: number) => {
    try {
      const data = analyticsService.getProfitEstimate(months ?? 1)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: { code: 'ANALYTICS_ERROR', message: (error as Error).message } }
    }
  })
}
