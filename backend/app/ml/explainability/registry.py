"""Model-specific Grad-CAM configuration; the Grad-CAM algorithm stays generic."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

import torch

from app.ml.explainability.base import ExplainabilityError

TargetLayerResolver = Callable[[torch.nn.Module], torch.nn.Module]


@dataclass(frozen=True)
class ModelExplanationConfig:
    model_name: str
    target_layer_name: str
    resolve_target_layer: TargetLayerResolver

    def target_layer_for(self, model: torch.nn.Module) -> torch.nn.Module:
        try:
            layer = self.resolve_target_layer(model)
        except (AttributeError, IndexError, KeyError) as exc:
            raise ExplainabilityError(
                f"{self.model_name} is incompatible with configured Grad-CAM target layer '{self.target_layer_name}'."
            ) from exc
        if not isinstance(layer, torch.nn.Module):
            raise ExplainabilityError(f"Configured Grad-CAM target '{self.target_layer_name}' is not a module.")
        return layer


MODEL_EXPLANATIONS: dict[str, ModelExplanationConfig] = {
    # Verified in densenet-10k-fixed.ipynb: model.features ends at norm5 and
    # is the final spatial feature map before ReLU/global average pooling.
    "densenet121_chexpert": ModelExplanationConfig(
        model_name="densenet121_chexpert",
        target_layer_name="model.features",
        resolve_target_layer=lambda model: model.features,  # type: ignore[attr-defined]
    ),
}


def get_model_explanation(model_name: str) -> ModelExplanationConfig:
    try:
        return MODEL_EXPLANATIONS[model_name]
    except KeyError as exc:
        raise ExplainabilityError(f"No Grad-CAM configuration is registered for model '{model_name}'.") from exc
