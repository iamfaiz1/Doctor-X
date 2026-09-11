// ReportTab: the real backend (Doctor-X) has no /api/pdf or report-generation endpoint.
// We display the raw predictions as a readable summary table instead.
export default function ReportTab({ analysisResult }) {
  if (!analysisResult) {
    return (
      <div className="slide-up">
        <div className="page-header">
          <h1 className="page-title">📋 Clinical Report</h1>
          <p className="page-sub">Prediction summary from DenseNet-121 CheXpert</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Upload and analyze a chest X-ray to generate a report.
          </div>
        </div>
      </div>
    )
  }

  const { model, predictions = [] } = analysisResult
  const sorted = [...predictions].sort((a, b) => b.probability - a.probability)

  return (
    <div className="slide-up">
      <div className="page-header">
        <h1 className="page-title">📋 Clinical Report</h1>
        <p className="page-sub">
          Raw sigmoid probabilities · model: <strong>{model || 'DenseNet-121 CheXpert'}</strong>
        </p>
      </div>

      <div className="card fade-in">
        <div className="card-title">📊 Prediction Summary</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Pathology / Class</th>
                <th style={{ textAlign: 'right' }}>Probability</th>
                <th>Bar</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.label}>
                  <td style={{ fontWeight: 500 }}>{p.label}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)' }}>
                    {(p.probability * 100).toFixed(2)}%
                  </td>
                  <td style={{ width: 160 }}>
                    <div className="prob-bar-track" style={{ margin: 0 }}>
                      <div
                        className="prob-bar-fill neutral"
                        style={{ width: `${Math.min(p.probability * 100, 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="alert info" style={{ marginTop: 16 }}>
        <span>⚠️</span>
        <span>
          This is a <strong>research prototype</strong>. Probabilities are raw sigmoid outputs with no
          clinical decision threshold applied. PDF export and AI narrative reports are not available
          in the current backend. Not for clinical use.
        </span>
      </div>
    </div>
  )
}
