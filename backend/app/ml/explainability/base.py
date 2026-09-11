"""Small contracts shared by explainability implementations."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import torch


class ExplainabilityError(RuntimeError):
    """Raised when a model cannot produce a valid explanation."""


@dataclass(frozen=True)
class GradCAMOutput:
    """A normalized, two-dimensional class-specific activation map."""

    heatmap: np.ndarray
    logits: torch.Tensor
    has_positive_evidence: bool
