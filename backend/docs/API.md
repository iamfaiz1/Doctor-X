# Doctor-X API

Authentication: none. Error body: `{"detail":"message"}`.

## GET /api/health

Response `200`: `{"status":"ok"}`.

## GET /api/models

Response `200`: `{"models":[{"model_id":"densenet121","name":"DenseNet-121 CheXpert","version":"10k-fixed","classes":[]}]}`.

## GET /api/models/{model_id}

Response `200`: model metadata. Errors: `404` unknown model.

## GET /api/model/info

Response `200`: active model metadata.

## GET /api/classes

Response `200`: `{"classes":["No Finding"]}`.

## POST /api/predict

Request: `multipart/form-data`: `file` (required image), `model_id` (optional, default `densenet121`).

Response `200`: `{"model_id":"densenet121","model_version":"10k-fixed","model":"DenseNet-121 CheXpert","predictions":[{"label":"Edema","probability":0.82}]}`. Errors: `400`, `413`, `415`, `422`, `503`.

## POST /api/explain

Request: `multipart/form-data`: `file`, `target_class`, optional `model_id`.

Response `200`: Grad-CAM result with `model_id`, `model_version`, `target_class`, `probability`, attribution metadata, and PNG data URIs. Errors: `400`, `413`, `415`, `422`, `503`.

## POST /api/analyze

Request: `multipart/form-data`: `file`; optional `model_id`, `target_class`, `include_gradcam` (default `true`).

Response `200`: `{"analysis_id":"uuid","created_at":"ISO-8601","model_id":"densenet121","predictions":[],"explanation":null}`. Errors: `400`, `413`, `415`, `422`, `503`.

## POST /api/explanations

Request JSON: `{"analysis_id":"uuid","stage":"overall_analysis"}`.

Response `200`: `{"analysis_id":"uuid","stage":"overall_analysis","status":"available","medical_explanation":"...","simple_explanation":"..."}`. `status` is `unavailable` when Gemini is not configured.

## POST /api/chat

Request JSON: `{"analysis_id":"uuid","session_id":"optional","message":"What does this mean?"}`.

Response `200`: `{"analysis_id":"uuid","session_id":"optional","status":"available","medical_explanation":"...","simple_explanation":"..."}`. Errors: `404` unknown analysis, `422` invalid request.

## POST /api/reports

Request JSON: `{"analysis_id":"uuid"}`. Response `200`: `{"report_id":"uuid","analysis_id":"uuid"}`. Errors: `404`, `503`.

## GET /api/reports/{report_id}

Response `200`: PDF download. Errors: `404`.
