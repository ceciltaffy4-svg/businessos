import { logger } from '../utils/logger'

export interface ValidationResult {
  safe: boolean
  query: string
  reason?: string
}

const FORBIDDEN_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE',
  'REPLACE', 'ATTACH', 'DETACH', 'REINDEX', 'VACUUM', 'PRAGMA'
]

const FORBIDDEN_PATTERNS = [
  /;\s*(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE)/i,
  /\/\*.*(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE)/i,
  /--.*(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE)/i
]

export function validateQuery(rawQuery: string): ValidationResult {
  const trimmed = rawQuery.trim()

  if (!trimmed) {
    return { safe: false, query: trimmed, reason: 'Empty query' }
  }

  const upper = trimmed.toUpperCase()

  for (const kw of FORBIDDEN_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`).test(upper)) {
      logger.warn(`[Security] Blocked ${kw} in AI-generated query`)
      return { safe: false, query: trimmed, reason: `Query contains forbidden keyword: ${kw}. AI can only read data.` }
    }
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) {
      logger.warn('[Security] Blocked multi-statement query with write operations')
      return { safe: false, query: trimmed, reason: 'Multi-statement write detected. AI can only read data.' }
    }
  }

  if (!/^SELECT\b/i.test(upper)) {
    return { safe: false, query: trimmed, reason: 'Only SELECT queries are allowed.' }
  }

  if (upper.includes('INTO')) {
    return { safe: false, query: trimmed, reason: 'SELECT INTO is not allowed.' }
  }

  return { safe: true, query: trimmed }
}

export function extractSqlBlocks(text: string): string[] {
  const blocks: string[] = []
  const regex = /```sql\s*([\s\S]*?)```/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const sql = match[1].trim()
    if (sql) blocks.push(sql)
  }

  return blocks
}

export function sanitizeForDisplay(text: string): string {
  return text.replace(/```sql[\s\S]*?```/g, '_(query executed)_')
}
