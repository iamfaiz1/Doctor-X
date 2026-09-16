"""Registry of inference artifacts. Adding a checkpoint does not alter routes."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.core.config import Settings
from app.ml.constants import IMAGE_SIZE, LABELS, MODEL_NAME, MODEL_VERSION, NORMALIZATION_MEAN, NORMALIZATION_STD


@dataclass(frozen=True)
class ModelSpec:
    model_id: str
    name: str
    architecture: str
    version: str
    checkpoint_path: Path
    class_names: tuple[str, ...]
    input_size: int
    normalization_mean: tuple[float, ...]
    normalization_std: tuple[float, ...]
    target_layer: str


class ModelRegistry:
    def __init__(self, settings: Settings) -> None:
        self._models = {"densenet121": ModelSpec("densenet121", MODEL_NAME, "torchvision DenseNet-121", MODEL_VERSION,
            settings.model_path, LABELS, IMAGE_SIZE, NORMALIZATION_MEAN, NORMALIZATION_STD, "model.features")}

    def get(self, model_id: str) -> ModelSpec:
        try:
            return self._models[model_id]
        except KeyError as exc:
            raise ValueError(f"Unknown model_id '{model_id}'.") from exc

    def all(self) -> list[ModelSpec]:
        return list(self._models.values())
