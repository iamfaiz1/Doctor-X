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
 * @returns {{ model: string, predictions: Array<{ label: string, probability: number }> }}
 */
export async function predict(file) {
  const form = new FormData()
  form.append('file', file)
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
 * @returns {{ target_class: string, method: string, image_data_uri: string }}
 */
export async function explain(file, targetClass) {
  const form = new FormData()
  form.append('file', file)
  form.append('target_class', targetClass)
  const { data } = await client.post('/api/explain', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// ─── Analyze (predict + Grad-CAM combined) ───────────────────────────────────

/**
 * POST /api/analyze
 * Runs prediction + Grad-CAM in one upload.
 * @param {File} file - The image file
 * @param {string} targetClass - One value from /api/classes
 * @returns combined predict + explain response object
 */
export async function analyzeImage(file, targetClass) {
  const form = new FormData()
  form.append('file', file)
  form.append('target_class', targetClass)
  const { data } = await client.post('/api/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
