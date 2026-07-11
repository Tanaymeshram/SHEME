import os
import json
import logging
from typing import List, Dict, Any, Optional
import firebase_admin
from firebase_admin import credentials, firestore
from backend.config.settings import settings

logger = logging.getLogger("SHEMS.FirebaseService")

class FirebaseService:
    def __init__(self):
        self.db = None
        self.real_firebase = False
        self.local_db: Dict[str, Any] = {
            "rooms": {},
            "alerts": {},
            "predictions": {},
            "equipment": {},
            "settings": {},
            "recommendations": {},
            "maintenance": {}
        }
        self.initialize_firebase()
        self.seed_local_db_templates()

    def initialize_firebase(self):
        # Auto-detect default firebase-key.json in the backend/ directory
        backend_dir = os.path.dirname(os.path.dirname(__file__))
        default_path = os.path.join(backend_dir, "firebase-key.json")
        
        cred_path = settings.FIREBASE_CREDENTIALS_PATH or default_path
        
        if cred_path and os.path.exists(cred_path):
            try:
                # Avoid re-initialization if app already initialized
                if not firebase_admin._apps:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                self.real_firebase = True
                logger.info("[FirebaseService] Connected to Cloud Firestore successfully.")
            except Exception as e:
                logger.error(f"[FirebaseService] Connection error: {e}. Falling back to in-memory mode.")
                self.real_firebase = False
        else:
            logger.info("[FirebaseService] No credentials file found. Auto-activating local in-memory BEMS sandbox.")
            self.real_firebase = False

    # Seed in-memory structures to mimic Firestore documents for standalone execution
    def seed_local_db_templates(self):
        # 1. Rooms
        self.local_db["rooms"] = {
            "icu": { "roomId": "icu", "roomName": "ICU Wing B", "department": "ICU", "temperature": 21.5, "humidity": 48.0, "voltage": 230.2, "current": 150.0, "power": 34.5, "energy": 412.0, "occupancy": 12, "status": "Normal", "hvac": True, "light": True, "fan": False, "equipmentStatus": "Stable" },
            "ot1": { "roomId": "ot1", "roomName": "Operation Theatre 1", "department": "Operation Theatre", "temperature": 18.0, "humidity": 55.0, "voltage": 229.8, "current": 209.5, "power": 48.2, "energy": 620.0, "occupancy": 6, "status": "Normal", "hvac": True, "light": True, "fan": False, "equipmentStatus": "Optimal" },
            "emerg": { "roomId": "emerg", "roomName": "Emergency ER", "department": "Emergency", "temperature": 22.0, "humidity": 50.0, "voltage": 228.5, "current": 122.1, "power": 28.1, "energy": 380.0, "occupancy": 24, "status": "Warning", "hvac": True, "light": True, "fan": False, "equipmentStatus": "Check Sensors" },
            "lab": { "roomId": "lab", "roomName": "Central Lab", "department": "Laboratory", "temperature": 20.2, "humidity": 45.0, "voltage": 230.1, "current": 81.3, "power": 18.7, "energy": 240.0, "occupancy": 8, "status": "Normal", "hvac": True, "light": True, "fan": False, "equipmentStatus": "Stable" },
            "pharm": { "roomId": "pharm", "roomName": "Pharmacy Store", "department": "Pharmacy", "temperature": 4.5, "humidity": 40.0, "voltage": 230.0, "current": 53.9, "power": 12.4, "energy": 180.0, "occupancy": 2, "status": "Normal", "hvac": True, "light": True, "fan": False, "equipmentStatus": "Stable" },
            "ward-a": { "roomId": "ward-a", "roomName": "General Ward A", "department": "General Ward", "temperature": 23.1, "humidity": 52.0, "voltage": 231.2, "current": 66.0, "power": 15.2, "energy": 215.0, "occupancy": 18, "status": "Normal", "hvac": False, "light": True, "fan": True, "equipmentStatus": "Stable" }
        }
        
        # 2. Settings
        self.local_db["settings"]["global_bems_config"] = {
            "hvacTempMin": 18.0,
            "hvacTempMax": 26.0,
            "co2Threshold": 800,
            "voltageTolerance": 10.0,
            "currentThreshold": 150.0,
            "loadSheddingMode": "Manual",
            "notificationsEnabled": True
        }

        # 3. Equipment
        self.local_db["equipment"] = {
            "eq-1": { "id": "eq-1", "name": "Siemens Magnetom MRI", "dept": "Radiology", "load": 45.0, "status": "Active", "idleTime": 12, "health": 96, "powerFactor": 0.94 },
            "eq-2": { "id": "eq-2", "name": "GE Revolution CT Scanner", "dept": "Radiology", "load": 0.8, "status": "Idle", "idleTime": 145, "health": 88, "powerFactor": 0.72 },
            "eq-3": { "id": "eq-3", "name": "Hamilton C6 Ventilator", "dept": "ICU Wing B", "load": 1.2, "status": "Active", "idleTime": 0, "health": 99, "powerFactor": 0.96 },
            "eq-4": { "id": "eq-4", "name": "Varian Halcyon Linear Accelerator", "dept": "Oncology", "load": 0.2, "status": "Off", "idleTime": 480, "health": 91, "powerFactor": 0.0 }
        }

        # 4. Alerts
        self.local_db["alerts"] = {
            "alert_1": { "id": "alert_1", "severity": "Critical", "department": "ICU Wing B", "message": "Power spike: voltage exceeded safety limit of 245V.", "sensor": "Voltage Transducer", "value": "248.2 V", "timestamp": "2026-07-10 14:15:22", "resolved": False },
            "alert_2": { "id": "alert_2", "severity": "Warning", "department": "Pharmacy Cold Store", "message": "Temperature breach: cooling system efficiency dropped.", "sensor": "Temp Sensor 14", "value": "7.8 °C", "timestamp": "2026-07-10 16:32:10", "resolved": False }
        }

        # 5. Predictions
        self.local_db["predictions"]["bems_ml_insights"] = {
            "forecastData": [
                { "day": "Mon", "actual": 180.0, "predicted": 182.0 },
                { "day": "Tue", "actual": 195.0, "predicted": 190.0 },
                { "day": "Wed", "actual": 210.0, "predicted": 208.0 },
                { "day": "Thu", "actual": None, "predicted": 225.0 },
                { "day": "Fri", "actual": None, "predicted": 230.0 },
                { "day": "Sat", "actual": None, "predicted": 160.0 },
                { "day": "Sun", "actual": None, "predicted": 155.0 }
            ],
            "recommendations": [
                { "id": 1, "type": "hvac", "priority": "High", "message": "Optimize OT HVAC cooling flow cycle between 02:00 - 05:00. Estimated savings: 45 kWh.", "savings": "45 kWh", "impact": "High" },
                { "id": 2, "type": "idle", "priority": "Medium", "message": "CT Scanner has been in idle state for over 2 hours. Suggest stand-by mode. Estimated savings: 12 kWh.", "savings": "12 kWh", "impact": "Medium" }
            ],
            "anomalies": [
                { "id": 101, "timestamp": "2026-07-10 10:22", "department": "Emergency ER", "parameter": "Current Draw", "message": "Unusual current spike (+40%) detected without occupancy increment.", "severity": "Warning" }
            ]
        }

    # Generic CRUD implementations supporting both Live Firestore and Local Sandboxing
    def get_collection(self, collection_name: str) -> List[Dict[str, Any]]:
        if self.real_firebase:
            try:
                docs = self.db.collection(collection_name).stream()
                return [{**d.to_dict(), "id": d.id} for d in docs]
            except Exception as e:
                logger.error(f"Firestore collection read failure for {collection_name}: {e}")
                return list(self.local_db[collection_name].values())
        return list(self.local_db[collection_name].values())

    def get_document(self, collection_name: str, document_id: str) -> Optional[Dict[str, Any]]:
        if self.real_firebase:
            try:
                doc_ref = self.db.collection(collection_name).document(document_id)
                doc_snap = doc_ref.get()
                return doc_snap.to_dict() if doc_snap.exists else None
            except Exception as e:
                logger.error(f"Firestore doc read failure for {collection_name}/{document_id}: {e}")
                return self.local_db[collection_name].get(document_id)
        return self.local_db[collection_name].get(document_id)

    def write_document(self, collection_name: str, document_id: str, data: Dict[str, Any]):
        if self.real_firebase:
            try:
                self.db.collection(collection_name).document(document_id).set(data)
            except Exception as e:
                logger.error(f"Firestore doc write failure for {collection_name}/{document_id}: {e}")
                self.local_db[collection_name][document_id] = data
        else:
            self.local_db[collection_name][document_id] = data

    def update_document(self, collection_name: str, document_id: str, data: Dict[str, Any]):
        if self.real_firebase:
            try:
                self.db.collection(collection_name).document(document_id).update(data)
            except Exception as e:
                logger.error(f"Firestore doc update failure for {collection_name}/{document_id}: {e}")
                if document_id in self.local_db[collection_name]:
                    self.local_db[collection_name][document_id].update(data)
        else:
            if document_id in self.local_db[collection_name]:
                self.local_db[collection_name][document_id].update(data)

    def create_document(self, collection_name: str, data: Dict[str, Any]) -> str:
        if self.real_firebase:
            try:
                _, doc_ref = self.db.collection(collection_name).add(data)
                return doc_ref.id
            except Exception as e:
                logger.error(f"Firestore doc create failure for {collection_name}: {e}")
                doc_id = f"auto_{len(self.local_db[collection_name]) + 1}"
                self.local_db[collection_name][doc_id] = {**data, "id": doc_id}
                return doc_id
        else:
            doc_id = f"auto_{len(self.local_db[collection_name]) + 1}"
            self.local_db[collection_name][doc_id] = {**data, "id": doc_id}
            return doc_id

# Singleton Instance
firebase_service = FirebaseService()
