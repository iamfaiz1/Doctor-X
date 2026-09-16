"""Grounded Gemini explanation service. It never performs image diagnosis."""
from __future__ import annotations
import json
from typing import Any

from app.core.config import Settings


class GeminiUnavailableError(RuntimeError):
    pass


SAFETY_RULES = """You are explaining structured output from a chest X-ray AI research model. Never diagnose an image,
invent findings, add diseases, alter probabilities, claim certainty, prescribe treatment, or replace clinical evaluation.
Clearly call this an AI prediction, distinguish it from a clinical diagnosis, and say Grad-CAM is attribution rather than proof."""


class GeminiService:
    def __init__(self, settings: Settings) -> None:
        self._key, self._model = settings.gemini_api_key, settings.gemini_model

    @property
    def available(self) -> bool:
        return bool(self._key)

    def explain(self, context: dict[str, Any], stage: str, question: str | None = None) -> dict[str, str]:
        if not self._key:
            raise GeminiUnavailableError("Explanation service is not configured.")
        prompt = f"{SAFETY_RULES}\nStage: {stage}\nModel output JSON: {json.dumps(context)}\n"
        if question:
            prompt += f"User question: {question}\n"
        prompt += 'Return only JSON: {"medical_explanation":"...","simple_explanation":"..."}.'
        try:
            from google import genai  # installed only when Gemini support is enabled
            client = genai.Client(api_key=self._key)
            response = client.models.generate_content(model=self._model, contents=prompt)
            data = json.loads(response.text)
            if not all(isinstance(data.get(k), str) and data[k].strip() for k in ("medical_explanation", "simple_explanation")):
                raise ValueError("Malformed explanation response")
            return {k: data[k].strip() for k in ("medical_explanation", "simple_explanation")}
        except GeminiUnavailableError:
            raise
        except Exception as exc:
            raise GeminiUnavailableError("Explanation service is temporarily unavailable.") from exc
