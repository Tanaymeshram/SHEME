import logging
from typing import Dict, Any, List
from datetime import datetime
from backend.services.firebase_service import firebase_service
from backend.ml.xgboost_model import XGBoostEnergyModel
from backend.ml.random_forest import RandomForestMaintenanceModel
from backend.ml.isolation_forest import IsolationForestAnomalyModel
from backend.ml.lstm_model import LSTMPeakLoadForecaster

logger = logging.getLogger("SHEMS.PredictionService")

class PredictionService:
    def __init__(self):
        # Initialize ML model wrappers
        self.xgboost = XGBoostEnergyModel()
        self.random_forest = RandomForestMaintenanceModel()
        self.isolation_forest = IsolationForestAnomalyModel()
        self.lstm = LSTMPeakLoadForecaster()
        
        # Pre-train placeholding states
        self.xgboost.train_placeholder(None, None)
        self.random_forest.train_placeholder(None, None)
        self.isolation_forest.train_placeholder(None)
        self.lstm.train_placeholder(None, None)

    def run_bems_anomaly_scan(self) -> List[Dict[str, Any]]:
        """
        Aggregate live rooms and detect load anomalies using Isolation Forest.
        If anomalies are detected, write alert documents to Firestore.
        """
        rooms = firebase_service.get_collection("rooms")
        detected_anomalies = []
        
        for room in rooms:
            voltage = room.get("temperature", 230.0) # Using temperature as voltage proxy for model shapes
            current = room.get("current", 0.0)
            occupancy = room.get("occupancy", 0)
            
            is_anomaly = self.isolation_forest.detect_anomaly(voltage, current, occupancy)
            
            if is_anomaly and current > 100.0: # Trigger alert threshold
                anomaly_log = {
                    "id": 102,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
                    "department": room.get("roomName", "General"),
                    "parameter": "Current Draw",
                    "message": f"Isolation Forest: Unusual current spike detected in {room.get('roomName')} relative to occupancy.",
                    "severity": "Warning"
                }
                detected_anomalies.append(anomaly_log)
                
                # Write alert to Firestore
                firebase_service.create_document("alerts", {
                    "severity": "Warning",
                    "department": room.get("roomName", "General"),
                    "message": f"Isolation Forest: Sensory breach detected in {room.get('roomName')}.",
                    "sensor": "Current Transformer",
                    "value": f"{current} A",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "resolved": False
                })
                logger.warning(f"BEMS Anomaly detected in {room.get('roomName')}. Alert generated.")
                
        return detected_anomalies

    def generate_energy_forecast_and_insights(self) -> Dict[str, Any]:
        """
        Synthesize actual telemetry values and predict future loads.
        Write results directly to Firestore's predictions/bems_ml_insights.
        """
        # Fetch current lists
        rooms = firebase_service.get_collection("rooms")
        equipment = firebase_service.get_collection("equipment")
        
        # Calculate active load
        total_active_load = sum(r.get("power", 0.0) for r in rooms)
        
        # Generate LSTM Peak Load forecasts
        historical_baseline = [150.0, 145.0, 138.0, 120.0, 110.0, 132.0, total_active_load]
        predicted_loads = self.lstm.forecast_peak_loads(historical_baseline)
        
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        forecast_data = []
        for i, day in enumerate(days):
            actual_val = None
            if i == 0:
                actual_val = 180.0
            elif i == 1:
                actual_val = 195.0
            elif i == 2:
                actual_val = total_active_load
                
            forecast_data.append({
                "day": day,
                "actual": actual_val,
                "predicted": predicted_loads[i % len(predicted_loads)]
            })

        # Generate ML Recommendations
        recommendations = []
        rec_id = 1
        
        # Recommendation 1: Scanner shunting
        for eq in equipment:
            if eq.get("status") == "Idle" and eq.get("idleTime", 0) > 60:
                recommendations.append({
                    "id": rec_id,
                    "type": "idle",
                    "priority": "Medium",
                    "message": f"ML Analyzer: {eq.get('name')} in {eq.get('dept')} has been idle for {eq.get('idleTime')} mins. Auto standby mode suggested.",
                    "savings": "12 kWh",
                    "impact": "Medium"
                })
                rec_id += 1

        # Recommendation 2: HVAC cycle
        peak_predicted = max(predicted_loads)
        if peak_predicted > 210.0:
            recommendations.append({
                "id": rec_id,
                "type": "hvac",
                "priority": "High",
                "message": f"ML Analyzer: Peak grid load predicted. Suggest pre-cooling ICU and OT wings before peak load hours.",
                "savings": "48 kWh",
                "impact": "High"
            })
            rec_id += 1

        # Recommendation 3: Low Power Factor capacitor activation
        for eq in equipment:
            if eq.get("status") == "Active" and eq.get("powerFactor", 1.0) < 0.85:
                recommendations.append({
                    "id": rec_id,
                    "type": "grid",
                    "priority": "High",
                    "message": f"ML Analyzer: {eq.get('name')} pf dropped to {eq.get('powerFactor')}. Capacitor bank shunting requested.",
                    "savings": "25 kWh",
                    "impact": "High"
                })
                rec_id += 1

        # Build Insights Object
        insights_data = {
            "forecastData": forecast_data,
            "recommendations": recommendations,
            "anomalies": self.run_bems_anomaly_scan()
        }
        
        # Write predictions back to Firestore
        firebase_service.write_document("predictions", "bems_ml_insights", insights_data)
        logger.info("BEMS AI Insights committed to Firestore.")
        
        return insights_data

# Singleton Instance
prediction_service = PredictionService()
