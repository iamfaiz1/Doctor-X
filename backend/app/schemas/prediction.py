from typing import Optional

from pydantic import BaseModel, Field


class Prediction(BaseModel):
    label: str
    probability: float = Field(ge=0, le=1)


class PredictionResponse(BaseModel):
    model: str
    predictions: list[Prediction]


class ExplanationResponse(BaseModel):
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
    explanation: ExplanationResponse
