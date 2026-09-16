from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.dependencies import get_analysis_store, get_gemini_service, get_inference_service
from app.api.routes.prediction import read_upload
from app.ml.inference import ModelUnavailableError
from app.ml.preprocessing import decode_image
from app.schemas.prediction import AnalysisResponse, ExplanationRequest
from app.services.gemini_service import GeminiUnavailableError

router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse)
async def full_analysis(
    file: Annotated[UploadFile, File()],
    target_class: Annotated[Optional[str], Form()] = None,
    model_id: Annotated[str, Form()] = "densenet121",
    include_gradcam: Annotated[bool, Form()] = True,
    store=Depends(get_analysis_store),
    service=Depends(get_inference_service),
):
    image = decode_image(await read_upload(file))
    try:
        info = service.info(model_id)
        predictions = service.predict(image, model_id)
        if include_gradcam and target_class:
            explanation = service.explain(image, target_class, model_id)
        else:
            explanation = None
        result = store.put({"model_id": model_id, "model": info["name"], "model_version": info["version"],
                            "predictions": predictions, "explanation": explanation})
        return AnalysisResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ModelUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/explanations")
def generate_explanation(
    request: ExplanationRequest,
    store=Depends(get_analysis_store),
    gemini=Depends(get_gemini_service),
):
    context = store.get(request.analysis_id)
    if not context:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    cached = context.get("generated_explanations", {}).get(request.stage)
    if cached:
        return {"analysis_id": request.analysis_id, "stage": request.stage, "status": "available", **cached}
    try:
        result = gemini.explain(context, request.stage)
        context.setdefault("generated_explanations", {})[request.stage] = result
        return {"analysis_id": request.analysis_id, "stage": request.stage, "status": "available", **result}
    except GeminiUnavailableError as exc:
        return {"analysis_id": request.analysis_id, "stage": request.stage, "status": "unavailable", "detail": str(exc)}
