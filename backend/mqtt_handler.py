import time
import json
import random
import threading
from datetime import datetime
import paho.mqtt.client as mqtt
from firebase_client import firebase_client

class MQTTHandler:
    def __init__(self):
        self.broker = "broker.hivemq.com"
        self.port = 1883
        self.client_id = f"sheme_backend_{random.randint(1000, 9999)}"
        self.topic = "hospital/bems/telemetry/+"
        self.client = None
        self.connected = False
        self.simulation_running = False

    def connect(self):
        # Retrieve settings
        settings = firebase_client.read("hospital/settings")
        if settings and "mqtt_config" in settings:
            config = settings["mqtt_config"]
            self.broker = config.get("broker_url", self.broker)
            self.port = int(config.get("port", self.port))
            self.topic = config.get("topic", self.topic)
        
        try:
            self.client = mqtt.Client(self.client_id)
            self.client.on_connect = self.on_connect
            self.client.on_disconnect = self.on_disconnect
            self.client.on_message = self.on_message
            
            # Connect in a background thread to prevent blocking
            print(f"[MQTT] Connecting to broker {self.broker}:{self.port}...")
            self.client.connect_async(self.broker, self.port, 60)
            self.client.loop_start()
        except Exception as e:
            print(f"[MQTT] Connection failed: {e}")
            self.connected = False

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            print(f"[MQTT] Connected successfully to {self.broker}")
            self.client.subscribe(self.topic)
            firebase_client.write("hospital/settings/mqtt_config/status", "Connected")
        else:
            self.connected = False
            print(f"[MQTT] Connection failed with status code {rc}")
            firebase_client.write("hospital/settings/mqtt_config/status", "Error Connect")

    def on_disconnect(self, client, userdata, rc):
        self.connected = False
        print("[MQTT] Disconnected from MQTT broker.")
        firebase_client.write("hospital/settings/mqtt_config/status", "Disconnected")

    def on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode('utf-8'))
            dept = payload.get("department")
            if not dept:
                # Deduce department from topic
                dept = msg.topic.split("/")[-1]
            
            self.process_telemetry(dept, payload)
        except Exception as e:
            print(f"[MQTT] Error handling telemetry message: {e}")

    def process_telemetry(self, dept, payload):
        # Standardize department keys (ICU, OT, Ward, Emergency)
        dept_key = None
        if "icu" in dept.lower():
            dept_key = "ICU"
        elif "ot" in dept.lower() or "theatre" in dept.lower():
            dept_key = "OT"
        elif "ward" in dept.lower():
            dept_key = "Ward"
        elif "emergency" in dept.lower() or "er" in dept.lower():
            dept_key = "Emergency"
            
        if not dept_key:
            return

        # Fetch settings and threshold configurations
        settings = firebase_client.read("hospital/settings")
        thresholds = settings.get("alert_thresholds", {})
        
        # Calculate status based on sensors vs thresholds
        status = "Normal"
        alerts_triggered = []
        
        # Readings mapping
        readings = {
            "temperature": float(payload.get("temperature", 22.0)),
            "humidity": float(payload.get("humidity", 50.0)),
            "co2": int(payload.get("co2", 450)),
            "voltage": float(payload.get("voltage", 230.0)),
            "current": float(payload.get("current", 10.0)),
            "occupancy": int(payload.get("occupancy", 10)),
            "vibration": float(payload.get("vibration", 0.1)),
            "equipment_health": int(payload.get("equipment_health", 95))
        }

        # Check Temperature
        temp_limits = thresholds.get("temperature", {"min": 18.0, "max": 25.0})
        if readings["temperature"] > float(temp_limits["max"]):
            status = "Warning"
            alerts_triggered.append(("temperature", readings["temperature"], f"High Temperature ({readings['temperature']}°C) in {dept_key}"))
        elif readings["temperature"] < float(temp_limits["min"]):
            status = "Warning"
            alerts_triggered.append(("temperature", readings["temperature"], f"Low Temperature ({readings['temperature']}°C) in {dept_key}"))

        # Check Humidity
        hum_limits = thresholds.get("humidity", {"min": 30.0, "max": 65.0})
        if readings["humidity"] > float(hum_limits["max"]):
            status = "Warning"
            alerts_triggered.append(("humidity", readings["humidity"], f"High Humidity ({readings['humidity']}%) in {dept_key}"))
        elif readings["humidity"] < float(hum_limits["min"]):
            status = "Warning"
            alerts_triggered.append(("humidity", readings["humidity"], f"Low Humidity ({readings['humidity']}%) in {dept_key}"))

        # Check CO2
        co2_limit = thresholds.get("co2", {"max": 1000})
        if readings["co2"] > int(co2_limit["max"]):
            status = "Critical"
            alerts_triggered.append(("co2", readings["co2"], f"Critical CO2 levels ({readings['co2']} ppm) in {dept_key}"))

        # Check Voltage
        v_limits = thresholds.get("voltage", {"min": 210.0, "max": 245.0})
        if readings["voltage"] > float(v_limits["max"]):
            status = "Critical"
            alerts_triggered.append(("voltage", readings["voltage"], f"Voltage Surge ({readings['voltage']} V) in {dept_key}"))
        elif readings["voltage"] < float(v_limits["min"]):
            status = "Critical"
            alerts_triggered.append(("voltage", readings["voltage"], f"Voltage Drop ({readings['voltage']} V) in {dept_key}"))

        # Check Current
        curr_limit = thresholds.get("current", {"max": 50.0})
        if readings["current"] > float(curr_limit["max"]):
            status = "Critical"
            alerts_triggered.append(("current", readings["current"], f"Current Overload ({readings['current']} A) in {dept_key}"))

        # Check Vibration
        vib_limit = thresholds.get("vibration", {"max": 5.0})
        if readings["vibration"] > float(vib_limit["max"]):
            status = "Warning"
            alerts_triggered.append(("vibration", readings["vibration"], f"High Vibration ({readings['vibration']} g) in {dept_key}"))

        # If any alert is critical, department status is Critical
        for alert_item in alerts_triggered:
            if "Critical" in alert_item[2] or alert_item[0] in ["co2", "voltage", "current"]:
                status = "Critical"

        readings["status"] = status
        
        # Save to Firebase Realtime Database
        firebase_client.write(f"live_data/{dept_key}", readings)
        
        # Log to Database
        log_entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "department": dept_key,
            **readings
        }
        firebase_client.push("logs", log_entry)

        # Trigger Alerts in Realtime Database
        for sensor, value, msg in alerts_triggered:
            alert_entry = {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "department": dept_key,
                "sensor": sensor,
                "value": value,
                "message": msg,
                "severity": "Critical" if status == "Critical" else "Warning",
                "resolved": False
            }
            # Avoid duplicate active alerts
            existing_alerts = firebase_client.read("alerts") or []
            is_dup = False
            for existing in existing_alerts:
                if (existing.get("department") == dept_key and 
                    existing.get("sensor") == sensor and 
                    not existing.get("resolved")):
                    is_dup = True
                    break
            
            if not is_dup:
                firebase_client.push("alerts", alert_entry)

    def publish_telemetry(self, topic, data):
        if self.client and self.connected:
            try:
                self.client.publish(topic, json.dumps(data), qos=1)
            except Exception as e:
                print(f"[MQTT] Publish failed: {e}")

    def start_simulator(self):
        self.simulation_running = True
        self.sim_thread = threading.Thread(target=self._run_simulation)
        self.sim_thread.daemon = True
        self.sim_thread.start()
        print("[MQTT] Telemetry Simulator started.")

    def stop_simulator(self):
        self.simulation_running = False

    def _run_simulation(self):
        departments = ["ICU", "OT", "Ward", "Emergency"]
        while self.simulation_running:
            for dept in departments:
                # Fetch settings for threshold ranges to keep simulator realistic
                settings = firebase_client.read("hospital/settings") or {}
                thresholds = settings.get("alert_thresholds", {})
                
                # Base states
                temp_min = float(thresholds.get("temperature", {}).get("min", 18))
                temp_max = float(thresholds.get("temperature", {}).get("max", 25))
                
                # Department specific values
                if dept == "ICU":
                    temp = random.uniform(20.0, 23.0)
                    hum = random.uniform(40.0, 50.0)
                    co2 = random.randint(380, 550)
                    occupancy = random.randint(8, 20)
                    health = random.randint(95, 100)
                    current = random.uniform(8.0, 15.0)
                    vibration = random.uniform(0.05, 0.2)
                elif dept == "OT":
                    temp = random.uniform(18.0, 21.0)
                    hum = random.uniform(45.0, 55.0)
                    co2 = random.randint(350, 480)
                    occupancy = random.randint(3, 10)
                    health = random.randint(96, 100)
                    current = random.uniform(15.0, 28.0)
                    vibration = random.uniform(0.08, 0.3)
                elif dept == "Ward":
                    temp = random.uniform(22.0, 24.5)
                    hum = random.uniform(50.0, 60.0)
                    co2 = random.randint(450, 750)
                    occupancy = random.randint(50, 100)
                    health = random.randint(88, 97)
                    current = random.uniform(12.0, 22.0)
                    vibration = random.uniform(0.02, 0.15)
                else: # Emergency
                    temp = random.uniform(21.0, 23.5)
                    hum = random.uniform(42.0, 55.0)
                    co2 = random.randint(450, 850)
                    occupancy = random.randint(15, 40)
                    health = random.randint(85, 95)
                    current = random.uniform(20.0, 42.0)
                    vibration = random.uniform(0.1, 0.6)

                # Occasionally inject anomalies (1% chance)
                if random.random() < 0.01:
                    anomaly_type = random.choice(["temp", "co2", "voltage", "current", "vibration"])
                    if anomaly_type == "temp":
                        temp = temp_max + random.uniform(2.0, 5.0)
                    elif anomaly_type == "co2":
                        co2 = 1200
                    elif anomaly_type == "voltage":
                        voltage = random.choice([205.0, 252.0])
                    elif anomaly_type == "current":
                        current = 62.5
                    else:
                        vibration = 6.2

                # Calculate stable voltage with minor fluctuations
                voltage = random.uniform(227.0, 233.0)
                # Ensure occasional voltage fluctuation
                if random.random() < 0.02:
                    voltage = random.choice([208.5, 246.2])

                # Construct MQTT payload
                payload = {
                    "department": dept,
                    "temperature": round(temp, 1),
                    "humidity": round(hum, 1),
                    "co2": co2,
                    "voltage": round(voltage, 1),
                    "current": round(current, 1),
                    "occupancy": occupancy,
                    "vibration": round(vibration, 2),
                    "equipment_health": health
                }

                # Publish either to real broker (if connected) or process directly
                topic = f"hospital/bems/telemetry/{dept.lower()}"
                if self.connected:
                    self.publish_telemetry(topic, payload)
                else:
                    # In local mode, bypass broker and write directly
                    self.process_telemetry(dept, payload)
            
            # Wait 3 seconds before next telemetry frame
            time.sleep(3)

# Singleton Instance
mqtt_handler = MQTTHandler()
