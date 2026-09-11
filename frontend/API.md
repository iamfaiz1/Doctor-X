# Doctor-X Frontend — Required Backend APIs

> All endpoints are prefixed with `/api`. The Vite dev-server proxies `/api → http://localhost:8000`.

---

## GET `/api/health`
Returns `{ status: "ok" }` — used by the Sidebar to show backend online/offline status.

## GET `/api/model/info`
Returns active model metadata `{ name, architecture, version, num_classes, classes[], device, loaded }` — displayed in the Sidebar below the status badge.

## GET `/api/classes`
Returns `{ classes: string[] }` — the ordered 14-class list from the checkpoint; used to populate the Grad-CAM class selector in ExplainabilityTab.

## POST `/api/predict`
`multipart/form-data` · field: `file` (image)  
Returns `{ model: string, predictions: [{ label: string, probability: number }] }` — drives ResultsTab and ReportTab.

## POST `/api/explain`
`multipart/form-data` · fields: `file` (image), `target_class` (string from `/api/classes`)  
Returns `{ target_class, method, image_data_uri }` — renders the Grad-CAM overlay in ExplainabilityTab.

## POST `/api/analyze`
`multipart/form-data` · fields: `file` (image), `target_class` (string from `/api/classes`)  
Returns combined predict + explain response — one-shot endpoint used when both predictions and a Grad-CAM are needed together.

---

## Error Codes (all POST endpoints)

| Code | Meaning |
|------|---------|
| `400` | Empty or missing upload |
| `413` | File exceeds max upload size |
| `415` | Invalid or corrupt image |
| `422` | Unsupported / unknown `target_class` (`/api/explain`, `/api/analyze` only) |
| `503` | Model not loaded |

---

## Not Implemented (frontend stubs only)

- **Multi-model comparison** — `BenchmarkTab` shows a placeholder; no compare endpoint exists yet.
- **PDF export** — `ReportTab` no longer calls a PDF endpoint; raw predictions table is shown instead.

