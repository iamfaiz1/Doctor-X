"""Architecture-agnostic Grad-CAM implementation for convolutional models."""
from __future__ import annotations

import numpy as np
import torch

from app.ml.explainability.base import ExplainabilityError, GradCAMOutput


class GradCAM:
    """Generate a Grad-CAM map for an injected model and convolutional layer.

    This class has no knowledge of model names, checkpoints, labels, or image
    preprocessing. A model adapter resolves the target layer before construction.
    """

    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module) -> None:
        self._model = model
        self._target_layer = target_layer

    def generate(self, input_tensor: torch.Tensor, target_index: int) -> GradCAMOutput:
        captured: dict[str, torch.Tensor] = {}

        def capture_activation(
            _module: torch.nn.Module, _inputs: tuple[object, ...], output: torch.Tensor
        ) -> None:
            if not isinstance(output, torch.Tensor) or output.ndim != 4:
                raise ExplainabilityError("The configured Grad-CAM layer must output a 4D feature tensor.")
            # Retaining this tensor's gradient avoids backward hooks, which can
            # be incompatible with models that consume activations in-place.
            output.retain_grad()
            captured["activations"] = output

        handle = self._target_layer.register_forward_hook(capture_activation)
        try:
            self._model.eval()
            self._model.zero_grad(set_to_none=True)
            grad_input = input_tensor.detach().clone().requires_grad_(True)
            logits = self._model(grad_input)
            if logits.ndim != 2 or not 0 <= target_index < logits.shape[1]:
                raise ExplainabilityError("Target class is incompatible with the loaded model output.")
            logits[0, target_index].backward()

            activations = captured.get("activations")
            if activations is None or activations.grad is None:
                raise ExplainabilityError("Grad-CAM could not capture feature activations and gradients.")
            weights = activations.grad.mean(dim=(2, 3), keepdim=True)
            heatmap = torch.relu((weights * activations).sum(dim=1))[0].detach().cpu().numpy()
        except ExplainabilityError:
            raise
        except RuntimeError as exc:
            raise ExplainabilityError(f"Grad-CAM generation failed: {exc}") from exc
        finally:
            handle.remove()
            self._model.zero_grad(set_to_none=True)

        minimum, maximum = float(heatmap.min()), float(heatmap.max())
        has_positive_evidence = maximum > minimum and maximum > 0.0
        normalized = np.zeros_like(heatmap, dtype=np.float32) if not has_positive_evidence else (heatmap - minimum) / (maximum - minimum)
        return GradCAMOutput(
            heatmap=normalized.astype(np.float32),
            logits=logits.detach(),
            has_positive_evidence=has_positive_evidence,
        )
