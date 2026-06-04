import { logger } from '../utils/logger'
import { checkLowStock } from './tasks/low-stock.task'
import { checkOverdueInvoices } from './tasks/invoice-reminder.task'
import { runBackup } from './tasks/backup.task'
import { suggestReorder } from './tasks/reorder.task'

interface ScheduledTask {
  name: string
  intervalMs: number
  run: () => void
  lastRun: number
  timer: ReturnType<typeof setInterval> | null
}

const MILLISECOND = 1
const SECOND = 1000 * MILLISECOND
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const tasks: ScheduledTask[] = [
  {
    name: 'low-stock-check',
    intervalMs: HOUR,
    run: checkLowStock,
    lastRun: 0,
    timer: null
  },
  {
    name: 'invoice-reminder',
    intervalMs: 6 * HOUR,
    run: checkOverdueInvoices,
    lastRun: 0,
    timer: null
  },
  {
    name: 'reorder-suggestion',
    intervalMs: 12 * HOUR,
    run: suggestReorder,
    lastRun: 0,
    timer: null
  },
  {
    name: 'daily-backup',
    intervalMs: DAY,
    run: runBackup,
    lastRun: 0,
    timer: null
  }
]

export interface SchedulerState {
  running: boolean
  tasks: Array<{
    name: string
    intervalMs: number
    lastRun: number
    nextRun: number
  }>
}

function getState(): SchedulerState {
  const now = Date.now()
  return {
    running: tasks.some((t) => t.timer !== null),
    tasks: tasks.map((t) => ({
      name: t.name,
      intervalMs: t.intervalMs,
      lastRun: t.lastRun,
      nextRun: t.lastRun + t.intervalMs
    }))
  }
}

export function startScheduler(): void {
  logger.info('[Scheduler] Starting automation tasks...')

  for (const task of tasks) {
    if (task.timer) continue

    task.lastRun = Date.now()

    task.timer = setInterval(() => {
      logger.info(`[Scheduler] Running task: ${task.name}`)
      try {
        task.run()
      } catch (error) {
        logger.error(`[Scheduler] Task "${task.name}" failed`, error)
      }
      task.lastRun = Date.now()
    }, task.intervalMs)

    logger.info(`[Scheduler] Scheduled "${task.name}" every ${task.intervalMs / 1000}s`)
  }

  setTimeout(() => {
    logger.info('[Scheduler] Running initial tasks...')
    for (const task of tasks) {
      try {
        task.run()
      } catch (error) {
        logger.error(`[Scheduler] Initial run of "${task.name}" failed`, error)
      }
      task.lastRun = Date.now()
    }
  }, 10000)
}

export function stopScheduler(): void {
  logger.info('[Scheduler] Stopping automation tasks...')
  for (const task of tasks) {
    if (task.timer) {
      clearInterval(task.timer)
      task.timer = null
    }
  }
}

export function getSchedulerState(): SchedulerState {
  return getState()
}
