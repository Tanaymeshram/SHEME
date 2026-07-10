from pydantic import BaseModel
from typing import List, Optional

class ForecastItem(BaseModel):
    day: str
    actual: Optional[float] = None
    predicted: float

class RecommendationItem(BaseModel):
    id: int
    type: str
    priority: str
    message: str
    savings: str
    impact: str

class AnomalyItem(BaseModel):
    id: int
    timestamp: str
    department: str
    parameter: str
    message: str
    severity: str

class BemsMLInsights(BaseModel):
    forecastData: List[ForecastItem]
    recommendations: List[RecommendationItem]
    anomalies: List[AnomalyItem]
