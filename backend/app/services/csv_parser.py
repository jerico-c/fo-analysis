"""
CSV Parser Service for OPM/ATP Measurement Data
Parse field measurement results (As-Built data)
"""

import logging
import csv
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import re

logger = logging.getLogger(__name__)


@dataclass
class OPMMeasurement:
    """OPM (Optical Power Meter) measurement result"""
    cable_id: str
    segment_name: str
    measurement_date: Optional[str]
    tx_power_dbm: float
    rx_power_dbm: float
    loss_db: float
    length_km: float
    wavelength_nm: int
    status: str  # "Pass", "Fail", "Warning"
    remarks: Optional[str]
    measured_by: Optional[str]


@dataclass
class ATPMeasurement:
    """ATP (Acceptance Test Procedure) result"""
    odp_id: str
    test_date: Optional[str]
    optical_loss_db: float
    reflectance_db: Optional[float]
    test_result: str  # "Pass", "Fail"
    fiber_core: int
    remarks: Optional[str]


@dataclass
class MeasurementData:
    """Complete measurement data from CSV"""
    opm_measurements: List[OPMMeasurement]
    atp_measurements: List[ATPMeasurement]
    summary: Dict


class CSVMeasurementParser:
    """Parser for OPM/ATP measurement CSV files"""
    
    def __init__(self):
        self.opm_measurements: List[OPMMeasurement] = []
        self.atp_measurements: List[ATPMeasurement] = []
    
    def parse_opm_csv(self, file_path: str) -> List[OPMMeasurement]:
        """
        Parse OPM measurement CSV file
        
        Expected columns:
        Cable ID, Segment, Date, Tx Power (dBm), Rx Power (dBm), 
        Loss (dB), Length (km), Wavelength (nm), Status, Remarks, Measured By
        """
        try:
            measurements = []
            
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    try:
                        # Parse with flexible column names
                        measurement = OPMMeasurement(
                            cable_id=self._get_value(row, ['Cable ID', 'CableID', 'Cable_ID', 'cable_id']),
                            segment_name=self._get_value(row, ['Segment', 'Segment Name', 'segment']),
                            measurement_date=self._get_value(row, ['Date', 'Measurement Date', 'date']),
                            tx_power_dbm=float(self._get_value(row, ['Tx Power (dBm)', 'Tx Power', 'tx_power'], '0')),
                            rx_power_dbm=float(self._get_value(row, ['Rx Power (dBm)', 'Rx Power', 'rx_power'], '0')),
                            loss_db=float(self._get_value(row, ['Loss (dB)', 'Loss', 'loss'], '0')),
                            length_km=float(self._get_value(row, ['Length (km)', 'Length', 'length'], '0')),
                            wavelength_nm=int(self._get_value(row, ['Wavelength (nm)', 'Wavelength', 'wavelength'], '1550')),
                            status=self._get_value(row, ['Status', 'Test Status', 'status'], 'Unknown'),
                            remarks=self._get_value(row, ['Remarks', 'Notes', 'remarks']),
                            measured_by=self._get_value(row, ['Measured By', 'Technician', 'measured_by'])
                        )
                        measurements.append(measurement)
                    except (ValueError, KeyError) as e:
                        logger.warning(f"Error parsing row: {e}")
                        continue
            
            logger.info(f"Parsed {len(measurements)} OPM measurements")
            return measurements
            
        except Exception as e:
            logger.error(f"Error parsing OPM CSV: {e}")
            raise
    
    def parse_atp_csv(self, file_path: str) -> List[ATPMeasurement]:
        """
        Parse ATP measurement CSV file
        
        Expected columns:
        ODP ID, Test Date, Optical Loss (dB), Reflectance (dB), 
        Test Result, Fiber Core, Remarks
        """
        try:
            measurements = []
            
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    try:
                        measurement = ATPMeasurement(
                            odp_id=self._get_value(row, ['ODP ID', 'ODP_ID', 'odp_id']),
                            test_date=self._get_value(row, ['Test Date', 'Date', 'test_date']),
                            optical_loss_db=float(self._get_value(row, ['Optical Loss (dB)', 'Loss', 'optical_loss'], '0')),
                            reflectance_db=self._parse_float(self._get_value(row, ['Reflectance (dB)', 'Reflectance', 'reflectance'])),
                            test_result=self._get_value(row, ['Test Result', 'Result', 'test_result'], 'Unknown'),
                            fiber_core=int(self._get_value(row, ['Fiber Core', 'Core', 'fiber_core'], '1')),
                            remarks=self._get_value(row, ['Remarks', 'Notes', 'remarks'])
                        )
                        measurements.append(measurement)
                    except (ValueError, KeyError) as e:
                        logger.warning(f"Error parsing ATP row: {e}")
                        continue
            
            logger.info(f"Parsed {len(measurements)} ATP measurements")
            return measurements
            
        except Exception as e:
            logger.error(f"Error parsing ATP CSV: {e}")
            raise
    
    def _get_value(self, row: Dict, possible_keys: List[str], default: str = "") -> str:
        """Get value from row with flexible key matching"""
        for key in possible_keys:
            if key in row and row[key]:
                return row[key].strip()
        return default
    
    def _parse_float(self, value: str) -> Optional[float]:
        """Parse float with error handling"""
        try:
            return float(value) if value else None
        except:
            return None
    
    def get_summary(self, measurements: List[OPMMeasurement]) -> Dict:
        """Generate summary statistics for OPM measurements"""
        if not measurements:
            return {}
        
        total = len(measurements)
        passed = sum(1 for m in measurements if m.status.lower() == 'pass')
        failed = sum(1 for m in measurements if m.status.lower() == 'fail')
        warning = sum(1 for m in measurements if m.status.lower() == 'warning')
        
        avg_loss = sum(m.loss_db for m in measurements) / total
        avg_length = sum(m.length_km for m in measurements) / total
        
        return {
            'total_measurements': total,
            'passed': passed,
            'failed': failed,
            'warning': warning,
            'pass_rate': round(passed / total * 100, 2) if total > 0 else 0,
            'average_loss_db': round(avg_loss, 2),
            'average_length_km': round(avg_length, 2),
            'total_length_km': round(sum(m.length_km for m in measurements), 2)
        }
