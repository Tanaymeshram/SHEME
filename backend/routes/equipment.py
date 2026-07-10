from fastapi import APIRouter, HTTPException, Path, Body
from typing import List, Dict, Any
from backend.services.firebase_service import firebase_service

router = APIRouter(prefix="/api/equipment", tags=["Equipment"])

@router.get("", response_model=List[Dict[str, Any]])
async def get_equipment():
    """
    Retrieve hospital medical scanners and heavy loads status.
    """
    try:
        return firebase_service.get_collection("equipment")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{eq_id}/status")
async def update_equipment_status(
    eq_id: str = Path(..., description="Unique equipment tag ID"),
    status: str = Body(..., embed=True, description="Target status: Active, Idle, Off")
):
    """
    Toggle power states of medical scanners to manage grid load.
    """
    try:
        # Update simulation variables
        updates = {"status": status}
        if status == 'Active':
            updates["load"] = 45.0 if eq_id == 'eq-1' else (32.0 if eq_id == 'eq-2' else 1.2)
            updates["idleTime"] = 0
        elif status == 'Idle':
            updates["load"] = 0.8
        else:
            updates["load"] = 0.0

        firebase_service.update_document("equipment", eq_id, updates)
        updated_eq = firebase_service.get_document("equipment", eq_id)
        return {"success": True, "eq": updated_eq}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update equipment state: {str(e)}")
