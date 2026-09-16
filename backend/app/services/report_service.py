from __future__ import annotations
from pathlib import Path
from uuid import uuid4
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen.canvas import Canvas


class ReportService:
    def __init__(self, directory: Path) -> None:
        self._directory = directory

    def create(self, analysis: dict[str, object], narrative: dict[str, str] | None = None) -> str:
        self._directory.mkdir(parents=True, exist_ok=True)
        report_id = str(uuid4())
        path = self._directory / f"{report_id}.pdf"
        pdf = Canvas(str(path), pagesize=A4)
        y = 800
        for line in ["Doctor-X | AI-generated research output", f"Analysis: {analysis['analysis_id']}",
                     f"Model: {analysis['model']} ({analysis['model_version']})", "Predictions:"]:
            pdf.drawString(48, y, line); y -= 22
        for prediction in analysis.get("predictions", []):
            pdf.drawString(64, y, f"{prediction['label']}: {prediction['probability']:.3f}"); y -= 16
        if narrative:
            pdf.drawString(48, max(y - 10, 90), "AI explanation:")
            pdf.drawString(64, max(y - 28, 72), narrative["simple_explanation"][:150])
        pdf.drawString(48, max(y - 20, 60), "Not a clinical radiology report. Seek qualified clinical evaluation.")
        pdf.save()
        return report_id

    def path(self, report_id: str) -> Path:
        return self._directory / f"{report_id}.pdf"
