from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.dependencies import get_inference_service
from app.core.config import settings
from app.ml.constants import MODEL_NAME
from app.ml.inference import InferenceService, ModelUnavailableError
from app.ml.preprocessing import decode_image
from app.schemas.prediction import PredictionResponse

router = APIRouter(tags=["prediction"])


async def read_upload(file: UploadFile) -> bytes:
    payload = await file.read(settings.max_upload_bytes + 1)
    if len(payload) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Upload exceeds the configured size limit.")
    return payload


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    file: Annotated[UploadFile, File(description="Chest X-ray image")],
    service: InferenceService = Depends(get_inference_service),
) -> PredictionResponse:
    image = decode_image(await read_upload(file))
    try:
        return PredictionResponse(model=MODEL_NAME, predictions=service.predict(image))
    except ModelUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
