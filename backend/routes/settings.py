from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from backend.services.firebase_service import firebase_service

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=Dict[str, Any])
async def get_settings():
    """
    Retrieve global BEMS threshold variables from Firestore settings.
    """
    try:
        config = firebase_service.get_document("settings", "global_bems_config")
        if not config:
            # Fallback placeholder if not seeded
            config = {
                "hvacTempMin": 18.0,
                "hvacTempMax": 26.0,
                "co2Threshold": 800,
                "voltageTolerance": 10.0,
                "currentThreshold": 150.0,
                "loadSheddingMode": "Manual",
                "notificationsEnabled": True
            }
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def update_settings(
    settings_data: Dict[str, Any] = Body(...)
):
    """
    Update BEMS set points (HVAC limits, alert parameters) in Firestore.
    """
    try:
        firebase_service.write_document("settings", "global_bems_config", settings_data)
        updated_settings = firebase_service.get_document("settings", "global_bems_config")
        return {"success": True, "settings": updated_settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")
