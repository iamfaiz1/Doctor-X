import { useState, useRef, useEffect } from 'react'
import { sendChat } from '../api/client'

// ChatTab: interactive Q&A about a completed analysis via POST /api/chat
export default function ChatTab({ analysisId }) {
  const [messages, setMessages]     = useState([]) // { role: 'user'|'ai', text: string }[]
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [sessionId, setSessionId]   = useState(null)
  const [unavailable, setUnavailable] = useState(false)
  const bottomRef                   = useRef(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!analysisId) {
    return (
      <div className="slide-up">
        <div className="page-header">
          <h1 className="page-title">💬 AI Chat</h1>
          <p className="page-sub">Ask the AI questions about your chest X-ray analysis</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Upload and analyze a chest X-ray first to start a conversation.
          </div>
        </div>
      </div>
    )
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await sendChat(analysisId, sessionId, text)

      // Persist session_id for multi-turn conversation
      if (res.session_id) setSessionId(res.session_id)

      if (res.status === 'unavailable') {
        setUnavailable(true)
        setMessages(prev => [
          ...prev,
          { role: 'ai', text: '⚠️ AI chat is unavailable — Gemini is not configured on the server.' },
        ])
      } else {
        // Prefer simple_explanation as the chat reply; fall back to medical
        const reply = res.simple_explanation || res.medical_explanation || '(no response)'
        setMessages(prev => [...prev, { role: 'ai', text: reply }])
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message
      setError(msg)
      // Remove the optimistic user message on error so the user can retry
      setMessages(prev => prev.slice(0, -1))
      setInput(text)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReset = () => {
    setMessages([])
    setSessionId(null)
    setError(null)
    setUnavailable(false)
  }

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <h1 className="page-title">💬 AI Chat</h1>
        <p className="page-sub">
          Ask questions about the analysis findings · powered by Gemini
          {sessionId && (
            <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.55 }}>
              session: {sessionId.slice(0, 8)}…
            </span>
          )}
        </p>
      </div>

      {unavailable && (
        <div className="alert warning" style={{ marginBottom: 12 }}>
          <span>⚠️</span>
          <span>AI chat is unavailable — Gemini is not configured on the server.</span>
        </div>
      )}

      {/* Chat history */}
      <div
        className="card"
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 280,
          maxHeight: 480,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '16px 20px',
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💭</div>
            Ask anything about the predictions — e.g.{' '}
            <em>"What does Edema mean?"</em> or{' '}
            <em>"Which finding is most significant?"</em>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: msg.role === 'user'
                  ? 'var(--cyan-400)'
                  : 'var(--surface-2, rgba(255,255,255,0.06))',
                color: msg.role === 'user' ? '#000' : 'var(--text-primary)',
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.text}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, opacity: 0.6 }}>
              {msg.role === 'user' ? 'You' : '🤖 AI'}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI is thinking…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="alert error" style={{ marginTop: 8 }}>
          <span>❌</span><span>{error}</span>
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'flex-end' }}>
        <textarea
          id="chat-input"
          className="select-field"
          placeholder="Ask about the findings… (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || unavailable}
          rows={2}
          style={{
            flex: 1,
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: 14,
            lineHeight: 1.5,
            padding: '10px 14px',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            id="chat-send-btn"
            className="btn btn-primary"
            onClick={handleSend}
            disabled={loading || !input.trim() || unavailable}
            style={{ minWidth: 80 }}
          >
            {loading ? '⏳' : '➤ Send'}
          </button>
          {messages.length > 0 && (
            <button
              id="chat-reset-btn"
              className="btn"
              onClick={handleReset}
              style={{ fontSize: 11, opacity: 0.6 }}
            >
              🗑 Clear
            </button>
          )}
        </div>
      </div>

      <div className="alert info" style={{ marginTop: 12 }}>
        <span>ℹ️</span>
        <span>
          AI responses are generated by Gemini based on model predictions only.
          Do <strong>not</strong> use for clinical decision-making.
        </span>
      </div>
    </div>
  )
}
