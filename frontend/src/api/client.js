import axios from 'axios'

// In dev, Vite proxies /api -> http://localhost:8000
// In production, set VITE_API_BASE_URL env var
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // inference can take a while
})

// ─── Health ─────────────────────────────────────────────────────────────────

/**
 * GET /api/health
 * Returns { status: "ok" }
 */
export async function fetchHealth() {
  const { data } = await client.get('/api/health')
  return data
}

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * GET /api/models
 * Returns { models: [{ model_id, name, version, classes }] }
 */
export async function fetchModels() {
  const { data } = await client.get('/api/models')
  return data
}

/**
 * GET /api/models/{model_id}
 * Returns model metadata for a specific model.
 * @param {string} modelId
 */
export async function fetchModel(modelId) {
  const { data } = await client.get(`/api/models/${modelId}`)
  return data
}

// ─── Model info ─────────────────────────────────────────────────────────────

/**
 * GET /api/model/info
 * Returns active model metadata (name, architecture, version, num_classes, classes, device, loaded).
 */
export async function fetchModelInfo() {
  const { data } = await client.get('/api/model/info')
  return data
}

// ─── Classes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/classes
 * Returns { classes: string[] } — the ordered class list from the checkpoint.
 */
export async function fetchClasses() {
  const { data } = await client.get('/api/classes')
  return data
}

// ─── Predict ─────────────────────────────────────────────────────────────────

/**
 * POST /api/predict
 * Runs multi-label inference on a chest X-ray.
 * @param {File} file - The image file (PNG/JPG/JPEG)
 * @param {string} [modelId] - Optional model ID (default: densenet121)
 * @returns {{ model_id, model_version, model, predictions: Array<{ label, probability }> }}
 */
export async function predict(file, modelId) {
  const form = new FormData()
  form.append('file', file)
  if (modelId) form.append('model_id', modelId)
  const { data } = await client.post('/api/predict', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// ─── Explain ─────────────────────────────────────────────────────────────────

/**
 * POST /api/explain
 * Generates Grad-CAM for one target class.
 * @param {File} file - The image file
 * @param {string} targetClass - One value from /api/classes
 * @param {string} [modelId] - Optional model ID
 * @returns {{ model_id, model_version, target_class, probability,
 *   original_image_data_uri, heatmap_image_data_uri,
 *   overlay_image_data_uri, has_positive_evidence, message | null }}
 */
export async function explain(file, targetClass, modelId) {
  const form = new FormData()
  form.append('file', file)
  form.append('target_class', targetClass)
  if (modelId) form.append('model_id', modelId)
  const { data } = await client.post('/api/explain', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// ─── Analyze (predict + Grad-CAM combined) ───────────────────────────────────

/**
 * POST /api/analyze
 * Runs prediction + optional Grad-CAM in one upload. Returns an analysis_id
 * that can be used with /api/explanations, /api/chat, and /api/reports.
 * @param {File} file - The image file
 * @param {{ modelId?: string, targetClass?: string, includeGradcam?: boolean }} [opts]
 * @returns {{ analysis_id, created_at, model_id, predictions, explanation }}
 */
export async function analyzeImage(file, opts = {}) {
  const { modelId, targetClass, includeGradcam = true } = opts
  const form = new FormData()
  form.append('file', file)
  if (modelId) form.append('model_id', modelId)
  if (targetClass) form.append('target_class', targetClass)
  form.append('include_gradcam', String(includeGradcam))
  const { data } = await client.post('/api/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// ─── Explanations (AI narrative via Gemini) ───────────────────────────────────

/**
 * POST /api/explanations
 * Generates AI medical and simple explanations for a completed analysis.
 * @param {string} analysisId - UUID from /api/analyze
 * @param {string} [stage] - e.g. "overall_analysis"
 * @returns {{ analysis_id, stage, status, medical_explanation, simple_explanation }}
 */
export async function fetchExplanation(analysisId, stage = 'overall_analysis') {
  const { data } = await client.post('/api/explanations', {
    analysis_id: analysisId,
    stage,
  })
  return data
}

// ─── Chat ────────────────────────────────────────────────────────────────────

/**
 * POST /api/chat
 * Sends a chat message about a given analysis.
 * @param {string} analysisId - UUID from /api/analyze
 * @param {string|null} sessionId - Pass null on first message; reuse returned session_id for subsequent turns
 * @param {string} message - User's question
 * @returns {{ analysis_id, session_id, status, medical_explanation, simple_explanation }}
 */
export async function sendChat(analysisId, sessionId, message) {
  const body = { analysis_id: analysisId, message }
  if (sessionId) body.session_id = sessionId
  const { data } = await client.post('/api/chat', body)
  return data
}

// ─── Reports ─────────────────────────────────────────────────────────────────

/**
 * POST /api/reports
 * Generates a PDF report for a completed analysis.
 * @param {string} analysisId - UUID from /api/analyze
 * @returns {{ report_id, analysis_id }}
 */
export async function createReport(analysisId) {
  const { data } = await client.post('/api/reports', { analysis_id: analysisId })
  return data
}

/**
 * GET /api/reports/{report_id}
 * Downloads the generated PDF report as a Blob.
 * @param {string} reportId - UUID from POST /api/reports
 * @returns {Blob} PDF blob
 */
export async function downloadReport(reportId) {
  const { data } = await client.get(`/api/reports/${reportId}`, {
    responseType: 'blob',
  })
  return data
}
