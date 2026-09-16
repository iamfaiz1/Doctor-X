from typing import List, Optional

from pydantic import BaseModel, Field


class Prediction(BaseModel):
    label: str
    probability: float = Field(ge=0, le=1)


class PredictionResponse(BaseModel):
    model_id: str = "densenet121"
    model_version: Optional[str] = None
    model: str
    predictions: List[Prediction]


class ExplanationResponse(BaseModel):
    model_id: str = "densenet121"
    model_version: Optional[str] = None
    model: str
    target_class: str
    probability: float = Field(ge=0, le=1)
    method: str = "Grad-CAM"
    target_layer: str
    has_positive_evidence: bool
    message: Optional[str] = None
    original_image_data_uri: str
    heatmap_image_data_uri: str
    overlay_image_data_uri: str


class AnalysisResponse(PredictionResponse):
    analysis_id: Optional[str] = None
    created_at: Optional[str] = None
    explanation: Optional[ExplanationResponse] = None


class ExplanationRequest(BaseModel):
    analysis_id: str
    stage: str = "overall_analysis"


class ChatRequest(BaseModel):
    analysis_id: str
    message: str = Field(min_length=1, max_length=2000)
    session_id: Optional[str] = None