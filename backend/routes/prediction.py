from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List
from backend.services.firebase_service import firebase_service
from backend.services.prediction_service import prediction_service
from backend.ml.xgboost_model import xgboost_energy_model

router = APIRouter(prefix="/api/prediction", tags=["AI Engine"])

@router.get("/insights", response_model=Dict[str, Any])
async def get_prediction_insights():
    """
    Get the compiled ML insights (forecastData, recommendations, anomalies, xgb_kpis) from Firestore.
    """
    try:
        insights = firebase_service.get_document("predictions", "bems_ml_insights")
        if not insights:
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

@router.post("/predict", response_model=Dict[str, Any])
async def post_custom_prediction(
    features: Dict[str, Any] = Body(
        ...,
        example={
            "temperature": 22.5,
            "humidity": 45.0,
            "occupancy": 80,
            "voltage": 230.2,
            "current": 120.4,
            "power": 25.5,
            "energy": 380.0,
            "hour": 14,
            "day": 4,
            "month": 7
        }
    )
):
    """
    Predict next hour power load using XGBoost Regressor based on custom parameters payload.
    """
    try:
        predicted = xgboost_energy_model.predict_next_hour(features)
        forecasts = xgboost_energy_model.forecast_period_loads(features)
        return {
            "success": True,
            "predicted_load_kw": predicted,
            "forecast_estimates": forecasts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"XGBoost custom inference error: {str(e)}")

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
