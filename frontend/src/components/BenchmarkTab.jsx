import { useState, useEffect } from 'react'
import { fetchModels } from '../api/client'

// BenchmarkTab: shows live model data from GET /api/models
// and model metadata from GET /api/models/{model_id}.
export default function BenchmarkTab({ uploadedFile }) {
  const [models, setModels]       = useState([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [modelsError, setModelsError]     = useState(null)

  // Load model list on mount
  useEffect(() => {
    setModelsLoading(true)
    fetchModels()
      .then(({ models: list }) => setModels(list || []))
      .catch(err => setModelsError(err?.response?.data?.detail || err.message))
      .finally(() => setModelsLoading(false))
  }, [])

  return (
    <div className="slide-up">
      <div className="page-header">
        <h1 className="page-title">ℹ️ Empirical Model Benchmarks</h1>
        <p className="page-sub">Live model registry from the backend</p>
      </div>

      {/* Live model list from GET /api/models */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">🔧 Deployed Models</div>

        {modelsLoading && (
          <div className="spinner-wrap">
            <div className="spinner" />
            <div className="spinner-text">Loading model registry…</div>
          </div>
        )}

        {modelsError && (
          <div className="alert error">
            <span>❌</span><span>Failed to load models: {modelsError}</span>
          </div>
        )}

        {!modelsLoading && !modelsError && models.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            No models registered on the backend.
          </div>
        )}

        {!modelsLoading && models.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {models.map(m => (
              <div
                key={m.model_id}
                style={{
                  background: 'var(--surface-2, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  borderRadius: 8,
                  padding: '14px 16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  alignItems: 'flex-start',
                }}
              >
                {/* Model badge */}
                <div style={{ flex: '0 0 auto' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'var(--cyan-400)',
                      color: '#000',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ✓ active
                  </div>
                </div>

                {/* Model details */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {m.name || m.model_id}
                  </div>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{m.model_id}</code>
                    </span>
                    {m.version && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Version: <code style={{ fontFamily: 'var(--font-mono)' }}>{m.version}</code>
                      </span>
                    )}
                    {m.classes && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Classes: <strong style={{ color: 'var(--text-secondary)' }}>{m.classes.length}</strong>
                      </span>
                    )}
                  </div>

                  {/* Class list (collapsed) */}
                  {m.classes && m.classes.length > 0 && (
                    <details style={{ marginTop: 8 }}>
                      <summary style={{ fontSize: 12, color: 'var(--cyan-400)', cursor: 'pointer', userSelect: 'none' }}>
                        View {m.classes.length} output classes
                      </summary>
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {m.classes.map(cls => (
                          <span
                            key={cls}
                            style={{
                              fontSize: 11,
                              background: 'var(--surface-3, rgba(255,255,255,0.06))',
                              border: '1px solid var(--border)',
                              borderRadius: 4,
                              padding: '2px 7px',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {cls}
                          </span>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Future multi-model note */}
      <div className="alert info">
        <span>ℹ️</span>
        <span>
          Multi-model comparison requires additional models to be deployed on the backend.
          Currently only models registered in the backend's model registry are shown above.
        </span>
      </div>
    </div>
  )
}
