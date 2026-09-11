from fastapi import APIRouter

from app.ml.constants import LABELS

router = APIRouter(tags=["model"])


@router.get("/classes")
def classes() -> dict[str, list[str]]:
    """The exact, notebook-defined output order."""
    return {"classes": list(LABELS)}
