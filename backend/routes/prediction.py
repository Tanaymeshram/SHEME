from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from backend.services.firebase_service import firebase_service
from backend.services.prediction_service import prediction_service

router = APIRouter(prefix="/api/prediction", tags=["AI Engine"])

@router.get("/insights", response_model=Dict[str, Any])
async def get_prediction_insights():
    """
    Get the compiled ML insights (forecastData, recommendations, anomalies) from Firestore.
    """
    try:
        insights = firebase_service.get_document("predictions", "bems_ml_insights")
        if not insights:
            # Trigger build if not present
            insights = prediction_service.generate_energy_forecast_and_insights()
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch ML insights: {str(e)}")

@router.post("/forecast", response_model=Dict[str, Any])
async def trigger_forecast():
    """
    Trigger the LSTM regression model to forecast BEMS peak loads and write to Firestore.
    """
    try:
        insights = prediction_service.generate_energy_forecast_and_insights()
        return {"success": True, "message": "Peak Load LSTM model inferred successfully.", "insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@router.post("/anomaly-scan", response_model=List[Dict[str, Any]])
async def trigger_anomaly_scan():
    """
    Execute Isolation Forest scans across rooms to identify voltage and current leaks.
    """
    try:
        anomalies = prediction_service.run_bems_anomaly_scan()
        return anomalies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly scan failure: {str(e)}")

@router.post("/maintenance-check")
async def trigger_maintenance_check():
    """
    Execute Random Forest regressions to estimate remaining useful life (RUL) of scanner equipment.
    """
    try:
        equipment = firebase_service.get_collection("equipment")
        check_logs = []
        for eq in equipment:
            power_factor = eq.get("powerFactor", 0.92)
            load = eq.get("load", 0.0)
            age = 18  # default age emulated
            hours = 1200.0  # default hours emulated
            
            # Predict
            health = prediction_service.random_forest.estimate_health_score(power_factor, load * 0.15, age, hours)
            rul = prediction_service.random_forest.estimate_remaining_useful_life_days(health)
            
            # Update Firestore
            firebase_service.update_document("equipment", eq["id"], {
                "health": health,
                "idleTime": eq.get("idleTime", 0) + 1 # Increment time for logs
            })
            
            check_logs.append({
                "id": eq["id"],
                "name": eq.get("name"),
                "health": health,
                "estimated_rul_days": rul
            })
            
        return {"success": True, "equipment_diagnostics": check_logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Predictive maintenance check failed: {str(e)}")
