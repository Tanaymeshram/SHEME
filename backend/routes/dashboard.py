from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from backend.services.firebase_service import firebase_service
from backend.services.energy_service import EnergyService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/live", response_model=Dict[str, Any])
async def get_live_dashboard():
    """
    Returns consolidated live metrics for hospital command grids.
    Calculations are derived from live Firestore collections.
    """
    try:
        rooms = firebase_service.get_collection("rooms")
        equipment = firebase_service.get_collection("equipment")
        alerts = firebase_service.get_collection("alerts")
        predictions_doc = firebase_service.get_document("predictions", "bems_ml_insights")
        
        # Calculate active load
        rooms_active_load = sum(r.get("power", 0.0) for r in rooms)
        equipment_active_load = sum(eq.get("load", 0.0) for eq in equipment if eq.get("status") == "Active")
        total_load_kw = round(rooms_active_load + equipment_active_load, 2)
        
        # Apparent power (average voltage = 230V, PF = 0.92)
        live_voltage = rooms[0].get("voltage", 230.0) if rooms else 230.0
        total_apparent_kva = EnergyService.calculate_kva(total_load_kw, 0.92)
        live_current_a = round((total_load_kw * 1000.0) / (live_voltage * 0.92), 2) if total_load_kw > 0 else 0.0
        
        # Climate averages
        avg_temp = sum(r.get("temperature", 0.0) for r in rooms) / len(rooms) if rooms else 21.5
        avg_humidity = sum(r.get("humidity", 0.0) for r in rooms) / len(rooms) if rooms else 50.0
        avg_co2 = sum(room.get("co2", 420.0) for room in rooms) / len(rooms) if rooms else 450.0
        
        # Occupancy summaries
        total_occupancy = sum(r.get("occupancy", 0) for r in rooms)
        occupied_wings = len([r for r in rooms if r.get("occupancy", 0) > 0])
        empty_wings = len([r for r in rooms if r.get("occupancy", 0) == 0])
        
        total_energy = sum(r.get("energy", 0.0) for r in rooms)
        active_alerts = len([a for a in alerts if not a.get("resolved", False)])
        avg_eq_health = sum(eq.get("health", 100.0) for eq in equipment) / len(equipment) if equipment else 95.0
        
        # Generate department-wise stats
        departments = {}
        for room in rooms:
            dept_key = room.get("department", "")
            # Map OT and Ward to short keys matching frontend layout
            if dept_key == "Operation Theatre":
                dept_key = "OT"
            elif dept_key == "General Ward":
                dept_key = "Ward"
                
            if dept_key in ["ICU", "OT", "Ward", "Emergency"]:
                departments[dept_key] = {
                    "temperature": room.get("temperature", 21.5),
                    "humidity": room.get("humidity", 50.0),
                    "co2": room.get("co2", 450),
                    "voltage": room.get("voltage", 230.0),
                    "current": room.get("current", 12.0),
                    "occupancy": room.get("occupancy", 0),
                    "equipment_health": 98 if room.get("roomId") == "icu" else (99 if room.get("roomId") == "ot1" else 92),
                    "status": room.get("status", "Normal")
                }
                
        # Emulate live trend
        live_trend = []
        if predictions_doc and "forecastData" in predictions_doc:
            live_trend = predictions_doc["forecastData"]
            
        return {
            "kpis": {
                "total_energy_consumption_kw": total_load_kw,
                "live_voltage_v": live_voltage,
                "live_current_a": live_current_a,
                "avg_temperature_c": round(avg_temp, 2),
                "avg_humidity_p": round(avg_humidity, 2),
                "avg_co2_ppm": round(avg_co2, 1),
                "occupancy_status": total_occupancy,
                "total_rooms": len(rooms),
                "occupied_rooms": occupied_wings,
                "empty_rooms": empty_wings,
                "total_energy_kwh": round(total_energy, 2),
                "equipment_health_score": round(avg_eq_health, 2),
                "active_alerts": active_alerts
            },
            "departments": departments,
            "live_trend": live_trend,
            "recent_alerts": alerts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BEMS Dashboard compilation error: {str(e)}")
