import { useState } from 'react'
import { createReport, downloadReport } from '../api/client'

// ReportTab: generates a PDF report via POST /api/reports and downloads it
// via GET /api/reports/{report_id}.
export default function ReportTab({ analysisResult, analysisId }) {
  const [reportId, setReportId]       = useState(null)
  const [generating, setGenerating]   = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [genError, setGenError]       = useState(null)
  const [dlError, setDlError]         = useState(null)

  if (!analysisResult) {
    return (
      <div className="slide-up">
        <div className="page-header">
          <h1 className="page-title">📋 Clinical Report</h1>
          <p className="page-sub">Generate and download a PDF report of the analysis</p>
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

  const { model, model_id, predictions = [] } = analysisResult
  const sorted = [...predictions].sort((a, b) => b.probability - a.probability)

  const handleGenerate = async () => {
    if (!analysisId) return
    setGenerating(true)
    setGenError(null)
    setReportId(null)
    try {
      const res = await createReport(analysisId)
      setReportId(res.report_id)
    } catch (err) {
      setGenError(err?.response?.data?.detail || err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!reportId) return
    setDownloading(true)
    setDlError(null)
    try {
      const blob = await downloadReport(reportId)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `doctor-x-report-${reportId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setDlError(err?.response?.data?.detail || err.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="slide-up">
      <div className="page-header">
        <h1 className="page-title">📋 Clinical Report</h1>
        <p className="page-sub">
          Raw sigmoid probabilities · model: <strong>{model || model_id || 'DenseNet-121 CheXpert'}</strong>
        </p>
      </div>

      {/* Prediction summary table */}
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

      {/* PDF Report generation */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">📥 PDF Report</div>

        {!analysisId && (
          <div className="alert warning">
            <span>⚠️</span>
            <span>Analysis ID is unavailable. Re-upload your image to enable PDF report generation.</span>
          </div>
        )}

        {analysisId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Generate a PDF summary report on the server, then download it.
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Step 1 — Generate */}
              <button
                id="generate-report-btn"
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={generating || !!reportId}
              >
                {generating ? '⏳ Generating…' : reportId ? '✅ Report Ready' : '📄 Generate Report'}
              </button>

              {/* Step 2 — Download (visible once report_id is available) */}
              {reportId && (
                <button
                  id="download-report-btn"
                  className="btn btn-secondary"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? '⏳ Downloading…' : '⬇️ Download PDF'}
                </button>
              )}

              {/* Re-generate */}
              {reportId && (
                <button
                  id="regenerate-report-btn"
                  className="btn"
                  style={{ fontSize: 12, opacity: 0.7 }}
                  onClick={() => { setReportId(null); handleGenerate() }}
                  disabled={generating}
                >
                  🔄 Regenerate
                </button>
              )}
            </div>

            {reportId && !generating && (
              <div className="alert success" style={{ marginTop: 4 }}>
                <span>✅</span>
                <span>
                  Report generated — ID: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{reportId}</code>
                </span>
              </div>
            )}

            {genError && (
              <div className="alert error">
                <span>❌</span><span>{genError}</span>
              </div>
            )}
            {dlError && (
              <div className="alert error">
                <span>❌</span><span>{dlError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="alert info" style={{ marginTop: 16 }}>
        <span>⚠️</span>
        <span>
          This is a <strong>research prototype</strong>. Probabilities are raw sigmoid outputs with no
          clinical decision threshold applied. Not for clinical use.
        </span>
      </div>
    </div>
  )
}
