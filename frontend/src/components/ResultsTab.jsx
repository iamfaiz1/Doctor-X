// ResultsTab receives predictions from POST /api/predict:
// predictions: Array<{ label: string, probability: number }>
export default function ResultsTab({ predictions }) {
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
          Sigmoid probabilities for all 14 CheXpert classes · model output only, no clinical threshold applied
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
