"""
Comparison API Endpoints
Handle As-Planned vs As-Built network comparison
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import Optional, List
import os
import logging
from pathlib import Path

from app.core.config import settings
from app.services.kml_parser import KMLParser
from app.services.csv_parser import CSVMeasurementParser
from app.services.comparison_service import AsPlannedVsAsBuiltComparator

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload-asplanned")
async def upload_as_planned(
    kml_file: UploadFile = File(...),
    project_name: str = Form(...)
):
    """
    Upload As-Planned KML file (design/planning data)
    """
    try:
        if not kml_file.filename.endswith(('.kml', '.kmz')):
            raise HTTPException(status_code=400, detail="Only KML/KMZ files allowed")
        
        # Save with as-planned prefix
        filename = f"asplanned_{project_name}_{kml_file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as f:
            content = await kml_file.read()
            f.write(content)
        
        # Parse KML
        parser = KMLParser()
        network_data = parser.parse_file(file_path)
        stats = parser.get_statistics()
        
        return {
            "status": "success",
            "message": "As-Planned KML uploaded successfully",
            "filename": filename,
            "project_name": project_name,
            "data_type": "as-planned",
            "statistics": stats
        }
        
    except Exception as e:
        logger.error(f"Error uploading As-Planned KML: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-asbuilt")
async def upload_as_built(
    kml_file: UploadFile = File(...),
    opm_csv: Optional[UploadFile] = File(None),
    atp_csv: Optional[UploadFile] = File(None),
    project_name: str = Form(...)
):
    """
    Upload As-Built data:
    - KML file (actual field implementation)
    - OPM CSV (measurement results) - optional
    - ATP CSV (acceptance test) - optional
    """
    try:
        result = {
            "status": "success",
            "data_type": "as-built",
            "project_name": project_name,
            "files_uploaded": []
        }
        
        # Save and parse KML
        if not kml_file.filename.endswith(('.kml', '.kmz')):
            raise HTTPException(status_code=400, detail="KML file must be .kml or .kmz")
        
        kml_filename = f"asbuilt_{project_name}_{kml_file.filename}"
        kml_path = os.path.join(settings.UPLOAD_DIR, kml_filename)
        
        with open(kml_path, "wb") as f:
            content = await kml_file.read()
            f.write(content)
        
        parser = KMLParser()
        network_data = parser.parse_file(kml_path)
        stats = parser.get_statistics()
        
        result['kml_statistics'] = stats
        result['files_uploaded'].append(kml_filename)
        
        # Parse OPM CSV if provided
        if opm_csv and opm_csv.filename:
            if not opm_csv.filename.endswith('.csv'):
                raise HTTPException(status_code=400, detail="OPM file must be CSV")
            
            opm_filename = f"opm_{project_name}_{opm_csv.filename}"
            opm_path = os.path.join(settings.UPLOAD_DIR, opm_filename)
            
            with open(opm_path, "wb") as f:
                content = await opm_csv.read()
                f.write(content)
            
            csv_parser = CSVMeasurementParser()
            opm_measurements = csv_parser.parse_opm_csv(opm_path)
            opm_summary = csv_parser.get_summary(opm_measurements)
            
            result['opm_summary'] = opm_summary
            result['files_uploaded'].append(opm_filename)
        
        # Parse ATP CSV if provided
        if atp_csv and atp_csv.filename:
            if not atp_csv.filename.endswith('.csv'):
                raise HTTPException(status_code=400, detail="ATP file must be CSV")
            
            atp_filename = f"atp_{project_name}_{atp_csv.filename}"
            atp_path = os.path.join(settings.UPLOAD_DIR, atp_filename)
            
            with open(atp_path, "wb") as f:
                content = await atp_csv.read()
                f.write(content)
            
            csv_parser = CSVMeasurementParser()
            atp_measurements = csv_parser.parse_atp_csv(atp_path)
            
            result['atp_count'] = len(atp_measurements)
            result['files_uploaded'].append(atp_filename)
        
        return result
        
    except Exception as e:
        logger.error(f"Error uploading As-Built data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare")
async def compare_planned_vs_built(
    project_name: str = Form(...)
):
    """
    Compare As-Planned vs As-Built data for a project
    Returns detailed comparison analysis
    """
    try:
        # Find files for the project
        upload_dir = Path(settings.UPLOAD_DIR)
        
        # Find As-Planned KML
        planned_files = list(upload_dir.glob(f"asplanned_{project_name}_*.kml"))
        if not planned_files:
            raise HTTPException(
                status_code=404,
                detail=f"As-Planned KML not found for project: {project_name}"
            )
        planned_kml = str(planned_files[0])
        
        # Find As-Built KML
        built_files = list(upload_dir.glob(f"asbuilt_{project_name}_*.kml"))
        if not built_files:
            raise HTTPException(
                status_code=404,
                detail=f"As-Built KML not found for project: {project_name}"
            )
        built_kml = str(built_files[0])
        
        # Parse both KML files
        parser = KMLParser()
        
        planned_data = parser.parse_file(planned_kml)
        planned_dict = {
            'cables': [
                {
                    'name': c.name,
                    'fiber_length_km': c.fiber_length / 1000,
                    'construction_status': c.construction_status,
                    'specification': c.specification
                } for c in planned_data.cables
            ]
        }
        
        built_data = parser.parse_file(built_kml)
        built_dict = {
            'cables': [
                {
                    'name': c.name,
                    'fiber_length_km': c.fiber_length / 1000,
                    'construction_status': c.construction_status,
                    'specification': c.specification
                } for c in built_data.cables
            ]
        }
        
        # Find OPM measurements if available
        opm_files = list(upload_dir.glob(f"opm_{project_name}_*.csv"))
        opm_measurements = []
        if opm_files:
            csv_parser = CSVMeasurementParser()
            opm_measurements = csv_parser.parse_opm_csv(str(opm_files[0]))
        
        # Perform comparison
        comparator = AsPlannedVsAsBuiltComparator()
        comparison = comparator.compare_networks(
            planned_dict,
            built_dict,
            opm_measurements if opm_measurements else None
        )
        
        # Convert to JSON-serializable format
        return {
            "status": "success",
            "project_name": project_name,
            "summary": comparison.summary,
            "comparisons": [
                {
                    "cable_id": c.cable_id,
                    "planned_length_km": round(c.planned_length_km, 3),
                    "built_length_km": round(c.built_length_km, 3),
                    "length_variance_km": round(c.length_variance_km, 3),
                    "length_variance_pct": round(c.length_variance_pct, 2),
                    "planned_status": c.planned_status,
                    "built_status": c.built_status,
                    "status_match": c.status_match,
                    "measured_loss_db": round(c.measured_loss_db, 2) if c.measured_loss_db else None,
                    "compliance_status": c.compliance_status,
                    "remarks": c.remarks
                } for c in comparison.cable_comparisons
            ],
            "discrepancies": comparison.discrepancies,
            "recommendations": comparison.recommendations
        }
        
    except Exception as e:
        logger.error(f"Error comparing networks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects")
async def list_projects():
    """List all projects with As-Planned/As-Built data"""
    try:
        upload_dir = Path(settings.UPLOAD_DIR)
        projects = {}
        
        # Find all files and group by project
        for file in upload_dir.glob("*"):
            if file.is_file() and file.suffix in ['.kml', '.kmz', '.csv']:
                parts = file.stem.split('_', 2)
                if len(parts) >= 2:
                    data_type = parts[0]  # asplanned, asbuilt, opm, atp
                    project_name = parts[1]
                    
                    if project_name not in projects:
                        projects[project_name] = {
                            'name': project_name,
                            'has_asplanned': False,
                            'has_asbuilt': False,
                            'has_opm': False,
                            'has_atp': False,
                            'files': []
                        }
                    
                    projects[project_name]['files'].append(file.name)
                    
                    if data_type == 'asplanned':
                        projects[project_name]['has_asplanned'] = True
                    elif data_type == 'asbuilt':
                        projects[project_name]['has_asbuilt'] = True
                    elif data_type == 'opm':
                        projects[project_name]['has_opm'] = True
                    elif data_type == 'atp':
                        projects[project_name]['has_atp'] = True
        
        return {
            "status": "success",
            "projects": list(projects.values())
        }
        
    except Exception as e:
        logger.error(f"Error listing projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))
