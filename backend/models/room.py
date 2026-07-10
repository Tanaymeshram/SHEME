from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class RoomControlRequest(BaseModel):
    type: str = Field(..., description="Control parameter override type: hvac, fan, light")
    value: bool = Field(..., description="Control state to apply: true or false")

class RoomModel(BaseModel):
    roomId: str
    roomName: str
    department: str
    temperature: float
    humidity: float
    voltage: float
    current: float
    power: float
    energy: float
    occupancy: int
    status: str
    hvac: bool
    light: bool
    fan: bool
    equipmentStatus: str
    lastUpdated: Optional[datetime] = None
