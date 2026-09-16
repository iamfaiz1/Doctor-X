from fastapi import Request

from app.ml.inference import InferenceService


def get_inference_service(request: Request) -> InferenceService:
    return request.app.state.inference_service


def get_analysis_store(request: Request):
    return request.app.state.analysis_store


def get_gemini_service(request: Request):
    return request.app.state.gemini_service


def get_report_service(request: Request):
    return request.app.state.report_service
