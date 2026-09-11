from pydantic import BaseModel, Field


class Prediction(BaseModel):
    label: str
    probability: float = Field(ge=0, le=1)


class PredictionResponse(BaseModel):
    model: str
    predictions: list[Prediction]


class ExplanationResponse(BaseModel):
    target_class: str
    method: str = "Grad-CAM"
    image_data_uri: str


class AnalysisResponse(PredictionResponse):
    explanation: ExplanationResponse
