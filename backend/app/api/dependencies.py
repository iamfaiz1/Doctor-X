from fastapi import Request

from app.ml.inference import InferenceService


def get_inference_service(request: Request) -> InferenceService:
    return request.app.state.inference_service
