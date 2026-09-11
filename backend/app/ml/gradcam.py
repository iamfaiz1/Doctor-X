"""Grad-CAM for the notebook's torchvision DenseNet-121."""
from __future__ import annotations

import base64
import io

import numpy as np
import torch
from PIL import Image

from app.ml.constants import IMAGE_SIZE


def create_overlay(model: torch.nn.Module, input_tensor: torch.Tensor, image: Image.Image, class_index: int) -> str:
    """Return a PNG data URI; hooks are always removed after the one request."""
    target_layer = model.features.denseblock4.denselayer16.conv2
    captured: dict[str, torch.Tensor] = {}

    def capture_activation(_module: torch.nn.Module, _inputs: tuple[object, ...], output: torch.Tensor) -> None:
        captured["activations"] = output

    handle = target_layer.register_forward_hook(capture_activation)
    try:
        model.zero_grad(set_to_none=True)
        logits = model(input_tensor)
        activations = captured["activations"]
        gradients = torch.autograd.grad(logits[0, class_index], activations)[0]
        weights = gradients.mean(dim=(2, 3), keepdim=True)
        heatmap = torch.relu((weights * activations).sum(dim=1))[0]
        heatmap = heatmap.detach().cpu().numpy()
    finally:
        handle.remove()

    maximum = float(heatmap.max())
    if maximum > 0:
        heatmap /= maximum
    heatmap = np.asarray(Image.fromarray(np.uint8(heatmap * 255)).resize((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.BILINEAR)) / 255.0
    original = np.asarray(image.convert("RGB").resize((IMAGE_SIZE, IMAGE_SIZE)), dtype=np.float32)
    # Lightweight jet-style map; no OpenCV dependency or persisted image required.
    red = np.clip(1.5 - np.abs(4 * heatmap - 3), 0, 1)
    green = np.clip(1.5 - np.abs(4 * heatmap - 2), 0, 1)
    blue = np.clip(1.5 - np.abs(4 * heatmap - 1), 0, 1)
    colored = np.stack((red, green, blue), axis=-1) * 255
    overlay = Image.fromarray(np.uint8(np.clip(0.55 * original + 0.45 * colored, 0, 255)))
    buffer = io.BytesIO()
    overlay.save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")
