import { useState, useCallback } from 'react'
import { analyzeImage } from './api/client'

import LandingPage from './components/LandingPage'
import Sidebar from './components/Sidebar'
import UploadTab from './components/UploadTab'
import ResultsTab from './components/ResultsTab'
import ExplainabilityTab from './components/ExplainabilityTab'
import ReportTab from './components/ReportTab'
import BenchmarkTab from './components/BenchmarkTab'
import ChatTab from './components/ChatTab'

const TABS = [
  { id: 'upload',         label: '📤 Upload & Quality'      },
  { id: 'results',        label: '📊 Diagnostic Predictions' },
  { id: 'explainability', label: '🎯 Explainability'         },
  { id: 'chat',           label: '💬 AI Chat'                },
  { id: 'report',         label: '📋 Clinical Report'        },
  { id: 'benchmark',      label: 'ℹ️ Benchmarks'             },
]

export default function App() {
  // Page state: 'landing' | 'app'
  const [page, setPage] = useState('landing')

  // Analysis state
  const [activeTab, setActiveTab]           = useState('upload')
  const [uploadedFile, setUploadedFile]     = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisId, setAnalysisId]         = useState(null)
  const [isAnalyzing, setIsAnalyzing]       = useState(false)
  const [analysisError, setAnalysisError]   = useState(null)

  // Use /api/analyze so we get an analysis_id for explanations, chat, and reports
  const runAnalysis = useCallback(async (file) => {
    setUploadedFile(file)
    setAnalysisResult(null)
    setAnalysisId(null)
    setAnalysisError(null)
    setIsAnalyzing(true)
    try {
      const result = await analyzeImage(file, { includeGradcam: false })
      setAnalysisResult(result)
      setAnalysisId(result.analysis_id ?? null)
    } catch (err) {
      setAnalysisError(err?.response?.data?.detail || err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const handleImageReady = useCallback((file) => {
    runAnalysis(file)
  }, [runAnalysis])

  const enterApp = () => {
    setPage('app')
    setActiveTab('upload')
  }

  // ── Landing page ────────────────────────────────────────
  if (page === 'landing') {
    return <LandingPage onEnterApp={enterApp} />
  }

  // ── Analysis app ────────────────────────────────────────
  return (
    <div className="app-shell">
      <Sidebar
        onBackToHome={() => setPage('landing')}
      />

      <div className="main-content">
        {/* Tab bar */}
        <nav className="tab-bar" role="tablist" aria-label="Analysis tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Global error / analyzing banners */}
        {analysisError && (
          <div className="alert error" style={{ margin: '10px 24px 0' }}>
            <span>❌</span>
            <span><strong>Analysis Error:</strong> {analysisError}</span>
          </div>
        )}
        {isAnalyzing && (
          <div className="alert info" style={{ margin: '10px 24px 0' }}>
            <div className="spinner" style={{ width: 15, height: 15, borderWidth: 2, flexShrink: 0 }} />
            <span>Running inference pipeline on <strong>DenseNet-121</strong>…</span>
          </div>
        )}

        {/* Tab panels */}
        <main className="tab-panel" role="tabpanel">
          {activeTab === 'upload' && (
            <UploadTab
              onImageReady={handleImageReady}
              analysisResult={analysisResult}
              isAnalyzing={isAnalyzing}
            />
          )}
          {activeTab === 'results' && (
            <ResultsTab
              predictions={analysisResult?.predictions || []}
              analysisId={analysisId}
            />
          )}
          {activeTab === 'explainability' && (
            <ExplainabilityTab
              analysisResult={analysisResult}
              uploadedFile={uploadedFile}
            />
          )}
          {activeTab === 'chat' && (
            <ChatTab
              analysisId={analysisId}
            />
          )}
          {activeTab === 'report' && (
            <ReportTab
              analysisResult={analysisResult}
              analysisId={analysisId}
            />
          )}
          {activeTab === 'benchmark' && (
            <BenchmarkTab uploadedFile={uploadedFile} />
          )}
        </main>
      </div>
    </div>
  )
}
