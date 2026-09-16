from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.api.dependencies import get_analysis_store, get_gemini_service, get_report_service
from app.services.gemini_service import GeminiUnavailableError

router = APIRouter(tags=["reports"])

class ReportRequest(BaseModel):
    analysis_id: str

@router.post("/reports")
def create_report(request: ReportRequest, store=Depends(get_analysis_store), reports=Depends(get_report_service), gemini=Depends(get_gemini_service)):
    analysis = store.get(request.analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found.")
    try:
        try:
            narrative = gemini.explain(analysis, "report")
        except GeminiUnavailableError:
            narrative = None
        return {"report_id": reports.create(analysis, narrative), "analysis_id": request.analysis_id,
                "explanation_status": "available" if narrative else "unavailable"}
    except Exception as exc:
        raise HTTPException(503, "Report generation failed.") from exc

@router.get("/reports/{report_id}")
def download_report(report_id: str, reports=Depends(get_report_service)):
    path = reports.path(report_id)
    if not path.is_file():
        raise HTTPException(404, "Report not found.")
    return FileResponse(path, media_type="application/pdf", filename=f"doctor-x-{report_id}.pdf")
