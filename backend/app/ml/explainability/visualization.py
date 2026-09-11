"""Convert a normalized Grad-CAM map into browser-safe images without persistence."""
from __future__ import annotations

import base64
import io

import numpy as np
from PIL import Image


def _data_uri(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


def render_images(original: Image.Image, heatmap: np.ndarray, has_positive_evidence: bool) -> tuple[str, str, str]:
    """Return original, colored heatmap, and aligned overlay at original image dimensions."""
    source = original.convert("RGB")
    width, height = source.size
    resized = np.asarray(
        Image.fromarray(np.uint8(np.clip(heatmap, 0, 1) * 255)).resize((width, height), Image.Resampling.BILINEAR),
        dtype=np.float32,
    ) / 255.0
    original_array = np.asarray(source, dtype=np.float32)
    if not has_positive_evidence:
        # Do not turn an absence of positive evidence into an all-blue image.
        empty = Image.fromarray(np.zeros((height, width, 3), dtype=np.uint8))
        return _data_uri(source), _data_uri(empty), _data_uri(source)

    red = np.clip(1.5 - np.abs(4 * resized - 3), 0, 1)
    green = np.clip(1.5 - np.abs(4 * resized - 2), 0, 1)
    blue = np.clip(1.5 - np.abs(4 * resized - 1), 0, 1)
    colored = np.uint8(np.stack((red, green, blue), axis=-1) * 255)
    # Only activated regions receive heatmap colour. A fixed global alpha made
    # zero-valued JET pixels blue and visually obscured the radiograph.
    alpha = (0.48 * np.power(resized, 0.7))[..., np.newaxis]
    overlay = Image.fromarray(np.uint8(np.clip((1 - alpha) * original_array + alpha * colored, 0, 255)))
    return _data_uri(source), _data_uri(Image.fromarray(colored)), _data_uri(overlay)
