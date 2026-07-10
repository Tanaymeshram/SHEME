# Smart Hospital Energy Management System (SHEMS)

Smart Hospital Energy Management System (SHEMS) is an enterprise-grade command center built to monitor, predict, optimize, and reduce hospital energy consumption without affecting patient safety.

This repository houses the Phase 1 implementation, focusing on the **production-ready frontend architecture & UI command dashboard**.

---

## 🏥 Project Overview

Hospitals run 24x7 and are highly energy-intensive. Critical departments like the ICU, Operating Theatre (OT), Emergency ER, and Labs require uninterrupted power grids. SHEMS provides:
* **Micro-Grid Wing Telemetry**: Live environmental readings (Temp, Humidity, CO2) and HVAC overrides.
* **3-Phase Diagnostic Bus Monitoring**: Real-time Apparent Power (kVA), current draws, voltages, and Power Factor corrections.
* **Medical Equipment Idle-Time Tracking**: Standby monitoring of heavy radiology equipment (MRI, CT Scanners) to mitigate idle-load leakage.
* **AI Energy Forecasts (Placeholder)**: Baseline and forecast line indicators using LSTM regression models.
* **Gateway Alarms Panel**: Alarm dispatch tables with severity filtering and operator acknowledgements.

---

## 🛠️ Technology Stack

### Frontend
* **Core**: React 18 & Vite
* **Styling**: Tailwind CSS v3
* **Routing**: React Router DOM v6 (Guarded / gated auth routes)
* **Animations**: Framer Motion v11
* **Icons**: Lucide React
* **Charts**: Recharts v2 (Area, Line, and Composed graphs)

### Backend (Future Integration Ready)
* **API Framework**: FastAPI (Python)
* **IoT Protocols**: MQTT Broker / ESP32 Gateway Node
* **Database**: Firebase Firestore
* **Authentication**: Firebase Auth / JWT Tokens
* **Machine Learning**: TensorFlow / Scikit-learn (Peak Load & HVAC prediction regressions)

---

## 📁 Repository Directory Structure

```
sheme/
├── README.md               # Master Documentation
├── backend/                # Backend API services (Python / FastAPI)
│   ├── app.py              # Main API server
│   ├── ai_models.py        # Peak Load & HVAC LSTM models
│   ├── firebase_client.py  # Firestore connectors
│   ├── mqtt_handler.py     # IoT telemetry subscriber
│   └── requirements.txt    # Python dependencies
└── frontend/               # React Vite UI shell
    ├── .gitignore
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── assets/         # Static images & icons
        ├── components/     # Reusable UI widgets (KPIs, Charts, Table)
        ├── pages/          # Navigable Views (Dashboard, Rooms, Settings)
        ├── layouts/        # Shell layouts (Sidebar, Header, Alert panel)
        ├── hooks/          # Custom utility hooks (useLocalStorage)
        ├── context/        # Global React Context (User session, Alerts state)
        ├── services/       # API integration client (with Mock sandbox mode)
        ├── firebase/       # Firebase config files
        ├── utils/          # Formatting and math calculators
        └── routes/         # Routing maps
```

---

## 🚀 Execution Guide

Follow these steps to run the SHEMS application locally on your system:

### Prerequisite
* Make sure **Node.js** (v18 or higher) is installed.

### Installation
1. Change directory to the frontend project:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```

### Development
Start the local Vite server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

### Build Verification
To check syntax, lint, and build the production bundle:
```bash
npm run build
```

---

## 🔐 Credentials (Simulated Gateway)

Log in using any of the following operator profiles:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` |
| **Energy Manager** | `manager` | `manager123` |
| **Technician** | `tech` | `tech123` |
