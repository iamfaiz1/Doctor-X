from fastapi import APIRouter, Depends

from app.api.dependencies import get_inference_service
from app.ml.inference import InferenceService

router = APIRouter(prefix="/model", tags=["model"])


@router.get("/info")
def model_info(service: InferenceService = Depends(get_inference_service)) -> dict[str, object]:
    return service.info()


@router.get("/classes")
def classes(service: InferenceService = Depends(get_inference_service)) -> dict[str, list[str]]:
    return {"classes": service.info()["classes"]}  # type: ignore[return-value]
