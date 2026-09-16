"""Doctor-X inference-only FastAPI application."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import classes, explainability, health, model, prediction
from app.core.config import settings
from app.ml.inference import InferenceService, ModelUnavailableError
from app.services.analysis_store import AnalysisStore
from app.services.gemini_service import GeminiService
from app.services.report_service import ReportService
from app.api.routes import analysis, chat, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    service = InferenceService(settings)
    app.state.inference_service = service
    app.state.analysis_store = AnalysisStore()
    app.state.gemini_service = GeminiService(settings)
    app.state.report_service = ReportService(settings.report_directory)
    try:
        service.load()
    except ModelUnavailableError:
        if settings.require_model_on_startup:
            raise
    yield


app = FastAPI(title="Doctor-X API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=list(settings.allowed_origins), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/api")
app.include_router(model.router, prefix="/api")
app.include_router(model.models_router, prefix="/api")
app.include_router(classes.router, prefix="/api")
app.include_router(prediction.router, prefix="/api")
app.include_router(explainability.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "Doctor-X API", "docs": "/docs"}
