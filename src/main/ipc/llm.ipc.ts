import { ipcMain } from 'electron'
import { llmService } from '../services'

export function registerLlmIpc(): void {
  ipcMain.handle('llm:checkConnection', async () => {
    try {
      const result = await llmService.checkConnection()
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: { code: 'LLM_CONNECTION_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('llm:listModels', async () => {
    try {
      const models = await llmService.listModels()
      return { success: true, data: models }
    } catch (error) {
      return { success: false, error: { code: 'LLM_MODELS_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('llm:chat', async (_event, message: string, history: unknown[]) => {
    try {
      const result = await llmService.chat(message, history as Array<{ role: string; content: string }>)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: { code: 'LLM_CHAT_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('llm:generateReport', async (_event, reportType: string) => {
    try {
      const result = await llmService.generateReport(reportType)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: { code: 'LLM_REPORT_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('llm:predictShortages', async () => {
    try {
      const result = await llmService.predictShortages()
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: { code: 'LLM_PREDICTION_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('llm:getConfig', () => {
    try {
      const config = llmService.getConfig()
      return { success: true, data: config }
    } catch (error) {
      return { success: false, error: { code: 'LLM_CONFIG_ERROR', message: (error as Error).message } }
    }
  })

  ipcMain.handle('llm:configure', (_event, config: { host?: string; model?: string }) => {
    try {
      llmService.configure(config)
      return { success: true }
    } catch (error) {
      return { success: false, error: { code: 'LLM_CONFIG_ERROR', message: (error as Error).message } }
    }
  })
}
