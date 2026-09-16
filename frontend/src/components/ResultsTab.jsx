import { useState } from 'react'
import { fetchExplanation } from '../api/client'

// ResultsTab receives predictions from POST /api/analyze:
// predictions: Array<{ label: string, probability: number }>
// analysisId: string | null — UUID returned by /api/analyze
export default function ResultsTab({ predictions, analysisId }) {
  const [explanation, setExplanation]     = useState(null)
  const [explLoading, setExplLoading]     = useState(false)
  const [explError, setExplError]         = useState(null)

  const handleFetchExplanation = async () => {
    if (!analysisId) return
    setExplLoading(true)
    setExplError(null)
    setExplanation(null)
    try {
      const res = await fetchExplanation(analysisId, 'overall_analysis')
      setExplanation(res)
    } catch (err) {
      setExplError(err?.response?.data?.detail || err.message)
    } finally {
      setExplLoading(false)
    }
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className="slide-up">
        <div className="page-header">
          <h1 className="page-title">📊 Diagnostic Predictions</h1>
          <p className="page-sub">Upload and analyze a chest X-ray to see pathology probabilities</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            No analysis results yet. Upload a chest X-ray to begin.
          </div>
        </div>
      </div>
    )
  }

  // Sort by probability descending
  const sorted = [...predictions].sort((a, b) => b.probability - a.probability)

  return (
    <div className="slide-up">
      <div className="page-header">
        <h1 className="page-title">📊 Diagnostic Predictions</h1>
        <p className="page-sub">
          Sigmoid probabilities for all CheXpert classes · model output only, no clinical threshold applied
        </p>
      </div>

      {/* Finding rows */}
      <div className="card">
        <div className="card-title">
          🧬 Pathology Probabilities
        </div>
        {sorted.map(p => (
          <div key={p.label} className="finding-row">
            <div className="finding-header">
              <div className="finding-name">{p.label}</div>
              <div className="finding-meta">
                {(p.probability * 100).toFixed(1)}%
              </div>
            </div>
            <div className="prob-bar-track">
              <div
                className="prob-bar-fill neutral"
                style={{ width: `${Math.min(p.probability * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI Explanation panel */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">🤖 AI Medical Explanation</div>

        {!analysisId && (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Analysis ID unavailable — re-upload your image to enable AI explanations.
          </div>
        )}

        {analysisId && !explanation && !explLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Generate an AI-powered narrative explanation of these findings (requires Gemini to be configured on the server).
            </div>
            <button
              id="fetch-explanation-btn"
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }}
              onClick={handleFetchExplanation}
              disabled={explLoading}
            >
              ✨ Generate AI Explanation
            </button>
          </div>
        )}

        {explLoading && (
          <div className="spinner-wrap">
            <div className="spinner" />
            <div className="spinner-text">Generating AI explanation…</div>
          </div>
        )}

        {explError && (
          <div className="alert error" style={{ marginTop: 8 }}>
            <span>❌</span><span>{explError}</span>
          </div>
        )}

        {explanation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {explanation.status === 'unavailable' ? (
              <div className="alert warning">
                <span>⚠️</span>
                <span>AI explanations are unavailable — Gemini is not configured on the server.</span>
              </div>
            ) : (
              <>
                {explanation.medical_explanation && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                      Medical Explanation
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }}>
                      {explanation.medical_explanation}
                    </div>
                  </div>
                )}
                {explanation.simple_explanation && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                      Plain Language Summary
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                      {explanation.simple_explanation}
                    </div>
                  </div>
                )}
                <button
                  id="refetch-explanation-btn"
                  className="btn btn-secondary"
                  style={{ alignSelf: 'flex-start', fontSize: 12 }}
                  onClick={handleFetchExplanation}
                  disabled={explLoading}
                >
                  🔄 Regenerate
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="alert info" style={{ marginTop: 16 }}>
        <span>ℹ️</span>
        <span>
          Probabilities are raw sigmoid outputs. The notebook did not establish clinical decision
          thresholds — a high probability does <strong>not</strong> constitute a positive finding.
          This system is for research only.
        </span>
      </div>
    </div>
  )
}
