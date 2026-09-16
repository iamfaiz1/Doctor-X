"""Reusable, process-scoped model inference service."""
from __future__ import annotations

from pathlib import Path

import torch
from PIL import Image

from app.core.config import Settings
from app.ml.constants import LABELS, MODEL_NAME, MODEL_VERSION
from app.ml.explainability.base import ExplainabilityError
from app.ml.explainability.gradcam import GradCAM
from app.ml.explainability.registry import get_model_explanation
from app.ml.explainability.visualization import render_images
from app.ml.model import build_model
from app.ml.preprocessing import preprocess
from app.ml.registry import ModelRegistry, ModelSpec


class ModelUnavailableError(RuntimeError):
    pass


class InferenceService:
    def __init__(self, config: Settings) -> None:
        self._config = config
        self._device = self._select_device(config.device)
        self._model: torch.nn.Module | None = None
        self.registry = ModelRegistry(config)

    @staticmethod
    def _select_device(requested: str) -> torch.device:
        if requested == "auto":
            return torch.device("cuda" if torch.cuda.is_available() else "cpu")
        device = torch.device(requested)
        if device.type == "cuda" and not torch.cuda.is_available():
            raise ModelUnavailableError("MODEL_DEVICE requests CUDA, but CUDA is unavailable.")
        return device

    def load(self) -> None:
        path: Path = self.registry.get("densenet121").checkpoint_path
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

    def info(self, model_id: str = "densenet121") -> dict[str, object]:
        spec = self.registry.get(model_id)
        return {"model_id": spec.model_id, "name": spec.name, "architecture": spec.architecture, "version": spec.version,
                "num_classes": len(spec.class_names), "classes": list(spec.class_names), "input_size": spec.input_size,
                "target_layer": spec.target_layer, "device": str(self._device), "loaded": self.is_loaded}

    def models(self) -> list[dict[str, object]]:
        return [self.info(spec.model_id) for spec in self.registry.all()]

    def predict(self, image: Image.Image, model_id: str = "densenet121") -> list[dict[str, object]]:
        self.registry.get(model_id)
        model = self._require_model()
        tensor = preprocess(image).to(self._device)
        with torch.inference_mode():
            probabilities = torch.sigmoid(model(tensor))[0].detach().cpu().tolist()
        return [{"label": label, "probability": probability} for label, probability in zip(LABELS, probabilities)]

    def explain(self, image: Image.Image, target: str, model_id: str = "densenet121") -> dict[str, object]:
        spec = self.registry.get(model_id)
        model = self._require_model()
        if target not in LABELS:
            raise ValueError(f"Unsupported class '{target}'.")
        tensor = preprocess(image).to(self._device)
        try:
            explanation_config = get_model_explanation("densenet121_chexpert")
            output = GradCAM(model, explanation_config.target_layer_for(model)).generate(tensor, LABELS.index(target))
            original, heatmap, overlay = render_images(image, output.heatmap, output.has_positive_evidence)
        except ExplainabilityError as exc:
            raise ModelUnavailableError(str(exc)) from exc
        probability = float(torch.sigmoid(output.logits)[0, LABELS.index(target)].cpu())
        return {
            "model": spec.name, "model_id": spec.model_id, "model_version": spec.version,
            "target_class": target,
            "probability": probability,
            "target_layer": explanation_config.target_layer_name,
            "has_positive_evidence": output.has_positive_evidence,
            "message": None if output.has_positive_evidence else "No positive localized Grad-CAM evidence was found for this target class.",
            "original_image_data_uri": original,
            "heatmap_image_data_uri": heatmap,
            "overlay_image_data_uri": overlay,
        }

    def _require_model(self) -> torch.nn.Module:
        if self._model is None:
            raise ModelUnavailableError("Model is not loaded. Check MODEL_PATH and server startup logs.")
        return self._model
