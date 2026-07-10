from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from backend.services.firebase_service import firebase_service
from backend.services.maintenance_service import maintenance_service

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])

@router.get("", response_model=List[Dict[str, Any]])
async def get_maintenance_alerts():
    """
    Get all active equipment maintenance service logs.
    Triggers a diagnostic regression run and reads logs from Firestore.
    """
    try:
        maintenance_service.run_equipment_diagnostics()
        return firebase_service.get_collection("maintenance")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
