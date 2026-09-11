import { useState } from 'react'
// NOTE: The Doctor-X backend exposes only one model (DenseNet-121 CheXpert).
// The /api/v1/compare-models endpoint from the old design does NOT exist.
// This tab is kept as a UI placeholder for future multi-model support.

export default function BenchmarkTab({ uploadedFile }) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Backend only has one model; multi-model compare is not yet implemented.
  const [selected, setSelected] = useState(['densenet121'])

  const toggleModel = (m) => {
    setSelected(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  const handleCompare = async () => {
    setError('Multi-model comparison is not available in the current backend. Only DenseNet-121 CheXpert is deployed.')
  }

  return (
    <div className="slide-up">
      <div className="page-header">
        <h1 className="page-title">ℹ️ Empirical Model Benchmarks</h1>
        <p className="page-sub">Compare multiple backbone models on the uploaded radiograph</p>
      </div>

      {/* Model toggles */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">🔧 Model Status</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <button
            id="compare-toggle-densenet121"
            className="sub-tab-btn active"
            style={{ cursor: 'default' }}
          >
            densenet121 ✓ (active)
          </button>
          {['efficientnet_b0', 'efficientnet_b4', 'vit_b_16'].map(m => (
            <button
              key={m}
              id={`compare-toggle-${m}`}
              className="sub-tab-btn"
              disabled
              style={{ opacity: 0.45, cursor: 'not-allowed' }}
            >
              {m} (not deployed)
            </button>
          ))}
        </div>
        <button
          id="run-comparison-btn"
          className="btn btn-primary"
          onClick={handleCompare}
          disabled={loading}
        >
          {loading ? '⏳ Comparing…' : '▶️ Run Comparison'}
        </button>
      </div>


      {error && (
        <div className="alert error" style={{ marginBottom: 16 }}>
          <span>❌</span><span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="card">
          <div className="spinner-wrap">
            <div className="spinner" />
            <div className="spinner-text">Running inference on {selected.length} models…</div>
          </div>
        </div>
      )}

      {results && !loading && (
        <div className="card fade-in">
          <div className="card-title">📊 Comparison Results</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Positive Pathologies</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {results.results.map(r => (
                  <tr key={r.model_name}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)' }}>
                        {r.model_name}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color: r.status === 'success'
                            ? 'var(--green-400)'
                            : r.status === 'pending_training'
                              ? 'var(--amber-400)'
                              : 'var(--red-400)',
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.positive_pathologies?.length
                        ? r.positive_pathologies.join(', ')
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {r.quality?.status || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!results && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Select models and upload an image, then click <strong>Run Comparison</strong>.
          </div>
        </div>
      )}
    </div>
  )
}
