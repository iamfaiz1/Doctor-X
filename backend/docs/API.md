# Doctor-X API

The API has no authentication. It accepts chest X-ray images in memory only; uploaded images and generated explanations are not written to disk. This research system is not a clinical diagnosis.

## `GET /api/health`

Checks that the HTTP service is running.

Successful response:

```json
{"status":"ok"}
```

## `GET /api/model/info`

Returns the active model metadata, its device, load state, and the exact notebook class order. It does not disclose filesystem paths.

Successful response:

```json
{"name":"DenseNet-121 CheXpert","architecture":"torchvision DenseNet-121","version":"10k-fixed","num_classes":14,"classes":["No Finding"],"device":"cpu","loaded":true}
```

## `GET /api/classes`

Returns the exact ordered classes supported by the checkpoint.

Successful response:

```json
{"classes":["No Finding","Enlarged Cardiomediastinum","Cardiomegaly","Lung Opacity","Lung Lesion","Edema","Consolidation","Pneumonia","Atelectasis","Pneumothorax","Pleural Effusion","Pleural Other","Fracture","Support Devices"]}
```

## `POST /api/predict`

Runs multi-label inference. Send `multipart/form-data` with required field `file` (a valid image, maximum size set by `MAX_UPLOAD_BYTES`). Model output is sigmoid probability for every class; the notebook did not establish deployed clinical decision thresholds, so this endpoint deliberately does not call a finding positive or negative.

```bash
curl -X POST http://localhost:8000/api/predict -F "file=@xray.png"
```

Successful response:

```json
{"model":"DenseNet-121 CheXpert","predictions":[{"label":"No Finding","probability":0.841}]}
```

Errors: `400` empty upload, `413` oversized upload, `415` invalid/corrupt image, `503` unavailable model.

## `POST /api/explain`

Produces Grad-CAM for one exact requested class. Send `multipart/form-data` with `file` and `target_class` (one value from `/api/classes`). The response supplies PNG data URIs suitable for image `src` attributes. The selected class is scored from its logit and its sigmoid probability is returned.

```bash
curl -X POST http://localhost:8000/api/explain -F "file=@xray.png" -F "target_class=Edema"
```

Successful response:

```json
{
  "model":"DenseNet-121 CheXpert",
  "target_class":"Edema",
  "probability":0.82,
  "method":"Grad-CAM",
  "target_layer":"model.features",
  "has_positive_evidence":true,
  "message":null,
  "original_image_data_uri":"data:image/png;base64,...",
  "heatmap_image_data_uri":"data:image/png;base64,...",
  "overlay_image_data_uri":"data:image/png;base64,..."
}
```

Errors: `400` empty upload, `413` oversized upload, `415` invalid/corrupt image, `422` missing or unsupported class, `503` unavailable model or explanation failure.

Frontend usage:

```js
const form = new FormData()
form.append("file", uploadedFile)
form.append("target_class", "Edema")
const response = await fetch("/api/explain", { method: "POST", body: form })
const result = await response.json()
overlayImage.src = result.overlay_image_data_uri
```

## `POST /api/analyze`

Runs both prediction and Grad-CAM from one upload. Its request fields are the same as `/api/explain`; its response combines the `/api/predict` and `/api/explain` response objects.
