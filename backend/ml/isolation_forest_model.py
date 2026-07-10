import os
import logging
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, Tuple

logger = logging.getLogger("SHEMS.ML.IsolationForest")

class IsolationForestAnomalyModel:
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.initialize_and_train()

    def generate_baseline_dataset(self) -> pd.DataFrame:
        """
        Generate normal BEMS parameters baseline to fit the Isolation Forest.
        Features: voltage, current, occupancy, power
        """
        np.random.seed(42)
        samples = 800
        
        voltage = np.random.uniform(220.0, 240.0, size=samples)
        occupancy = np.random.randint(5, 100, size=samples)
        
        # Normal current draw correlates with occupancy
        current = (occupancy * 0.8) + np.random.normal(0, 2.0, size=samples)
        current = np.clip(current, 1.0, 120.0)
        
        power = (voltage * current * 0.92) / 1000.0
        
        return pd.DataFrame({
            "voltage": voltage,
            "current": current,
            "occupancy": occupancy,
            "power": power
        })

    def initialize_and_train(self):
        try:
            logger.info("IsolationForest: Preparing baseline normal metrics...")
            df = self.generate_baseline_dataset()
            
            self.model = IsolationForest(
                contamination=0.03, # 3% anomaly threshold
                random_state=42
            )
            self.model.fit(df)
            self.is_trained = True
            logger.info("IsolationForest: Model trained successfully.")
        except Exception as e:
            logger.error(f"IsolationForest: Fitting failure: {e}")
            self.is_trained = False

    def detect_leak(self, voltage: float, current: float, occupancy: int, power: float) -> Dict[str, Any]:
        """
        Runs anomaly detection. Returns whether an outlier was identified, with details.
        """
        if not self.is_trained or self.model is None:
            # Fallback limit check
            is_anomaly = current > 160.0 or voltage > 245.0 or voltage < 210.0 or (occupancy == 0 and current > 20.0)
            return {
                "is_anomaly": is_anomaly,
                "score": -0.15 if is_anomaly else 0.12,
                "message": "Limit checks: Voltage or current spikes flagged." if is_anomaly else "Nominal status"
            }
            
        try:
            features = pd.DataFrame([{
                "voltage": voltage,
                "current": current,
                "occupancy": occupancy,
                "power": power
            }])
            
            # Predict outlier: 1 = normal, -1 = anomaly
            pred = self.model.predict(features)[0]
            score = self.model.score_samples(features)[0]
            
            is_anomaly = (pred == -1)
            msg = "Nominal status"
            if is_anomaly:
                if occupancy == 0 and current > 15.0:
                    msg = "Energy Leakage: High current draw detected in empty wing."
                elif voltage > 243.0 or voltage < 212.0:
                    msg = "Sensor Glitch: Grid voltage levels exceeding standard tolerances."
                else:
                    msg = "Abnormal Draw: High active power relative to local occupancy."

            return {
                "is_anomaly": is_anomaly,
                "score": float(score),
                "message": msg
            }
        except Exception as e:
            logger.error(f"IsolationForest: Inference scan error: {e}")
            return {"is_anomaly": False, "score": 0.0, "message": "Nominal status"}

# Singleton instance
isolation_forest_anomaly_model = IsolationForestAnomalyModel()
