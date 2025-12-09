"""
Analysis API Endpoints
Perform optical power calculations and network analysis
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import logging

from app.services.opm_calculator import (
    OPMCalculator,
    OpticalParameters,
    LossParameters,
    NetworkSegment,
    WavelengthType,
    FiberType
)

router = APIRouter()
logger = logging.getLogger(__name__)


class OpticalParamsRequest(BaseModel):
    """Request model for optical parameters"""
    tx_power: float = Field(..., description="Transmit power in dBm", ge=-10, le=10)
    rx_sensitivity: float = Field(..., description="Receiver sensitivity in dBm", ge=-40, le=-10)
    wavelength: str = Field(default="1550nm", description="Wavelength (1310nm or 1550nm)")
    fiber_type: str = Field(default="single_mode", description="Fiber type")


class LossParamsRequest(BaseModel):
    """Request model for loss parameters"""
    fiber_loss_per_km: float = Field(default=0.35, description="Fiber loss in dB/km", ge=0, le=2)
    splice_loss: float = Field(default=0.1, description="Splice loss in dB", ge=0, le=1)
    connector_loss: float = Field(default=0.5, description="Connector loss in dB", ge=0, le=2)
    safety_margin: float = Field(default=3.0, description="Safety margin in dB", ge=0, le=10)


class NetworkSegmentRequest(BaseModel):
    """Request model for network segment"""
    name: str = Field(..., description="Segment name")
    fiber_length_km: float = Field(..., description="Fiber length in kilometers", ge=0)
    splice_count: int = Field(..., description="Number of splices", ge=0)
    connector_count: int = Field(..., description="Number of connectors", ge=0)


class OPMAnalysisRequest(BaseModel):
    """Request model for OPM analysis"""
    optical_params: OpticalParamsRequest
    loss_params: LossParamsRequest
    segment: NetworkSegmentRequest


class MultiSegmentAnalysisRequest(BaseModel):
    """Request model for multiple segment analysis"""
    optical_params: OpticalParamsRequest
    loss_params: LossParamsRequest
    segments: List[NetworkSegmentRequest]


@router.post("/opm/calculate")
async def calculate_opm(request: OPMAnalysisRequest):
    """
    Calculate Optical Power Meter analysis for a network segment
    
    Returns power budget, loss budget, and quality assessment
    """
    try:
        calculator = OPMCalculator()
        
        # Convert request models to service models
        optical_params = OpticalParameters(
            tx_power=request.optical_params.tx_power,
            rx_sensitivity=request.optical_params.rx_sensitivity,
            wavelength=WavelengthType(request.optical_params.wavelength),
            fiber_type=FiberType(request.optical_params.fiber_type)
        )
        
        loss_params = LossParameters(
            fiber_loss_per_km=request.loss_params.fiber_loss_per_km,
            splice_loss=request.loss_params.splice_loss,
            connector_loss=request.loss_params.connector_loss,
            safety_margin=request.loss_params.safety_margin
        )
        
        segment = NetworkSegment(
            name=request.segment.name,
            fiber_length_km=request.segment.fiber_length_km,
            splice_count=request.segment.splice_count,
            connector_count=request.segment.connector_count
        )
        
        # Perform calculation
        result = calculator.calculate_power_budget(optical_params, loss_params, segment)
        
        # Get recommendations
        recommendations = calculator.get_recommendations(result)
        
        return {
            "status": "success",
            "result": {
                "power_budget_db": result.power_budget,
                "total_loss_db": result.total_loss,
                "available_margin_db": result.available_margin,
                "link_status": result.status,
                "quality_score": result.quality_score,
                "details": result.details
            },
            "recommendations": recommendations
        }
        
    except Exception as e:
        logger.error(f"Error in OPM calculation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error performing OPM calculation: {str(e)}"
        )


@router.post("/opm/multi-segment")
async def analyze_multi_segment(request: MultiSegmentAnalysisRequest):
    """
    Analyze multiple network segments
    
    Returns analysis for each segment with summary statistics
    """
    try:
        calculator = OPMCalculator()
        
        optical_params = OpticalParameters(
            tx_power=request.optical_params.tx_power,
            rx_sensitivity=request.optical_params.rx_sensitivity,
            wavelength=WavelengthType(request.optical_params.wavelength),
            fiber_type=FiberType(request.optical_params.fiber_type)
        )
        
        loss_params = LossParameters(
            fiber_loss_per_km=request.loss_params.fiber_loss_per_km,
            splice_loss=request.loss_params.splice_loss,
            connector_loss=request.loss_params.connector_loss,
            safety_margin=request.loss_params.safety_margin
        )
        
        segments = [
            NetworkSegment(
                name=seg.name,
                fiber_length_km=seg.fiber_length_km,
                splice_count=seg.splice_count,
                connector_count=seg.connector_count
            ) for seg in request.segments
        ]
        
        # Analyze all segments
        results = calculator.analyze_multiple_segments(optical_params, loss_params, segments)
        
        # Calculate summary statistics
        total_segments = len(results)
        ok_count = sum(1 for r in results if r.status == "OK")
        warning_count = sum(1 for r in results if r.status == "Warning")
        critical_count = sum(1 for r in results if r.status == "Critical")
        avg_quality = sum(r.quality_score for r in results) / total_segments if total_segments > 0 else 0
        
        return {
            "status": "success",
            "summary": {
                "total_segments": total_segments,
                "ok_count": ok_count,
                "warning_count": warning_count,
                "critical_count": critical_count,
                "average_quality_score": round(avg_quality, 2)
            },
            "segments": [
                {
                    "segment_name": r.details['segment_name'],
                    "power_budget_db": r.power_budget,
                    "total_loss_db": r.total_loss,
                    "available_margin_db": r.available_margin,
                    "link_status": r.status,
                    "quality_score": r.quality_score,
                    "recommendations": calculator.get_recommendations(r)
                } for r in results
            ]
        }
        
    except Exception as e:
        logger.error(f"Error in multi-segment analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error performing multi-segment analysis: {str(e)}"
        )


@router.post("/opm/max-distance")
async def calculate_max_distance(
    optical_params: OpticalParamsRequest,
    loss_params: LossParamsRequest,
    splice_count: int = 0,
    connector_count: int = 2
):
    """
    Calculate maximum allowable fiber distance
    
    Given optical and loss parameters, calculate the maximum distance possible
    """
    try:
        calculator = OPMCalculator()
        
        optical = OpticalParameters(
            tx_power=optical_params.tx_power,
            rx_sensitivity=optical_params.rx_sensitivity,
            wavelength=WavelengthType(optical_params.wavelength),
            fiber_type=FiberType(optical_params.fiber_type)
        )
        
        loss = LossParameters(
            fiber_loss_per_km=loss_params.fiber_loss_per_km,
            splice_loss=loss_params.splice_loss,
            connector_loss=loss_params.connector_loss,
            safety_margin=loss_params.safety_margin
        )
        
        max_distance = calculator.calculate_max_distance(
            optical, loss, splice_count, connector_count
        )
        
        return {
            "status": "success",
            "max_distance_km": round(max_distance, 2),
            "max_distance_m": round(max_distance * 1000, 2),
            "parameters": {
                "splice_count": splice_count,
                "connector_count": connector_count,
                "power_budget_db": optical.tx_power - optical.rx_sensitivity
            }
        }
        
    except Exception as e:
        logger.error(f"Error calculating max distance: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating max distance: {str(e)}"
        )
