import os
import logging
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from typing import Dict, Any, Tuple

logger = logging.getLogger("SHEMS.ML.RandomForest")

class RandomForestMaintenanceModel:
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.initialize_and_train()

    def generate_degradation_dataset(self) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Synthesize historical maintenance logs.
        Features: power_factor, temperature, age_months, active_hours
        Target: health_score (0 - 100)
        """
        np.random.seed(42)
        samples = 600
        
        power_factor = np.random.uniform(0.70, 0.98, size=samples)
        temperature = np.random.uniform(18.0, 35.0, size=samples) # Equipment ambient temperature
        age_months = np.random.randint(1, 60, size=samples)
        active_hours = age_months * np.random.uniform(100.0, 300.0, size=samples)
        
        # Base health decreases with age and runtime
        health_score = 100.0 - (age_months * 0.4) - (active_hours * 0.001)
        
        # Penalize poor power factor (motor load issues) and overheating
        health_score -= np.maximum(0.0, 0.90 - power_factor) * 45.0
        health_score -= np.maximum(0.0, temperature - 25.0) * 1.5
        
        # Add random degradation variance
        health_score += np.random.normal(0, 2.0, size=samples)
        health_score = np.clip(health_score, 10.0, 100.0)
        
        df = pd.DataFrame({
            "power_factor": power_factor,
            "temperature": temperature,
            "age_months": age_months,
            "active_hours": active_hours
        })
        
        return df, pd.Series(health_score, name="health_score")

    def initialize_and_train(self):
        try:
            logger.info("RandomForest: Preparing degradation telemetry data...")
            X, y = self.generate_degradation_dataset()
            
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=5,
                random_state=42
            )
            self.model.fit(X, y)
            self.is_trained = True
            logger.info("RandomForest: Predictive Maintenance model successfully trained.")
        except Exception as e:
            logger.error(f"RandomForest: Training failure: {e}")
            self.is_trained = False

    def predict_health(self, power_factor: float, temperature: float, age_months: int, active_hours: float) -> Dict[str, Any]:
        """
        Predict residual health percentage and remaining useful life (days).
        """
        if not self.is_trained or self.model is None:
            # Fallback degradation formula
            health = 100.0 - (age_months * 0.5) - (active_hours * 0.002)
            health = max(5.0, min(100.0, health))
            return {
                "health_score": round(health, 1),
                "rul_days": int(health * 3.2),
                "status": "Optimal" if health > 85 else ("Servicing Required" if health < 70 else "Check Filters")
            }
            
        try:
            features = pd.DataFrame([{
                "power_factor": power_factor,
                "temperature": temperature,
                "age_months": age_months,
                "active_hours": active_hours
            }])
            
            health = self.model.predict(features)[0]
            health = max(5.0, min(100.0, round(float(health), 1)))
            
            # Estimate Remaining Useful Life (RUL) days
            rul_days = int(health * 3.5) if health > 90 else (int(health * 2.8) if health > 75 else int(health * 1.5))
            
            # Map status
            status = "Optimal"
            if health < 70:
                status = "Critical Repair Recommended"
            elif health < 85:
                status = "Schedule Maintenance check"
                
            return {
                "health_score": health,
                "rul_days": rul_days,
                "status": status
            }
        except Exception as e:
            logger.error(f"RandomForest: Health prediction inference failed: {e}")
            return {"health_score": 90.0, "rul_days": 270, "status": "Optimal"}

# Singleton instance
random_forest_maintenance_model = RandomForestMaintenanceModel()
