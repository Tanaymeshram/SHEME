import os
import io
import csv
import random
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from firebase_client import firebase_client
from mqtt_handler import mqtt_handler
from ai_models import ai_engine

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
# Enable CORS for Vite frontend access
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Simple secret key for session configurations
app.config['SECRET_KEY'] = 'sheme_secret_key_2026'

# ==========================================
# BACKGROUND DAEMONS INITIALIZATION
# ==========================================
# Start MQTT connection and Telemetry Simulator loop
services_started = False

def start_services():
    global services_started
    if not services_started:
        print("[Flask Startup] Connecting MQTT client daemon...")
        mqtt_handler.connect()
        print("[Flask Startup] Launching ESP32 Telemetry Simulator thread...")
        mqtt_handler.start_simulator()
        services_started = True

@app.before_request
def check_first_request():
    start_services()

# Fallback in case before_request does not fire in some Flask run modes
@app.route("/api/ping", methods=["GET"])
def ping():
    start_services()
    return jsonify({
        "status": "online",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "mqtt_connected": mqtt_handler.connected,
        "simulator_active": mqtt_handler.simulation_running
    })

# ==========================================
# 1. AUTHENTICATION MODULE
# ==========================================
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    
    users = firebase_client.read("users") or {}
    
    if username in users and users[username]["password"] == password:
        user_info = users[username]
        return jsonify({
            "message": "Login successful",
            "user": {
                "username": username,
                "role": user_info.get("role", "Technician"),
                "name": user_info.get("name", "Staff Member")
            }
        }), 200
        
    return jsonify({"message": "Invalid username or password"}), 401

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    name = data.get("name")
    role = data.get("role", "Technician")
    
    if not username or not password or not name:
        return jsonify({"message": "Missing credentials fields."}), 400
        
    users = firebase_client.read("users") or {}
    if username in users:
        return jsonify({"message": "Username already exists."}), 409
        
    new_user = {
        "username": username,
        "password": password,
        "name": name,
        "role": role
    }
    firebase_client.write(f"users/{username}", new_user)
    return jsonify({"message": "Registration successful."}), 201

# ==========================================
# 2. DASHBOARD FEED
# ==========================================
@app.route("/api/dashboard/live", methods=["GET"])
def get_live_dashboard():
    # Ensure simulator is running
    if not mqtt_handler.simulation_running:
        mqtt_handler.connect()
        mqtt_handler.start_simulator()

    live_data = firebase_client.read("live_data") or {}
    alerts = firebase_client.read("alerts") or []
    
    # Calculate global KPIs
    total_energy = 0.0
    total_voltage = 0.0
    total_current = 0.0
    total_temp = 0.0
    total_hum = 0.0
    total_co2 = 0
    total_occupancy = 0
    total_health = 0.0
    active_alerts = 0
    
    depts = list(live_data.keys())
    num_depts = len(depts) if depts else 1
    
    for d_name, d_val in live_data.items():
        # Instant energy calculations (Voltage * Current) / 1000 kW
        v = float(d_val.get("voltage", 230.0))
        c = float(d_val.get("current", 10.0))
        total_energy += (v * c) / 1000.0
        total_voltage += v
        total_current += c
        total_temp += float(d_val.get("temperature", 22.0))
        total_hum += float(d_val.get("humidity", 50.0))
        total_co2 += int(d_val.get("co2", 450))
        total_occupancy += int(d_val.get("occupancy", 10))
        total_health += float(d_val.get("equipment_health", 95))

    # Active alert count
    for a in alerts:
        if not a.get("resolved", False):
            active_alerts += 1
            
    # Mock real-time energy history graph
    now = datetime.now()
    live_trend = []
    for i in range(10):
        t_pt = now - timedelta(seconds=(10 - i) * 3)
        live_trend.append({
            "time": t_pt.strftime("%M:%S"),
            "consumption": round(total_energy + float(random.uniform(-1.0, 1.0)), 2),
            "voltage": round((total_voltage / num_depts) + float(random.uniform(-0.5, 0.5)), 1),
            "humidity": round((total_hum / num_depts) + float(random.uniform(-0.2, 0.2)), 1),
            "co2": int((total_co2 / num_depts) + random.randint(-5, 5))
        })

    # Department details structure
    departments_summary = {}
    for d_name, d_val in live_data.items():
        departments_summary[d_name] = {
            "temperature": d_val.get("temperature", 22.0),
            "humidity": d_val.get("humidity", 50.0),
            "co2": d_val.get("co2", 450),
            "voltage": d_val.get("voltage", 230.0),
            "current": d_val.get("current", 12.0),
            "occupancy": d_val.get("occupancy", 10),
            "equipment_health": d_val.get("equipment_health", 95),
            "status": d_val.get("status", "Normal")
        }

    return jsonify({
        "kpis": {
            "total_energy_consumption_kw": round(total_energy, 2),
            "live_voltage_v": round(total_voltage / num_depts, 1),
            "live_current_a": round(total_current, 2),
            "avg_temperature_c": round(total_temp / num_depts, 1),
            "avg_humidity_p": round(total_hum / num_depts, 1),
            "avg_co2_ppm": int(total_co2 / num_depts),
            "occupancy_status": total_occupancy,
            "equipment_health_score": round(total_health / num_depts, 1),
            "active_alerts": active_alerts
        },
        "departments": departments_summary,
        "live_trend": live_trend,
        "recent_alerts": alerts[-10:] if alerts else []
    })

# ==========================================
# 3. ENERGY MONITORING
# ==========================================
@app.route("/api/energy/monitoring", methods=["GET"])
def get_energy_monitoring():
    live_data = firebase_client.read("live_data") or {}
    
    # Generate mock history graphs for each sensor type
    now = datetime.now()
    history = {
        "temperature": [],
        "humidity": [],
        "voltage": [],
        "current": [],
        "co2": [],
        "occupancy": [],
        "vibration": []
    }
    
    for i in range(12):
        t_pt = now - timedelta(hours=(12 - i))
        hr_lbl = t_pt.strftime("%I %p")
        
        history["temperature"].append({"time": hr_lbl, "ICU": round(21.2 + random.uniform(-0.5, 0.5), 1), "OT": round(19.5 + random.uniform(-0.3, 0.3), 1), "Ward": round(23.0 + random.uniform(-0.8, 0.8), 1), "Emergency": round(22.1 + random.uniform(-0.6, 0.6), 1)})
        history["humidity"].append({"time": hr_lbl, "ICU": round(44.0 + random.uniform(-2, 2), 1), "OT": round(50.0 + random.uniform(-1, 1), 1), "Ward": round(56.0 + random.uniform(-3, 3), 1), "Emergency": round(48.0 + random.uniform(-2, 2), 1)})
        history["voltage"].append({"time": hr_lbl, "ICU": round(229.8 + random.uniform(-1, 1), 1), "OT": round(230.1 + random.uniform(-0.8, 0.8), 1), "Ward": round(231.0 + random.uniform(-1.2, 1.2), 1), "Emergency": round(228.4 + random.uniform(-1.5, 1.5), 1)})
        history["current"].append({"time": hr_lbl, "ICU": round(12.0 + random.uniform(-1, 1), 1), "OT": round(22.0 + random.uniform(-2, 2), 1), "Ward": round(18.0 + random.uniform(-1.5, 1.5), 1), "Emergency": round(35.0 + random.uniform(-3, 3), 1)})
        history["co2"].append({"time": hr_lbl, "ICU": random.randint(430, 480), "OT": random.randint(390, 420), "Ward": random.randint(480, 560), "Emergency": random.randint(580, 650)})
        history["occupancy"].append({"time": hr_lbl, "ICU": random.randint(8, 16), "OT": random.randint(2, 6), "Ward": random.randint(60, 95), "Emergency": random.randint(18, 35)})
        history["vibration"].append({"time": hr_lbl, "ICU": round(0.1 + random.uniform(-0.02, 0.02), 2), "OT": round(0.2 + random.uniform(-0.03, 0.03), 2), "Ward": round(0.08 + random.uniform(-0.01, 0.01), 2), "Emergency": round(0.4 + random.uniform(-0.1, 0.1), 2)})

    return jsonify({
        "live": live_data,
        "history": history
    })

# ==========================================
# 3.5 SENSOR DATA INGESTION
# ==========================================
@app.route("/api/ingestion/sensor", methods=["POST"])
def ingest_sensor_data():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Missing JSON payload"}), 400
            
        dept = data.get("department", "ICU")
        
        # Standardize payload parameters
        payload = {
            "department": dept,
            "temperature": float(data.get("temperature", 22.0)),
            "humidity": float(data.get("humidity", 50.0)),
            "co2": int(data.get("co2", 450)),
            "voltage": float(data.get("voltage", 230.0)),
            "current": float(data.get("current", 12.0)),
            "occupancy": int(data.get("occupancy", 10)),
            "vibration": float(data.get("vibration", 0.1)),
            "equipment_health": int(data.get("equipment_health", 95))
        }
        
        # Process telemetry (updates database, checks thresholds, creates alerts)
        mqtt_handler.process_telemetry(dept, payload)
        
        return jsonify({"status": "success", "message": f"Data ingested for {dept}"}), 200
    except Exception as e:
        print(f"[Ingestion Error] {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# 4. AI ANALYTICS MODULES
# ==========================================
@app.route("/api/analytics/ai", methods=["GET"])
def run_ai_analytics():
    live_data = firebase_client.read("live_data") or {}
    
    # 1. Energy prediction (LSTM)
    energy_preds = ai_engine.predict_energy_consumption(live_data, horizon="hour")
    
    # 2. HVAC Optimization (Random Forest Setpoint recommendations)
    hvac_opts = ai_engine.optimize_hvac(live_data)
    
    # 3. Peak load prediction (LSTM)
    peak_load = ai_engine.predict_peak_load(live_data)
    
    # 4. Predictive maintenance (Random Forest vibration failure predictions)
    maint_insights = ai_engine.predict_maintenance(live_data)
    
    # 5. Energy Anomaly Detection (Isolation forest current leak scanner)
    anomalies = ai_engine.detect_anomalies(live_data)
    
    # 6. Carbon footprint analysis
    carbon = ai_engine.carbon_footprint_analysis(live_data)
    
    # 7. AI recommendations list
    recs = ai_engine.generate_ai_recommendations(live_data, hvac_opts, peak_load, maint_insights, anomalies)

    return jsonify({
        "predictions": energy_preds,
        "hvac": hvac_opts,
        "peak_load": peak_load,
        "maintenance": maint_insights,
        "anomalies": anomalies,
        "carbon": carbon,
        "recommendations": recs
    })

# ==========================================
# 5. REPORTS EXPORTS SYSTEM
# ==========================================
@app.route("/api/reports/generate", methods=["POST"])
def generate_report():
    data = request.get_json() or {}
    report_type = data.get("report_type", "Daily Energy")
    export_format = data.get("format", "csv")
    
    live_data = firebase_client.read("live_data") or {}
    ai_data = run_ai_analytics().json
    
    # Setup mock data rows
    report_rows = []
    
    if "Energy" in report_type:
        report_rows.append(["Timestamp", "Department", "Power (kW)", "Voltage (V)", "Current (A)", "Occupancy"])
        now = datetime.now()
        for i in range(24):
            t_str = (now - timedelta(hours=i)).strftime("%Y-%m-%d %H:00:00")
            for dept in ["ICU", "OT", "Ward", "Emergency"]:
                v = float(live_data.get(dept, {}).get("voltage", 230))
                c = float(live_data.get(dept, {}).get("current", 12)) * (1.0 + random.uniform(-0.1, 0.1))
                kw = (v * c) / 1000.0
                occ = int(live_data.get(dept, {}).get("occupancy", 10))
                report_rows.append([t_str, dept, f"{kw:.2f}", f"{v:.1f}", f"{c:.2f}", occ])
                
    elif "Maintenance" in report_type:
        report_rows.append(["Equipment ID", "Equipment Name", "Department", "Health Score (%)", "Failure Probability (%)", "Remaining Useful Life (Days)", "Next Service Date", "Status"])
        for eq in ai_data["maintenance"]:
            report_rows.append([eq["id"], eq["name"], eq["department"], eq["health_score"], eq["failure_probability"], eq["remaining_useful_life_days"], eq["maintenance_due_date"], eq["status"]])
            
    elif "Carbon" in report_type:
        report_rows.append(["Metric", "Value", "Unit", "Green Rating Score"])
        carb = ai_data["carbon"]
        report_rows.append(["Daily CO2 Emission", carb["daily_co2_kg"], "kg", carb["green_score"]])
        report_rows.append(["Weekly CO2 Emission", carb["weekly_co2_kg"], "kg", carb["green_score"]])
        report_rows.append(["Monthly CO2 Emission", carb["monthly_co2_kg"], "kg", carb["green_score"]])
        
    else: # AI Predictions
        report_rows.append(["Predicted Period", "Load Demand (kW)", "Electricity Cost ($)", "Confidence Interval (%)"])
        for pred in ai_data["predictions"]:
            report_rows.append([pred["time"], pred["predicted_power"], pred["cost"], pred["accuracy"]])

    if export_format.lower() == "csv":
        si = io.StringIO()
        cw = csv.writer(si)
        cw.writerows(report_rows)
        output = io.BytesIO()
        output.write(si.getvalue().encode('utf-8'))
        output.seek(0)
        
        filename = f"SHEME_{report_type.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"
        return send_file(output, mimetype="text/csv", as_attachment=True, download_name=filename)
        
    elif export_format.lower() == "pdf":
        # Stream standard HTML print-ready sheet representing PDF
        si = io.StringIO()
        si.write(f"<html><head><style>body{{font-family:Arial;color:#333;margin:40px;}} table{{width:100%;border-collapse:collapse;margin-top:20px;}} th,td{{border:1px solid #ddd;padding:8px;text-align:left;}} th{{background-color:#1677ff;color:white;}}</style></head><body>")
        si.write(f"<h2>Smart Hospital Energy & Management System (SHEME)</h2>")
        si.write(f"<h3>{report_type} Report - Exported at {datetime.now().strftime('%Y-%m-%d %H:%M')}</h3>")
        si.write(f"<p>Export format: Adobe PDF Simulation</p>")
        si.write("<table>")
        for row in report_rows:
            si.write("<tr>")
            for col in row:
                tag = "th" if row == report_rows[0] else "td"
                si.write(f"<{tag}>{col}</{tag}>")
            si.write("</tr>")
        si.write("</table></body></html>")
        
        output = io.BytesIO()
        output.write(si.getvalue().encode('utf-8'))
        output.seek(0)
        
        filename = f"SHEME_{report_type.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.html"
        return send_file(output, mimetype="text/html", as_attachment=True, download_name=filename)

    else: # Excel (Returns Excel XML Spreadsheet format template)
        si = io.StringIO()
        si.write("<?xml version=\"1.0\"?>\n<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\">\n<Worksheet name=\"Report\">\n<Table>\n")
        for row in report_rows:
            si.write("<Row>")
            for col in row:
                si.write(f"<Cell><Data Type=\"String\">{col}</Data></Cell>")
            si.write("</Row>\n")
        si.write("</Table>\n</Worksheet>\n</Workbook>")
        
        output = io.BytesIO()
        output.write(si.getvalue().encode('utf-8'))
        output.seek(0)
        
        filename = f"SHEME_{report_type.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.xls"
        return send_file(output, mimetype="application/vnd.ms-excel", as_attachment=True, download_name=filename)

# ==========================================
# 6. SETTINGS ENDPOINTS
# ==========================================
@app.route("/api/settings", methods=["GET"])
def get_settings():
    settings = firebase_client.read("hospital/settings") or {}
    devices = firebase_client.read("devices") or {}
    return jsonify({
        "details": firebase_client.read("hospital/details"),
        "settings": settings,
        "devices": devices
    })

@app.route("/api/settings", methods=["POST"])
def update_settings():
    data = request.get_json() or {}
    
    # 1. Update hospital Details
    if "details" in data:
        firebase_client.write("hospital/details", data["details"])
        
    # 2. Update Alert thresholds
    if "alert_thresholds" in data:
        firebase_client.write("hospital/settings/alert_thresholds", data["alert_thresholds"])
        
    # 3. Update MQTT Config
    if "mqtt_config" in data:
        firebase_client.write("hospital/settings/mqtt_config", data["mqtt_config"])
        # Re-trigger MQTT client reconnect with new credentials in background
        mqtt_handler.stop_simulator()
        time.sleep(0.5)
        mqtt_handler.connect()
        mqtt_handler.start_simulator()

    return jsonify({"message": "Settings updated successfully."})

@app.route("/api/alerts/<alert_id>/resolve", methods=["POST"])
def resolve_alert(alert_id):
    alerts = firebase_client.read("alerts") or []
    
    # Resolve the target alert
    resolved_any = False
    for a in alerts:
        if a.get("id") == alert_id:
            a["resolved"] = True
            resolved_any = True
            break
            
    if resolved_any:
        firebase_client.write("alerts", alerts)
        return jsonify({"message": f"Alert {alert_id} resolved."})
        
    return jsonify({"message": "Alert not found."}), 404

# ==========================================
# STATIC FRONTEND SERVING (SINGLE BUNDLE)
# ==========================================
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    # Run Flask server locally on port 5000
    print("[Flask] Starting SHEME Flask Backend Server...")
    app.run(host="127.0.0.1", port=5000, debug=True)
