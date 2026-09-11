import { useState, useCallback } from 'react'

export default function UploadTab({ onImageReady, analysisResult, isAnalyzing }) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)
    onImageReady(file)
  }, [onImageReady])

  const onInputChange = e => handleFile(e.target.files[0])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const quality = analysisResult?.quality

  return (
    <div className="slide-up">
      <div className="page-header">
        <h1 className="page-title">📤 Upload &amp; Quality Check</h1>
        <p className="page-sub">Upload a frontal chest radiograph (PNG / JPG / JPEG) to begin analysis</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone${dragging ? ' dragging' : ''}`}
        onDragEnter={e => { e.preventDefault(); setDragging(true) }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          id="cxr-upload-input"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={onInputChange}
        />
        <span className="upload-icon">🩻</span>
        <div className="upload-title">
          {dragging ? 'Drop to upload' : 'Drag &amp; drop your X-ray here'}
        </div>
        <div className="upload-sub">or click to browse · PNG, JPG, JPEG supported</div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="upload-preview fade-in">
          <img src={preview} alt="Uploaded radiograph" />
          <div className="upload-preview-info">
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fileName}</div>
            {isAnalyzing && (
              <div className="alert info" style={{ marginTop: 8 }}>
                <span>⚙️</span>
                Running AI inference pipeline — this may take 10–30 seconds…
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quality Results */}
      {quality && !isAnalyzing && (
        <div className="card fade-in" style={{ marginTop: 20 }}>
          <div className="card-title">🔬 Image Quality Check Gating</div>

          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-label">Quality Status</div>
              <div
                className="metric-value"
                style={{ color: quality.passed ? 'var(--green-400)' : 'var(--red-400)', fontSize: 14 }}
              >
                {quality.status || (quality.passed ? 'PASSED' : 'FAILED')}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Sharpness Score</div>
              <div className="metric-value">
                {typeof quality.sharpness_score === 'number' ? quality.sharpness_score.toFixed(1) : '—'}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Mean Luminance</div>
              <div className="metric-value">
                {typeof quality.mean_luminance === 'number' ? quality.mean_luminance.toFixed(1) : '—'}
              </div>
            </div>
          </div>

          {!quality.passed && (
            <div className="alert error" style={{ marginTop: 14 }}>
              <span>❌</span>
              <span>
                <strong>Image Rejected:</strong>{' '}
                {(quality.issues || []).join('; ') || 'Failed quality check.'}
              </span>
            </div>
          )}

          {quality.passed && quality.issues?.length > 0 && (
            <div className="alert warning" style={{ marginTop: 14 }}>
              <span>⚠️</span>
              <span>Advisory: {quality.issues.join('; ')}</span>
            </div>
          )}

          {quality.passed && !quality.issues?.length && (
            <div className="alert success" style={{ marginTop: 14 }}>
              <span>✅</span>
              <span>Image passed all quality checks. Analysis complete.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
