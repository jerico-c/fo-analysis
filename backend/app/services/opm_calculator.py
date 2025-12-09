"""
Optical Power Meter (OPM) Calculator Service
Calculate power budget, loss budget, and signal quality for fiber optic networks
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import math

logger = logging.getLogger(__name__)


class WavelengthType(str, Enum):
    """Wavelength types for fiber optic transmission"""
    NM_1310 = "1310nm"
    NM_1550 = "1550nm"


class FiberType(str, Enum):
    """Fiber types"""
    SINGLE_MODE = "single_mode"
    MULTI_MODE = "multi_mode"


@dataclass
class OpticalParameters:
    """Optical transmission parameters"""
    tx_power: float  # Transmit power (dBm)
    rx_sensitivity: float  # Receiver sensitivity (dBm)
    wavelength: WavelengthType = WavelengthType.NM_1550
    fiber_type: FiberType = FiberType.SINGLE_MODE


@dataclass
class NetworkSegment:
    """Network segment for loss calculation"""
    fiber_length_km: float
    splice_count: int
    connector_count: int
    name: str = "Segment"


@dataclass
class LossParameters:
    """Loss parameters for calculation"""
    fiber_loss_per_km: float = 0.35  # dB/km at 1550nm
    splice_loss: float = 0.1  # dB per splice
    connector_loss: float = 0.5  # dB per connector
    safety_margin: float = 3.0  # dB


@dataclass
class CalculationResult:
    """OPM calculation result"""
    power_budget: float  # dB
    total_loss: float  # dB
    available_margin: float  # dB
    status: str  # "OK", "Warning", "Critical"
    quality_score: float  # 0-100
    details: Dict


class OPMCalculator:
    """
    Optical Power Meter Calculator
    Based on Telkom Access standards and ITU-T G.652/G.657 recommendations
    """
    
    # Standard values based on Telkom specifications
    STANDARD_LOSS_VALUES = {
        WavelengthType.NM_1310: 0.40,  # dB/km
        WavelengthType.NM_1550: 0.35,  # dB/km
    }
    
    def __init__(self):
        """Initialize OPM Calculator"""
        pass
    
    def calculate_power_budget(
        self,
        optical_params: OpticalParameters,
        loss_params: LossParameters,
        segment: NetworkSegment
    ) -> CalculationResult:
        """
        Calculate complete power budget analysis
        
        Formula:
        - Power Budget = Tx Power - Rx Sensitivity
        - Total Loss = (Fiber Length × Fiber Loss) + (Splice Count × Splice Loss) + 
                       (Connector Count × Connector Loss)
        - Available Margin = Power Budget - Total Loss - Safety Margin
        
        Args:
            optical_params: Optical transmission parameters
            loss_params: Loss calculation parameters
            segment: Network segment information
            
        Returns:
            CalculationResult with complete analysis
        """
        try:
            # Calculate power budget
            power_budget = optical_params.tx_power - optical_params.rx_sensitivity
            
            # Calculate individual losses
            fiber_loss = segment.fiber_length_km * loss_params.fiber_loss_per_km
            splice_loss = segment.splice_count * loss_params.splice_loss
            connector_loss = segment.connector_count * loss_params.connector_loss
            total_loss = fiber_loss + splice_loss + connector_loss
            
            # Calculate available margin
            available_margin = power_budget - total_loss - loss_params.safety_margin
            
            # Determine status
            status = self._determine_status(available_margin)
            
            # Calculate quality score (0-100)
            quality_score = self._calculate_quality_score(
                power_budget, total_loss, available_margin
            )
            
            # Prepare detailed results
            details = {
                'segment_name': segment.name,
                'optical_params': {
                    'tx_power_dbm': optical_params.tx_power,
                    'rx_sensitivity_dbm': optical_params.rx_sensitivity,
                    'wavelength': optical_params.wavelength.value,
                    'fiber_type': optical_params.fiber_type.value
                },
                'loss_breakdown': {
                    'fiber_loss_db': round(fiber_loss, 2),
                    'splice_loss_db': round(splice_loss, 2),
                    'connector_loss_db': round(connector_loss, 2),
                    'total_loss_db': round(total_loss, 2)
                },
                'segment_details': {
                    'fiber_length_km': segment.fiber_length_km,
                    'fiber_length_m': segment.fiber_length_km * 1000,
                    'splice_count': segment.splice_count,
                    'connector_count': segment.connector_count
                },
                'safety_margin_db': loss_params.safety_margin,
                'loss_per_km_db': loss_params.fiber_loss_per_km
            }
            
            result = CalculationResult(
                power_budget=round(power_budget, 2),
                total_loss=round(total_loss, 2),
                available_margin=round(available_margin, 2),
                status=status,
                quality_score=round(quality_score, 2),
                details=details
            )
            
            logger.info(f"Calculated OPM for {segment.name}: Status={status}, Quality={quality_score:.2f}")
            return result
            
        except Exception as e:
            logger.error(f"Error in OPM calculation: {e}")
            raise
    
    def calculate_max_distance(
        self,
        optical_params: OpticalParameters,
        loss_params: LossParameters,
        splice_count: int = 0,
        connector_count: int = 2  # Typical: 1 at each end
    ) -> float:
        """
        Calculate maximum allowable fiber distance
        
        Args:
            optical_params: Optical parameters
            loss_params: Loss parameters
            splice_count: Number of splices
            connector_count: Number of connectors
            
        Returns:
            Maximum distance in kilometers
        """
        power_budget = optical_params.tx_power - optical_params.rx_sensitivity
        
        # Subtract fixed losses and safety margin
        available_for_fiber = (
            power_budget 
            - (splice_count * loss_params.splice_loss)
            - (connector_count * loss_params.connector_loss)
            - loss_params.safety_margin
        )
        
        # Calculate max distance
        max_distance_km = available_for_fiber / loss_params.fiber_loss_per_km
        
        return max(0, max_distance_km)
    
    def calculate_required_tx_power(
        self,
        rx_sensitivity: float,
        segment: NetworkSegment,
        loss_params: LossParameters
    ) -> float:
        """
        Calculate required transmit power for given segment
        
        Args:
            rx_sensitivity: Receiver sensitivity (dBm)
            segment: Network segment
            loss_params: Loss parameters
            
        Returns:
            Required Tx power (dBm)
        """
        # Calculate total loss
        fiber_loss = segment.fiber_length_km * loss_params.fiber_loss_per_km
        splice_loss = segment.splice_count * loss_params.splice_loss
        connector_loss = segment.connector_count * loss_params.connector_loss
        total_loss = fiber_loss + splice_loss + connector_loss
        
        # Required Tx = Rx + Total Loss + Safety Margin
        required_tx = rx_sensitivity + total_loss + loss_params.safety_margin
        
        return round(required_tx, 2)
    
    def analyze_multiple_segments(
        self,
        optical_params: OpticalParameters,
        loss_params: LossParameters,
        segments: List[NetworkSegment]
    ) -> List[CalculationResult]:
        """
        Analyze multiple network segments
        
        Args:
            optical_params: Optical parameters
            loss_params: Loss parameters
            segments: List of network segments
            
        Returns:
            List of calculation results
        """
        results = []
        for segment in segments:
            result = self.calculate_power_budget(optical_params, loss_params, segment)
            results.append(result)
        return results
    
    def _determine_status(self, available_margin: float) -> str:
        """
        Determine link status based on available margin
        
        Criteria:
        - OK: margin >= 3 dB
        - Warning: 0 dB <= margin < 3 dB
        - Critical: margin < 0 dB
        """
        if available_margin >= 3.0:
            return "OK"
        elif available_margin >= 0:
            return "Warning"
        else:
            return "Critical"
    
    def _calculate_quality_score(
        self,
        power_budget: float,
        total_loss: float,
        available_margin: float
    ) -> float:
        """
        Calculate quality score (0-100)
        
        Based on:
        - Loss efficiency: (1 - total_loss/power_budget) × 40
        - Margin adequacy: (available_margin/10) × 60
        """
        if power_budget <= 0:
            return 0.0
        
        # Loss efficiency score (0-40)
        loss_efficiency = max(0, (1 - total_loss / power_budget)) * 40
        
        # Margin adequacy score (0-60)
        # Ideal margin is 10 dB or more
        margin_adequacy = min(60, max(0, (available_margin / 10) * 60))
        
        total_score = loss_efficiency + margin_adequacy
        return max(0, min(100, total_score))
    
    def get_recommendations(self, result: CalculationResult) -> List[str]:
        """
        Get recommendations based on calculation result
        
        Args:
            result: Calculation result
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        if result.status == "Critical":
            recommendations.append("⚠️ CRITICAL: Link margin is negative. Connection may fail.")
            recommendations.append("➡️ Reduce fiber length or increase transmit power")
            recommendations.append("➡️ Minimize splice and connector count")
            recommendations.append("➡️ Use lower loss fiber (e.g., G.657.A2)")
            
        elif result.status == "Warning":
            recommendations.append("⚠️ WARNING: Link margin is below recommended threshold")
            recommendations.append("➡️ Consider adding optical amplifiers for long distances")
            recommendations.append("➡️ Ensure high-quality splices (< 0.05 dB)")
            recommendations.append("➡️ Regular maintenance to prevent degradation")
            
        else:  # OK
            recommendations.append("✅ Link quality is good")
            
        # Additional recommendations based on details
        details = result.details
        fiber_loss = details['loss_breakdown']['fiber_loss_db']
        splice_loss = details['loss_breakdown']['splice_loss_db']
        
        if splice_loss > fiber_loss * 0.3:
            recommendations.append("➡️ Splice loss is significant. Consider reducing splice count")
        
        if result.quality_score < 70:
            recommendations.append("➡️ Consider route optimization to improve quality score")
        
        return recommendations


# Helper functions for common calculations

def db_to_linear(db_value: float) -> float:
    """Convert dB to linear scale"""
    return 10 ** (db_value / 10)


def linear_to_db(linear_value: float) -> float:
    """Convert linear to dB scale"""
    if linear_value <= 0:
        return float('-inf')
    return 10 * math.log10(linear_value)


def dbm_to_mw(dbm_value: float) -> float:
    """Convert dBm to milliwatts"""
    return 10 ** (dbm_value / 10)


def mw_to_dbm(mw_value: float) -> float:
    """Convert milliwatts to dBm"""
    if mw_value <= 0:
        return float('-inf')
    return 10 * math.log10(mw_value)
