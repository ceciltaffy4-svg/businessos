const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
type LogLevel = (typeof LOG_LEVELS)[number]

const currentLevel: LogLevel = 'info'

function log(level: LogLevel, message: string, meta?: unknown): void {
  if (LOG_LEVELS.indexOf(level) < LOG_LEVELS.indexOf(currentLevel)) return
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  if (meta) {
    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`, meta)
  } else {
    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`)
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => log('debug', msg, meta),
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  error: (msg: string, meta?: unknown) => log('error', msg, meta)
}
