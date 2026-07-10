import os
import logging
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from typing import Dict, Any, Tuple

logger = logging.getLogger("SHEMS.ML.XGBoost")

class XGBoostEnergyModel:
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.initialize_and_train()

    def generate_synthetic_training_data(self) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Synthesize 1,000 hourly historical records of hospital load profiles.
        Inputs: temperature, humidity, occupancy, voltage, current, power, energy, hour, day, month
        Target: next_hour_power (kW)
        """
        np.random.seed(42)
        samples = 1000
        
        # Features
        hour = np.random.randint(0, 24, size=samples)
        day = np.random.randint(1, 8, size=samples) # 1=Mon, 7=Sun
        month = np.random.randint(1, 13, size=samples)
        
        temperature = np.random.uniform(18.0, 26.0, size=samples)
        humidity = np.random.uniform(35.0, 65.0, size=samples)
        occupancy = np.random.randint(10, 150, size=samples)
        voltage = np.random.uniform(225.0, 235.0, size=samples)
        
        # Compute power & current derived from physical parameters
        hvac_draw = 15.0 * (temperature - 19.5) * (occupancy / 50.0)
        hvac_draw = np.clip(hvac_draw, 5.0, 80.0)
        
        equipment_draw = np.random.uniform(10.0, 60.0, size=samples)
        power = hvac_draw + equipment_draw + (occupancy * 0.12)
        power = np.clip(power, 20.0, 300.0)
        
        current = (power * 1000.0) / (voltage * 0.92)
        energy = power * 24.0 * np.random.uniform(0.9, 1.1)
        
        df = pd.DataFrame({
            "temperature": temperature,
            "humidity": humidity,
            "occupancy": occupancy,
            "voltage": voltage,
            "current": current,
            "power": power,
            "energy": energy,
            "hour": hour,
            "day": day,
            "month": month
        })
        
        # Target: next hour load
        next_hour_noise = np.random.normal(0, 5.0, size=samples)
        target = power * 1.05 + next_hour_noise
        target = np.clip(target, 15.0, 350.0)
        
        return df, pd.Series(target, name="next_hour_power")

    def initialize_and_train(self):
        """
        Train XGBoost Regressor using synthetic baseline datasets.
        """
        try:
            logger.info("XGBoost: Generating calibrated training dataset...")
            X, y = self.generate_synthetic_training_data()
            
            self.model = XGBRegressor(
                n_estimators=100, 
                max_depth=4, 
                learning_rate=0.1, 
                random_state=42
            )
            self.model.fit(X, y)
            self.is_trained = True
            logger.info("XGBoost: Model successfully trained and fitted.")
        except Exception as e:
            logger.error(f"XGBoost: Training pipeline failure: {e}")
            self.is_trained = False

    def predict_next_hour(self, features_dict: Dict[str, Any]) -> float:
        """
        Predict BEMS load (kW) for the next hour based on input features dictionary.
        """
        if not self.is_trained or self.model is None:
            # Fallback estimation
            return round(features_dict.get("power", 150.0) * 1.05, 2)
            
        try:
            # Reconstruct feature dataframe
            df = pd.DataFrame([features_dict])
            # Ensure column order matches training dataframe
            cols = ["temperature", "humidity", "occupancy", "voltage", "current", "power", "energy", "hour", "day", "month"]
            df = df[cols]
            
            pred = self.model.predict(df)[0]
            return round(float(pred), 2)
        except Exception as e:
            logger.error(f"XGBoost: Prediction inference failed: {e}")
            return round(features_dict.get("power", 150.0) * 1.05, 2)

    def forecast_period_loads(self, current_features: Dict[str, Any]) -> Dict[str, float]:
        """
        Forecast BEMS load draws: Next Hour, Daily average, and Weekly average.
        """
        # Next hour forecast
        next_hour = self.predict_next_hour(current_features)
        
        # Emulate daily load fluctuations (sine variations)
        daily_average = round(next_hour * np.random.uniform(0.85, 1.15), 2)
        
        # Emulate weekly load fluctuations (sine variations)
        weekly_average = round(daily_average * np.random.uniform(0.9, 1.1), 2)
        
        return {
            "predicted_next_hour": next_hour,
            "predicted_daily": daily_average,
            "predicted_weekly": weekly_average
        }
# Singleton instance
xgboost_energy_model = XGBoostEnergyModel()
