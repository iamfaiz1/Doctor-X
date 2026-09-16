"""Application configuration, sourced from environment variables."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


# config.py lives at backend/app/core/config.py.
PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _as_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    model_path: Path
    device: str
    max_upload_bytes: int
    require_model_on_startup: bool
    allowed_origins: tuple[str, ...]
    gemini_api_key: str | None
    gemini_model: str
    report_directory: Path

    @classmethod
    def from_environment(cls) -> "Settings":
        configured_path = os.getenv("MODEL_PATH", "models/densenet121_chexpert.pth")
        model_path = Path(configured_path)
        if not model_path.is_absolute():
            model_path = PROJECT_ROOT / model_path
        origins = tuple(
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
            if origin.strip()
        )
        return cls(
            model_path=model_path,
            device=os.getenv("MODEL_DEVICE", "auto").lower(),
            max_upload_bytes=int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024))),
            require_model_on_startup=_as_bool(os.getenv("REQUIRE_MODEL_ON_STARTUP", "true")),
            allowed_origins=origins,
            gemini_api_key=os.getenv("GEMINI_API_KEY") or None,
            gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            report_directory=PROJECT_ROOT / os.getenv("REPORT_DIRECTORY", "generated_reports"),
        )


settings = Settings.from_environment()
