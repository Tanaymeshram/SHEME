from fastapi import APIRouter, HTTPException, Path
from typing import List, Dict, Any
from backend.services.firebase_service import firebase_service

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[Dict[str, Any]])
async def get_alerts():
    """
    Get all active and historically resolved sensory breaches.
    """
    try:
        return firebase_service.get_collection("alerts")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str = Path(..., description="Unique ID of the alarm to acknowledge")
):
    """
    Mark an active sensor alert as resolved.
    """
    try:
        firebase_service.update_document("alerts", alert_id, {"resolved": True})
        return {"success": True, "message": f"Alert {alert_id} marked as acknowledged."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve alert: {str(e)}")
