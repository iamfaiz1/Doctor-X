from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.dependencies import get_inference_service
from app.api.routes.prediction import read_upload
from app.ml.inference import InferenceService, ModelUnavailableError
from app.ml.preprocessing import decode_image
from app.schemas.prediction import AnalysisResponse, ExplanationResponse, PredictionResponse

router = APIRouter(tags=["explainability"])


@router.post("/explain", response_model=ExplanationResponse)
async def explain(
    file: Annotated[UploadFile, File(description="Chest X-ray image")],
    target_class: Annotated[str, Form(description="Exact supported disease class")],
    service: InferenceService = Depends(get_inference_service),
) -> ExplanationResponse:
    image = decode_image(await read_upload(file))
    try:
        return ExplanationResponse(**service.explain(image, target_class))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ModelUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: Annotated[UploadFile, File(description="Chest X-ray image")],
    target_class: Annotated[str, Form(description="Exact supported disease class")],
    service: InferenceService = Depends(get_inference_service),
) -> AnalysisResponse:
    image = decode_image(await read_upload(file))
    try:
        prediction = PredictionResponse(model="DenseNet-121 CheXpert", predictions=service.predict(image))
        explanation = ExplanationResponse(**service.explain(image, target_class))
        return AnalysisResponse(**prediction.dict(), explanation=explanation)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ModelUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
