import logging
from typing import List, Dict, Any
from datetime import datetime
from backend.services.firebase_service import firebase_service
from backend.ml.random_forest_model import random_forest_maintenance_model

logger = logging.getLogger("SHEMS.MaintenanceService")

class MaintenanceService:
    def run_equipment_diagnostics(self) -> List[Dict[str, Any]]:
        """
        Scan all heavy grid equipment, query RandomForest model, and log servicing alerts.
        """
        equipment = firebase_service.get_collection("equipment")
        alerts = []
        
        for eq in equipment:
            power_factor = eq.get("powerFactor", 0.92)
            load = eq.get("load", 0.0)
            
            # Predict degradation
            diag = random_forest_maintenance_model.predict_health(
                power_factor=power_factor,
                temperature=24.5, # default ambient temperature
                age_months=18,    # baseline age
                active_hours=1200.0 # baseline operation hours
            )
            
            health = diag["health_score"]
            rul = diag["rul_days"]
            status = diag["status"]
            
            # Update equipment document
            firebase_service.update_document("equipment", eq["id"], {
                "health": health,
                "estimated_rul_days": rul,
                "maintenance_status": status
            })
            
            # Trigger maintenance alerts if health is below critical bounds
            if health < 75.0:
                maintenance_log = {
                    "id": f"maint_{eq['id']}",
                    "equipment_id": eq["id"],
                    "equipment_name": eq.get("name"),
                    "health_score": health,
                    "estimated_rul_days": rul,
                    "message": f"Predictive Maintenance: {eq.get('name')} health degraded to {health}%. Servicing required within {rul} days.",
                    "status": "Required",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
                alerts.append(maintenance_log)
                
                # Write to maintenance collection in Firestore
                firebase_service.write_document("maintenance", f"maint_{eq['id']}", maintenance_log)
                logger.warning(f"Maintenance alert triggered for {eq.get('name')}.")
                
        return alerts

# Singleton instance
maintenance_service = MaintenanceService()
