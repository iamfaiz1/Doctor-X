"""Model construction matching the final Kaggle notebook architecture."""
from __future__ import annotations

import torch.nn as nn
from torchvision.models import densenet121

from app.ml.constants import LABELS


def build_model() -> nn.Module:
    # The local checkpoint contains the trained weights. Never download initial weights.
    model = densenet121(weights=None)
    model.classifier = nn.Linear(model.classifier.in_features, len(LABELS))
    return model
