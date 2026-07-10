from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from backend.services.firebase_service import firebase_service
from backend.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.get("", response_model=List[Dict[str, Any]])
async def get_recommendations():
    """
    Get active smart comfort recommendations.
    Updates the rules engine and returns the compiled logs from Firestore.
    """
    try:
        recommendation_service.evaluate_grid_recommendations()
        return firebase_service.get_collection("recommendations")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
