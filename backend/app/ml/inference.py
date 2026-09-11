"""Reusable, process-scoped model inference service."""
from __future__ import annotations

from pathlib import Path

import torch
from PIL import Image

from app.core.config import Settings
from app.ml.constants import LABELS, MODEL_NAME, MODEL_VERSION
from app.ml.gradcam import create_overlay
from app.ml.model import build_model
from app.ml.preprocessing import preprocess


class ModelUnavailableError(RuntimeError):
    pass


class InferenceService:
    def __init__(self, config: Settings) -> None:
        self._config = config
        self._device = self._select_device(config.device)
        self._model: torch.nn.Module | None = None

    @staticmethod
    def _select_device(requested: str) -> torch.device:
        if requested == "auto":
            return torch.device("cuda" if torch.cuda.is_available() else "cpu")
        device = torch.device(requested)
        if device.type == "cuda" and not torch.cuda.is_available():
            raise ModelUnavailableError("MODEL_DEVICE requests CUDA, but CUDA is unavailable.")
        return device

    def load(self) -> None:
        path: Path = self._config.model_path
        if not path.is_file():
            raise ModelUnavailableError(
                "Trained model is missing. Place densenet121_chexpert.pth at the configured MODEL_PATH."
            )
        try:
            checkpoint = torch.load(path, map_location=self._device, weights_only=False)
            state_dict = checkpoint.get("model_state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
            if not isinstance(state_dict, dict):
                raise TypeError("Checkpoint does not contain a state dictionary.")
            state_dict = {key.removeprefix("module."): value for key, value in state_dict.items()}
            model = build_model()
            model.load_state_dict(state_dict, strict=True)
            self._model = model.to(self._device).eval()
        except (OSError, RuntimeError, TypeError, KeyError) as exc:
            raise ModelUnavailableError(f"Could not load the configured trained model: {exc}") from exc

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def info(self) -> dict[str, object]:
        return {"name": MODEL_NAME, "architecture": "torchvision DenseNet-121", "version": MODEL_VERSION,
                "num_classes": len(LABELS), "classes": list(LABELS), "device": str(self._device), "loaded": self.is_loaded}

    def predict(self, image: Image.Image) -> list[dict[str, object]]:
        model = self._require_model()
        tensor = preprocess(image).to(self._device)
        with torch.inference_mode():
            probabilities = torch.sigmoid(model(tensor))[0].detach().cpu().tolist()
        return [{"label": label, "probability": probability} for label, probability in zip(LABELS, probabilities)]

    def explain(self, image: Image.Image, target: str) -> str:
        model = self._require_model()
        if target not in LABELS:
            raise ValueError(f"Unsupported class '{target}'.")
        tensor = preprocess(image).to(self._device)
        return create_overlay(model, tensor, image, LABELS.index(target))

    def _require_model(self) -> torch.nn.Module:
        if self._model is None:
            raise ModelUnavailableError("Model is not loaded. Check MODEL_PATH and server startup logs.")
        return self._model
