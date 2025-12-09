"""
Upload API Endpoints
Handle file uploads for KML, ABD, and OPM data
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import Optional
import os
import logging
from pathlib import Path

from app.core.config import settings
from app.services.kml_parser import KMLParser
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

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@router.post("/kml")
async def upload_kml(
    file: UploadFile = File(...),
    project_name: Optional[str] = Form(None)
):
    """
    Upload and parse KML file from Google Earth
    
    Returns parsed network infrastructure data
    """
    try:
        # Validate file extension
        if not file.filename.endswith(('.kml', '.kmz')):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only .kml and .kmz files are allowed"
            )
        
        # Save uploaded file
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"Uploaded KML file: {file.filename}")
        
        # Parse KML file
        parser = KMLParser()
        network_data = parser.parse_file(file_path)
        stats = parser.get_statistics()
        
        # Auto-calculate OPM analysis for each cable
        opm_calculator = OPMCalculator()
        opm_results = []
        
        # Standard optical parameters (Telkom Access standard)
        optical_params = OpticalParameters(
            tx_power=3.0,  # dBm (typical OLT)
            rx_sensitivity=-28.0,  # dBm (typical ONT)
            wavelength=WavelengthType.NM_1550,
            fiber_type=FiberType.SINGLE_MODE
        )
        
        # Loss parameters based on table (Tabel 2: Loss Maksimum)
        loss_params = LossParameters(
            fiber_loss_per_km=0.35,  # dB/km @ 1550nm
            splice_loss=0.1,  # dB per splice (Max 0.1 dB)
            connector_loss=0.25,  # dB per connector (Connector Case: 0.25 dB)
            safety_margin=3.0  # dB
        )
        
        # Calculate for each cable segment
        total_network_loss = 0
        for cable in network_data.cables:
            # Estimate splice count (1 splice per 2km approximately)
            estimated_splices = max(2, int(cable.fiber_length / 2000))  # minimum 2 splices
            
            segment = NetworkSegment(
                fiber_length_km=cable.fiber_length / 1000,  # convert m to km
                splice_count=estimated_splices,
                connector_count=2,  # 1 at each end
                name=cable.name
            )
            
            result = opm_calculator.calculate_power_budget(
                optical_params,
                loss_params,
                segment
            )
            
            opm_results.append({
                "cable_name": cable.name,
                "power_budget_db": result.power_budget,
                "total_loss_db": result.total_loss,
                "available_margin_db": result.available_margin,
                "status": result.status,
                "quality_score": result.quality_score,
                "details": result.details
            })
            
            total_network_loss += result.total_loss
        
        # Calculate average quality score
        avg_quality_score = (
            sum(r["quality_score"] for r in opm_results) / len(opm_results)
            if opm_results else 0
        )
        
        # Convert to JSON-serializable format
        response_data = {
            "status": "success",
            "message": "KML file parsed successfully",
            "filename": file.filename,
            "project_name": project_name or "Untitled Project",
            "statistics": stats,
            "opm_analysis": {
                "results": opm_results,
                "summary": {
                    "total_segments": len(opm_results),
                    "average_quality_score": round(avg_quality_score, 2),
                    "total_network_loss_db": round(total_network_loss, 2),
                    "optical_parameters": {
                        "tx_power_dbm": optical_params.tx_power,
                        "rx_sensitivity_dbm": optical_params.rx_sensitivity,
                        "wavelength": optical_params.wavelength.value
                    },
                    "loss_standards": {
                        "fiber_loss_per_km_db": loss_params.fiber_loss_per_km,
                        "splice_loss_db": loss_params.splice_loss,
                        "connector_loss_db": loss_params.connector_loss,
                        "safety_margin_db": loss_params.safety_margin
                    }
                }
            },
            "data": {
                "poles": [
                    {
                        "name": p.name,
                        "designator": p.designator,
                        "construction_status": p.construction_status,
                        "material_type": p.material_type,
                        "usage": p.usage,
                        "coordinates": {
                            "longitude": p.coordinates.longitude,
                            "latitude": p.coordinates.latitude,
                            "altitude": p.coordinates.altitude
                        }
                    } for p in network_data.poles
                ],
                "odps": [
                    {
                        "name": o.name,
                        "specification": o.specification,
                        "splice_type": o.splice_type,
                        "construction_status": o.construction_status,
                        "coordinates": {
                            "longitude": o.coordinates.longitude,
                            "latitude": o.coordinates.latitude,
                            "altitude": o.coordinates.altitude
                        }
                    } for o in network_data.odps
                ],
                "cables": [
                    {
                        "name": c.name,
                        "specification": c.specification,
                        "number_of_cores": c.number_of_cores,
                        "fiber_length_m": c.fiber_length,
                        "fiber_length_km": c.fiber_length / 1000,
                        "construction_status": c.construction_status,
                        "coordinates": [
                            {
                                "longitude": coord.longitude,
                                "latitude": coord.latitude,
                                "altitude": coord.altitude
                            } for coord in c.coordinates
                        ]
                    } for c in network_data.cables
                ]
            }
        }
        
        return JSONResponse(content=response_data)
        
    except Exception as e:
        logger.error(f"Error processing KML file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing KML file: {str(e)}"
        )


@router.post("/abd")
async def upload_abd(
    file: UploadFile = File(...),
    project_name: Optional[str] = Form(None)
):
    """
    Upload As Built Drawing (ABD) file
    
    Typically Excel/PDF format with network documentation
    """
    try:
        if not any(file.filename.endswith(ext) for ext in ['.xlsx', '.xls', '.pdf']):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only .xlsx, .xls, and .pdf files are allowed"
            )
        
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"Uploaded ABD file: {file.filename}")
        
        return {
            "status": "success",
            "message": "ABD file uploaded successfully",
            "filename": file.filename,
            "project_name": project_name or "Untitled Project"
        }
        
    except Exception as e:
        logger.error(f"Error uploading ABD file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading ABD file: {str(e)}"
        )


@router.get("/list")
async def list_uploads():
    """List all uploaded files"""
    try:
        files = []
        upload_dir = Path(settings.UPLOAD_DIR)
        
        for file_path in upload_dir.iterdir():
            if file_path.is_file():
                files.append({
                    "filename": file_path.name,
                    "size_bytes": file_path.stat().st_size,
                    "modified": file_path.stat().st_mtime
                })
        
        return {
            "status": "success",
            "count": len(files),
            "files": files
        }
        
    except Exception as e:
        logger.error(f"Error listing uploads: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error listing uploads: {str(e)}"
        )
