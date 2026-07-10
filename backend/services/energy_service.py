import math
from typing import Dict, Any

class EnergyService:
    @staticmethod
    def calculate_kva(kw: float, power_factor: float = 0.92) -> float:
        """
        Calculate Apparent Power (kVA) from Active Power (kW) and Power Factor
        """
        if not power_factor or power_factor <= 0:
            return 0.0
        return round(kw / power_factor, 2)

    @staticmethod
    def calculate_carbon_reduction(kwh_saved: float) -> float:
        """
        Calculate Carbon Footprint Reduction in kg CO2 (standard grid factor = 0.475)
        """
        return round(kwh_saved * 0.475, 2)

    @staticmethod
    def calculate_phase_load(voltage: float, current: float, power_factor: float = 0.92) -> float:
        """
        Calculate active load in kW for a single electrical phase
        """
        return round((voltage * current * power_factor) / 1000.0, 2)

    @staticmethod
    def calculate_three_phase_kva(voltage: float, current_avg: float) -> float:
        """
        Calculate total apparent power in kVA for a balanced 3-phase grid
        Formula: S = sqrt(3) * V_L-L * I_avg / 1000
        For standard 230V Phase-to-Neutral (V_P), line-to-line voltage V_L-L = 400V
        """
        v_line_to_line = voltage * math.sqrt(3)  # approx 400V for 230V
        return round((math.sqrt(3) * v_line_to_line * current_avg) / 1000.0, 2)
