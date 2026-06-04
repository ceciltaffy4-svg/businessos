import { logger } from '../utils/logger'

const OLLAMA_HOST = 'http://127.0.0.1:11434'
const TIMEOUT_MS = 60000
const DEFAULT_MODEL = 'llama3.2'

export interface OllamaConfig {
  host?: string
  model?: string
  timeout?: number
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaChatResponse {
  message: { content: string }
  done: boolean
}

let config: Required<OllamaConfig> = {
  host: OLLAMA_HOST,
  model: DEFAULT_MODEL,
  timeout: TIMEOUT_MS
}

export function configureOllama(cfg: OllamaConfig): void {
  if (cfg.host) config.host = cfg.host.replace(/\/+$/, '')
  if (cfg.model) config.model = cfg.model
  if (cfg.timeout) config.timeout = cfg.timeout
}

export function getOllamaConfig(): Readonly<Required<OllamaConfig>> {
  return { ...config }
}

export async function checkConnection(): Promise<{ ok: boolean; version?: string; error?: string }> {
  try {
    const res = await fetch(`${config.host}/api/version`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const data = await res.json()
    return { ok: true, version: data.version }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function listModels(): Promise<string[]> {
  try {
    const res = await fetch(`${config.host}/api/tags`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.models || []).map((m: { name: string }) => m.name)
  } catch {
    return []
  }
}

export async function chat(
  messages: OllamaMessage[],
  onToken?: (token: string) => void
): Promise<string> {
  const body = JSON.stringify({
    model: config.model,
    messages,
    stream: onToken !== undefined,
    options: { temperature: 0.1 }
  })

  logger.info(`[Ollama] Sending chat to ${config.model} (${messages.length} messages)`)

  try {
    const res = await fetch(`${config.host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(config.timeout)
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Ollama HTTP ${res.status}: ${text}`)
    }

    if (onToken) {
      let full = ''
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(Boolean)
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line) as OllamaChatResponse
            if (parsed.message?.content) {
              full += parsed.message.content
              onToken(parsed.message.content)
            }
          } catch { /* skip partial lines */ }
        }
      }
      return full
    }

    const data = (await res.json()) as OllamaChatResponse
    return data.message?.content ?? ''
  } catch (err) {
    logger.error('[Ollama] Chat error', err)
    throw err
  }
}
