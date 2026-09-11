import { useState, useEffect } from 'react'
import { fetchHealth, fetchModelInfo } from '../api/client'
import ThemeToggle from './ThemeToggle'

// The real API only exposes one model (DenseNet-121 CheXpert).
// The model selector is kept for UI consistency but only "densenet121" is active.
const MODELS = [
  { value: 'densenet121', label: 'DenseNet-121' },
]

export default function Sidebar({ selectedModel, onModelChange, onBackToHome }) {
  const [health, setHealth] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)

  useEffect(() => {
    fetchHealth().then(setHealth).catch(() => setHealth(null))
    fetchModelInfo().then(setModelInfo).catch(() => setModelInfo(null))
  }, [])

  // Real API returns { status: "ok" }
  const isOnline = health?.status === 'ok'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">✚</div>
        <span className="logo-text">Doctor-X</span>
      </div>

      {/* Back to landing */}
      <button
        id="sidebar-back-btn"
        className="sidebar-back-btn"
        onClick={onBackToHome}
      >
        ← Back to Home
      </button>

      {/* API Status */}
      <div className="sidebar-section">
        <div className="sidebar-label">Backend Status</div>
        <div className="sidebar-status">
          <div
            className="status-badge"
            style={{
              background: isOnline ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
              color:      isOnline ? '#4ade80'              : '#f87171',
              border:     `1px solid ${isOnline ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 8 }}>●</span>
            {isOnline ? 'FastAPI Online' : 'API Offline'}
          </div>
          {modelInfo && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {modelInfo.version} · {modelInfo.num_classes} classes
            </div>
          )}
        </div>
      </div>

      {/* Model Selector */}
      <div className="sidebar-section">
        <div className="sidebar-label">Model Backbone</div>
        <select
          id="model-selector"
          className="select-field"
          value={selectedModel}
          onChange={e => onModelChange(e.target.value)}
        >
          {MODELS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <div className="sidebar-status" style={{ marginTop: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Active: <span style={{ color: 'var(--brand)' }}>
              {MODELS.find(m => m.value === selectedModel)?.label}
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            ⚡ Pretrained weights until checkpoint loaded.
          </div>
        </div>
      </div>

      {/* Theme toggle */}
      <div className="sidebar-section">
        <div className="sidebar-label">Appearance</div>
        <ThemeToggle />
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-box" style={{ marginTop: 'auto' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Disclaimer</div>
        AI research tool. <strong>Not for clinical use.</strong>
      </div>
    </aside>
  )
}
