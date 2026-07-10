import os
import json
import time
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db

class FirebaseClient:
    def __init__(self):
        self.db_url = os.environ.get("FIREBASE_DATABASE_URL", "")
        self.cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH", "")
        self.real_firebase = False
        
        # In-memory local database fallback
        self.local_db = {
            "users": {
                "admin": {"username": "admin", "password": "admin123", "role": "Admin", "name": "Dr. Sarah Jenkins"},
                "manager": {"username": "manager", "password": "manager123", "role": "Energy Manager", "name": "Alex Rivera"},
                "tech": {"username": "tech", "password": "tech123", "role": "Technician", "name": "Marcus Vance"}
            },
            "hospital": {
                "details": {
                    "name": "St. Jude Smart Hospital",
                    "address": "456 Healthcare Parkway, Cityville",
                    "num_departments": 4
                },
                "departments": {
                    "ICU": {"name": "Intensive Care Unit", "beds": 24},
                    "OT": {"name": "Operation Theatre Block", "beds": 6},
                    "Ward": {"name": "General Wards Wing", "beds": 120},
                    "Emergency": {"name": "Emergency Trauma Center", "beds": 45}
                },
                "settings": {
                    "alert_thresholds": {
                        "temperature": {"min": 18.0, "max": 25.0},
                        "humidity": {"min": 30.0, "max": 65.0},
                        "co2": {"max": 1000},
                        "current": {"max": 50.0},
                        "voltage": {"min": 210.0, "max": 245.0},
                        "vibration": {"max": 5.0}
                    },
                    "mqtt_config": {
                        "broker_url": "broker.hivemq.com",
                        "port": 1883,
                        "topic": "hospital/bems/telemetry/+",
                        "status": "Disconnected"
                    }
                }
            },
            "devices": {
                "esp32_icu": {"id": "ESP32_ICU", "status": "Online", "ip": "192.168.1.101"},
                "esp32_ot": {"id": "ESP32_OT", "status": "Online", "ip": "192.168.1.102"},
                "esp32_ward": {"id": "ESP32_WARD", "status": "Online", "ip": "192.168.1.103"},
                "esp32_emergency": {"id": "ESP32_EMERGENCY", "status": "Online", "ip": "192.168.1.104"}
            },
            "live_data": {
                "ICU": {
                    "temperature": 21.5, "humidity": 45.0, "co2": 450, 
                    "voltage": 230.1, "current": 12.4, "occupancy": 14, 
                    "vibration": 0.1, "equipment_health": 98, "status": "Normal"
                },
                "OT": {
                    "temperature": 19.8, "humidity": 50.2, "co2": 410, 
                    "voltage": 229.8, "current": 22.1, "occupancy": 5, 
                    "vibration": 0.2, "equipment_health": 95, "status": "Normal"
                },
                "Ward": {
                    "temperature": 23.1, "humidity": 55.4, "co2": 520, 
                    "voltage": 231.2, "current": 18.9, "occupancy": 82, 
                    "vibration": 0.1, "equipment_health": 92, "status": "Normal"
                },
                "Emergency": {
                    "temperature": 22.0, "humidity": 48.0, "co2": 610, 
                    "voltage": 228.5, "current": 35.6, "occupancy": 29, 
                    "vibration": 0.4, "equipment_health": 89, "status": "Normal"
                }
            },
            "alerts": [],
            "ai_predictions": {},
            "reports": [],
            "logs": []
        }

        # Seed initial alerts
        self.local_db["alerts"].append({
            "id": "alert_1",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "department": "Emergency",
            "sensor": "current",
            "value": 35.6,
            "message": "High Current drawn by Trauma Scanner",
            "severity": "Warning",
            "resolved": False
        })

        self.initialize_firebase()

    def initialize_firebase(self):
        if self.db_url and os.path.exists(self.cred_path):
            try:
                cred = credentials.Certificate(self.cred_path)
                firebase_admin.initialize_app(cred, {
                    'databaseURL': self.db_url
                })
                self.real_firebase = True
                print("[FirebaseClient] Initialized Firebase Admin successfully connected to DB.")
                
                # Check if data exists, if not seed it
                ref = db.reference("/")
                snapshot = ref.get()
                if snapshot is None:
                    print("[FirebaseClient] Realtime DB is empty. Seeding local template...")
                    ref.set(self.local_db)
            except Exception as e:
                print(f"[FirebaseClient] Failed to initialize Firebase: {e}. Falling back to in-memory mode.")
                self.real_firebase = False
        else:
            print("[FirebaseClient] Database credentials missing. Running in zero-dependency LOCAL Fallback Mode.")

    def get_ref(self, path):
        if self.real_firebase:
            return db.reference(path)
        return None

    def read(self, path):
        if self.real_firebase:
            try:
                val = self.get_ref(path).get()
                return val if val is not None else self._get_local_path(path)
            except Exception as e:
                print(f"[FirebaseClient] Read error on {path}: {e}")
                return self._get_local_path(path)
        return self._get_local_path(path)

    def write(self, path, data):
        self._set_local_path(path, data)
        if self.real_firebase:
            try:
                self.get_ref(path).set(data)
            except Exception as e:
                print(f"[FirebaseClient] Write error on {path}: {e}")

    def update(self, path, data):
        self._update_local_path(path, data)
        if self.real_firebase:
            try:
                self.get_ref(path).update(data)
            except Exception as e:
                print(f"[FirebaseClient] Update error on {path}: {e}")

    def push(self, path, data):
        local_list = self._get_local_path(path)
        if not isinstance(local_list, list):
            local_list = []
            self._set_local_path(path, local_list)
        
        # Add id if missing
        if "id" not in data:
            data["id"] = f"auto_{int(time.time() * 1000)}"
            
        local_list.append(data)
        
        if self.real_firebase:
            try:
                self.get_ref(path).push(data)
            except Exception as e:
                print(f"[FirebaseClient] Push error on {path}: {e}")

    def _get_local_path(self, path):
        # Helper to navigate local nested dict
        parts = [p for p in path.split("/") if p]
        curr = self.local_db
        for p in parts:
            if isinstance(curr, dict) and p in curr:
                curr = curr[p]
            elif isinstance(curr, list):
                # Try integer index
                try:
                    curr = curr[int(p)]
                except:
                    return None
            else:
                return None
        return curr

    def _set_local_path(self, path, value):
        parts = [p for p in path.split("/") if p]
        if not parts:
            self.local_db = value
            return
        
        curr = self.local_db
        for i, p in enumerate(parts[:-1]):
            if p not in curr:
                curr[p] = {}
            curr = curr[p]
        curr[parts[-1]] = value

    def _update_local_path(self, path, value):
        parts = [p for p in path.split("/") if p]
        curr = self.local_db
        for p in parts:
            if p not in curr:
                curr[p] = {}
            curr = curr[p]
        if isinstance(curr, dict) and isinstance(value, dict):
            curr.update(value)

# Singleton Instance
firebase_client = FirebaseClient()
