import logging
from typing import List, Dict, Any
from datetime import datetime
from backend.services.firebase_service import firebase_service

logger = logging.getLogger("SHEMS.RecommendationService")

class RecommendationService:
    def evaluate_grid_recommendations(self) -> List[Dict[str, Any]]:
        """
        Scan Firestore collections (rooms, equipment, settings) and compile suggestions.
        Writes logs back to the 'recommendations' collection.
        """
        rooms = firebase_service.get_collection("rooms")
        equipment = firebase_service.get_collection("equipment")
        settings = firebase_service.get_document("settings", "global_bems_config") or {}
        
        recommendations = []
        rec_id = 1
        
        # Rule 1: AC/HVAC in empty rooms
        for room in rooms:
            if room.get("occupancy", 0) == 0 and (room.get("hvac") or room.get("cooling")):
                recommendations.append({
                    "id": rec_id,
                    "type": "hvac",
                    "priority": "High",
                    "message": f"AI Recommendation: Turn OFF HVAC cooling in empty wing ({room.get('roomName')}). Estimated savings: 15 kWh.",
                    "savings": "15 kWh",
                    "impact": "High",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
                rec_id += 1

        # Rule 2: Active scanners with low power factors
        for eq in equipment:
            pf = eq.get("powerFactor", 1.0)
            if eq.get("status") == "Active" and pf < 0.85:
                recommendations.append({
                    "id": rec_id,
                    "type": "grid",
                    "priority": "High",
                    "message": f"AI Recommendation: Low Power Factor ({pf}) detected on {eq.get('name')}. Capacitors adjustment required.",
                    "savings": "22 kWh",
                    "impact": "High",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
                rec_id += 1

        # Rule 3: Scanners left idle
        for eq in equipment:
            idle_time = eq.get("idleTime", 0)
            if eq.get("status") == "Idle" and idle_time > 60:
                recommendations.append({
                    "id": rec_id,
                    "type": "idle",
                    "priority": "Medium",
                    "message": f"AI Recommendation: {eq.get('name')} in {eq.get('dept')} idle for {idle_time} mins. Transition to Stand-by suggested.",
                    "savings": "8 kWh",
                    "impact": "Medium",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
                rec_id += 1

        # Rule 4: Wards ambient temperature bounds
        co2_limit = settings.get("co2Threshold", 800)
        for room in rooms:
            co2 = room.get("co2", 400)
            if co2 > co2_limit:
                recommendations.append({
                    "id": rec_id,
                    "type": "hvac",
                    "priority": "Medium",
                    "message": f"AI Recommendation: CO2 levels ({co2} ppm) in {room.get('roomName')} exceed set limit. Increase air cycle ventilation.",
                    "savings": "0 kWh",
                    "impact": "Medium",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
                rec_id += 1

        # Commit to Firestore 'recommendations' collection
        for rec in recommendations:
            doc_id = f"rec_{rec['id']}"
            firebase_service.write_document("recommendations", doc_id, rec)
            
        logger.info(f"BEMS Recommendations compiled. Committed {len(recommendations)} suggestion logs.")
        return recommendations

# Singleton instance
recommendation_service = RecommendationService()
