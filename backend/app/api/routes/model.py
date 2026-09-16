from fastapi import APIRouter, Depends

from app.api.dependencies import get_inference_service
from app.ml.inference import InferenceService

router = APIRouter(prefix="/model", tags=["model"])
models_router = APIRouter(tags=["model"])


@models_router.get("/models")
def models(service: InferenceService = Depends(get_inference_service)) -> dict[str, object]:
    return {"models": service.models()}


@router.get("/info")
def model_info(service: InferenceService = Depends(get_inference_service)) -> dict[str, object]:
    return service.info()


@router.get("/classes")
def classes(service: InferenceService = Depends(get_inference_service)) -> dict[str, list[str]]:
    return {"classes": service.info()["classes"]}  # type: ignore[return-value]


@router.get("/{model_id}")
def model_by_id(model_id: str, service: InferenceService = Depends(get_inference_service)) -> dict[str, object]:
    try:
        return service.info(model_id)
    except ValueError as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Model not found.") from exc
