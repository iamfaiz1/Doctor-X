from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_analysis_store, get_gemini_service
from app.schemas.prediction import ChatRequest
from app.services.gemini_service import GeminiUnavailableError

router = APIRouter(tags=["chat"])

@router.post("/chat")
def chat(request: ChatRequest, store=Depends(get_analysis_store), gemini=Depends(get_gemini_service)):
    context = store.get(request.analysis_id)
    if not context:
        raise HTTPException(404, "Analysis not found.")
    try:
        response = gemini.explain(context, "chat", request.message)
        return {"session_id": request.session_id, "analysis_id": request.analysis_id, "status": "available", **response}
    except GeminiUnavailableError as exc:
        return {"session_id": request.session_id, "analysis_id": request.analysis_id, "status": "unavailable", "detail": str(exc)}
