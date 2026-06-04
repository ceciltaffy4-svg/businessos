import { useState, useRef, useEffect, useCallback } from 'react'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { ChatMessage, createMessage, QUICK_ACTIONS } from './chat-helpers'

function formatContent(content: string): string {
  return content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-surface-50 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2 border border-surface-200">$2</pre>')
    .replace(/\n/g, '<br/>')
}

export default function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage('assistant', 'Hello! I am your AI business assistant. Ask me anything about your business data, or try one of the quick actions below.\n\n**Important:** I can only read data. I will never modify your records without your explicit confirmation.')
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState<boolean | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    api.llm.checkConnection().then((r) => {
      if (r.success) {
        setConnected((r.data as { ok: boolean }).ok)
      } else {
        setConnected(false)
      }
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg = createMessage('user', text.trim())
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const result = await api.llm.chat(text, history)

      if (result.success) {
        const data = result.data as { answer: string; sql_executed?: string; sql_results?: unknown }
        setMessages((prev) => [
          ...prev,
          createMessage('assistant', data.answer, {
            sql_executed: data.sql_executed,
            sql_results: data.sql_results
          })
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          createMessage('assistant', `I encountered an error: ${result.error?.message || 'Unknown error'}. Please make sure Ollama is running and try again.`)
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        createMessage('assistant', `Connection error: ${(err as Error).message}. Make sure Ollama is running on your machine.`)
      ])
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  const handleQuickAction = (query: string) => {
    sendMessage(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">AI Assistant</h1>
          <p className="text-sm text-surface-500">Natural language business queries</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">Ollama</span>
          {connected === null ? (
            <Badge variant="default">Checking...</Badge>
          ) : connected ? (
            <Badge variant="success">Connected</Badge>
          ) : (
            <Badge variant="danger">Offline</Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto bg-white rounded-xl border border-surface-200 shadow-sm p-4 mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-50 text-surface-800 border border-surface-200'
              }`}
            >
              <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
              {msg.sql_executed && (
                <div className="mt-2 pt-2 border-t border-surface-200/50">
                  <details>
                    <summary className="text-xs text-surface-500 cursor-pointer hover:text-surface-700">Query executed</summary>
                    <pre className="text-xs font-mono mt-1 p-2 bg-surface-800/5 rounded overflow-x-auto">{msg.sql_executed}</pre>
                  </details>
                </div>
              )}
              <p className="text-xs mt-1 opacity-60">{msg.timestamp.toLocaleTimeString()}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-surface-50 border border-surface-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.query)}
              className="px-3 py-1.5 rounded-lg bg-white border border-surface-200 text-sm text-surface-600 hover:border-brand-400 hover:text-brand-700 transition-colors shadow-sm"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 bg-white rounded-xl border border-surface-200 shadow-sm p-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={connected === false ? 'Ollama is not running. Start Ollama and try again.' : 'Ask a question about your business...'}
          rows={1}
          className="flex-1 px-3 py-2 text-sm border-0 resize-none focus:outline-none"
          disabled={loading}
        />
        <Button
          variant="primary"
          size="md"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim() || connected === false}
        >
          {loading ? '...' : 'Send'}
        </Button>
      </div>

      {connected === false && (
        <p className="text-xs text-surface-500 mt-2 text-center">
          Install and run Ollama from <a className="text-brand-600" href="#">https://ollama.ai</a>, then pull a model like <code>llama3.2</code>
        </p>
      )}
    </div>
  )
}
