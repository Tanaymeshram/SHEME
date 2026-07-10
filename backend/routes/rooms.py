from fastapi import APIRouter, HTTPException, Path
from typing import List, Dict, Any
from backend.services.firebase_service import firebase_service
from backend.models.room import RoomControlRequest

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])

@router.get("", response_model=List[Dict[str, Any]])
async def get_rooms():
    """
    Retrieve all hospital rooms and environmental sensor details.
    """
    try:
        return firebase_service.get_collection("rooms")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{room_id}/control")
async def update_room_control(
    request: RoomControlRequest,
    room_id: str = Path(..., description="The unique identifier of the hospital room")
):
    """
    Override climate, heating, or lighting switches inside a hospital wing.
    """
    try:
        # Map frontend control requests to Firestore fields:
        # cooling -> hvac, heating -> fan, lighting -> light
        control_map = {
            "cooling": "hvac",
            "heating": "fan",
            "lighting": "light"
        }
        
        control_type = request.type
        db_field = control_map.get(control_type, control_type)
        
        firebase_service.update_document("rooms", room_id, {
            db_field: request.value
        })
        return {"success": True, "message": f"Room {room_id} parameter '{control_type}' updated to {request.value}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply control override: {str(e)}")
