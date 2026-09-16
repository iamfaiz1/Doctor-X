"""Short-lived in-memory analysis context. No uploads are persisted here."""
from __future__ import annotations
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4


class AnalysisStore:
    def __init__(self) -> None:
        self._items: dict[str, dict[str, object]] = {}
        self._lock = Lock()

    def put(self, result: dict[str, object]) -> dict[str, object]:
        item = {**result, "analysis_id": str(uuid4()), "created_at": datetime.now(timezone.utc).isoformat()}
        with self._lock:
            self._items[item["analysis_id"]] = item
        return item

    def get(self, analysis_id: str) -> dict[str, object] | None:
        with self._lock:
            return self._items.get(analysis_id)
