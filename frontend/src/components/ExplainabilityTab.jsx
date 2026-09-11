import { useState, useEffect } from 'react'
import { explain, fetchClasses } from '../api/client'

// Fallback class list; overridden by live /api/classes response
const DEFAULT_CLASSES = [
  'No Finding','Enlarged Cardiomediastinum','Cardiomegaly','Lung Opacity',
  'Lung Lesion','Edema','Consolidation','Pneumonia','Atelectasis',
  'Pneumothorax','Pleural Effusion','Pleural Other','Fracture','Support Devices',
]

export default function ExplainabilityTab({ analysisResult, uploadedFile }) {
  const [classes, setClasses] = useState(DEFAULT_CLASSES)
  const [targetClass, setTargetClass] = useState(DEFAULT_CLASSES[0])
  const [explainResult, setExplainResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch the authoritative class list from the backend
  useEffect(() => {
    fetchClasses()
      .then(({ classes: cls }) => {
        setClasses(cls)
        setTargetClass(cls[0])
      })
      .catch(() => {}) // keep DEFAULT_CLASSES on failure
  }, [])

  const handleGenerate = async () => {
    if (!uploadedFile) return
    setLoading(true)
    setError(null)
    setExplainResult(null)
    try {
      // POST /api/explain → { target_class, method, image_data_uri }
      const res = await explain(uploadedFile, targetClass)
      setExplainResult(res)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!analysisResult) {
    return (
      <div className="slide-up">
        <div className="page-header">
          <h1 className="page-title">🎯 Visual Explainability</h1>
          <p className="page-sub">Model attention maps via Grad-CAM</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Upload and analyze a chest X-ray first to view attention maps.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="slide-up">
      <div className="page-header">
        <h1 className="page-title">🎯 Visual Explainability</h1>
        <p className="page-sub">
          {explainResult?.method || 'Grad-CAM'} attention visualization
        </p>
      </div>

      {/* Class selector */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">🔬 Inspect Attention for Class</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="class-selector"
              style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}
            >
              Select target class
            </label>
            <select
              id="class-selector"
              className="select-field"
              value={targetClass}
              onChange={e => setTargetClass(e.target.value)}
            >
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            id="generate-cam-btn"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading || !uploadedFile}
          >
            {loading ? '⏳ Generating…' : '🔍 Generate CAM'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert error" style={{ marginBottom: 16 }}>
          <span>❌</span><span>{error}</span>
        </div>
      )}

      {/* Grad-CAM result — image_data_uri is a ready-made data URI */}
      {explainResult?.image_data_uri ? (
        <>
          <div className="image-compare fade-in">
            <div className="image-frame">
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 12 }}>
                (Original radiograph not re-sent — see Upload tab)
              </div>
              <div className="image-caption">Original Radiograph</div>
            </div>
            <div className="image-frame">
              <img
                src={explainResult.image_data_uri}
                alt={`Grad-CAM for ${explainResult.target_class}`}
              />
              <div className="image-caption">
                {explainResult.method} — {explainResult.target_class}
              </div>
            </div>
          </div>
          <div className="alert info" style={{ marginTop: 14 }}>
            <span>ℹ️</span>
            <span>
              Attention heatmaps highlight input feature relevance and are <strong>not confirmed anatomical lesion boundaries</strong>.
            </span>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 36 }}>
          {loading ? (
            <div className="spinner-wrap">
              <div className="spinner" />
              <div className="spinner-text">Generating attention map…</div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Select a class above and click <strong>Generate CAM</strong> to visualize attention.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
