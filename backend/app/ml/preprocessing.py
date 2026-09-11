"""Notebook-faithful image decoding and inference preprocessing."""
from __future__ import annotations

import io

import torch
from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError
from torchvision import transforms

from app.ml.constants import IMAGE_SIZE, NORMALIZATION_MEAN, NORMALIZATION_STD

INFERENCE_TRANSFORM = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=NORMALIZATION_MEAN, std=NORMALIZATION_STD),
])


def decode_image(payload: bytes) -> Image.Image:
    if not payload:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    try:
        with Image.open(io.BytesIO(payload)) as source:
            source.verify()
        with Image.open(io.BytesIO(payload)) as source:
            return source.convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=415, detail="Upload a valid PNG, JPEG, or supported image file.") from exc


def preprocess(image: Image.Image) -> torch.Tensor:
    """Resize directly to 320x320, convert RGB, tensorize, then ImageNet-normalize."""
    return INFERENCE_TRANSFORM(image.convert("RGB")).unsqueeze(0)
