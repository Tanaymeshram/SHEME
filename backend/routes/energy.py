from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from typing import Dict, Any
import io

router = APIRouter(prefix="/api/energy", tags=["Energy telemetry"])

@router.get("/monitoring", response_model=Dict[str, Any])
async def get_energy_monitoring():
    """
    Retrieve live phase metrics and daily load trends.
    """
    try:
        return {
            "dailyLoads": [
                { "name": "00:00", "baseload": 80.0, "peakload": 90.0, "solar": 0.0 },
                { "name": "04:00", "baseload": 78.0, "peakload": 85.0, "solar": 0.0 },
                { "name": "08:00", "baseload": 120.0, "peakload": 160.0, "solar": 20.0 },
                { "name": "12:00", "baseload": 150.0, "peakload": 220.0, "solar": 55.0 },
                { "name": "16:00", "baseload": 140.0, "peakload": 195.0, "solar": 35.0 },
                { "name": "20:00", "baseload": 110.0, "peakload": 130.0, "solar": 0.0 }
            ],
            "phaseDetails": {
                "phaseA": { "voltage": 231.2, "current": 85.4, "powerFactor": 0.93 },
                "phaseB": { "voltage": 229.8, "current": 88.1, "powerFactor": 0.91 },
                "phaseC": { "voltage": 230.5, "current": 82.9, "powerFactor": 0.92 }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reports/generate")
async def generate_report(
    payload: Dict[str, Any] = Body(...)
):
    """
    Generate downloadable BEMS CSV reports.
    """
    report_type = payload.get("report_type", "General")
    report_format = payload.get("format", "csv")
    
    # Generate CSV stream
    output = io.StringIO()
    output.write("Timestamp,Department,KPI,Value\n")
    output.write(f"2026-07-10 14:00,ICU Wing B,Energy Load,34.5 kW\n")
    output.write(f"2026-07-10 14:00,Operation Theatre,Energy Load,48.2 kW\n")
    output.write(f"2026-07-10 14:00,Emergency ER,Energy Load,28.1 kW\n")
    output.write(f"2026-07-10 14:00,Central Lab,Energy Load,18.7 kW\n")
    
    output.seek(0)
    
    filename = f"SHEME_{report_type.replace(' ', '_')}_Report.csv"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return StreamingResponse(io.BytesIO(output.getvalue().encode()), media_type="text/csv", headers=headers)
