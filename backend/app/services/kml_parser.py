"""
KML Parser Service
Parse Google Earth KML files and extract network infrastructure data
"""

import logging
from typing import Dict, List, Optional, Tuple
from xml.etree import ElementTree as ET
from dataclasses import dataclass
import re

logger = logging.getLogger(__name__)


@dataclass
class Coordinate:
    """Geographic coordinate"""
    longitude: float
    latitude: float
    altitude: float = 0.0


@dataclass
class Pole:
    """Tiang (Utility Pole)"""
    name: str
    designator: str
    construction_status: str
    material_type: str
    usage: str
    coordinates: Coordinate


@dataclass
class ODP:
    """Optical Distribution Point"""
    name: str
    specification: str
    splice_type: str
    construction_status: str
    coordinates: Coordinate


@dataclass
class Cable:
    """Fiber Optic Cable"""
    name: str
    specification: str
    number_of_cores: int
    fiber_length: float  # meters
    construction_status: str
    coordinates: List[Coordinate]  # LineString


@dataclass
class NetworkData:
    """Complete network data from KML"""
    poles: List[Pole]
    odps: List[ODP]
    cables: List[Cable]
    raw_placemarks: List[Dict]


class KMLParser:
    """Parser for Google Earth KML files containing fiber network data"""
    
    # KML namespace
    NS = {
        'kml': 'http://www.opengis.net/kml/2.2',
        'gx': 'http://www.google.com/kml/ext/2.2'
    }
    
    def __init__(self):
        self.poles: List[Pole] = []
        self.odps: List[ODP] = []
        self.cables: List[Cable] = []
        self.raw_placemarks: List[Dict] = []
    
    def parse_file(self, file_path: str) -> NetworkData:
        """
        Parse KML file and extract network infrastructure
        
        Args:
            file_path: Path to KML file
            
        Returns:
            NetworkData object containing all parsed elements
        """
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Find all Placemark elements
            placemarks = root.findall('.//kml:Placemark', self.NS)
            logger.info(f"Found {len(placemarks)} placemarks in KML")
            
            for placemark in placemarks:
                self._parse_placemark(placemark)
            
            logger.info(f"Parsed: {len(self.poles)} poles, {len(self.odps)} ODPs, {len(self.cables)} cables")
            
            return NetworkData(
                poles=self.poles,
                odps=self.odps,
                cables=self.cables,
                raw_placemarks=self.raw_placemarks
            )
            
        except Exception as e:
            logger.error(f"Error parsing KML file: {e}")
            raise
    
    def _parse_placemark(self, placemark: ET.Element) -> None:
        """Parse individual Placemark element"""
        try:
            name_elem = placemark.find('kml:name', self.NS)
            name = name_elem.text if name_elem is not None else "Unknown"
            
            desc_elem = placemark.find('kml:description', self.NS)
            description = desc_elem.text if desc_elem is not None else ""
            
            # Determine type and parse accordingly
            if self._is_pole(name, description):
                pole = self._parse_pole(placemark, name, description)
                if pole:
                    self.poles.append(pole)
                    
            elif self._is_odp(name, description):
                odp = self._parse_odp(placemark, name, description)
                if odp:
                    self.odps.append(odp)
                    
            elif self._is_cable(name, description):
                cable = self._parse_cable(placemark, name, description)
                if cable:
                    self.cables.append(cable)
            
            # Store raw data
            self.raw_placemarks.append({
                'name': name,
                'description': description,
                'type': self._determine_type(name, description)
            })
            
        except Exception as e:
            logger.warning(f"Error parsing placemark: {e}")
    
    def _is_pole(self, name: str, description: str) -> bool:
        """Check if placemark is a pole/tiang"""
        pole_indicators = ['tiang', 'pole', 'PU-', 'designator:pu']
        name_lower = name.lower()
        desc_lower = description.lower()
        return any(ind in name_lower or ind in desc_lower for ind in pole_indicators)
    
    def _is_odp(self, name: str, description: str) -> bool:
        """Check if placemark is an ODP"""
        odp_indicators = ['odp', 'optical distribution', 'splice']
        name_lower = name.lower()
        desc_lower = description.lower()
        return any(ind in name_lower or ind in desc_lower for ind in odp_indicators)
    
    def _is_cable(self, name: str, description: str) -> bool:
        """Check if placemark is a cable"""
        cable_indicators = ['cable', 'kabel', 'fiber length', 'number of core', 'adss']
        name_lower = name.lower()
        desc_lower = description.lower()
        return any(ind in name_lower or ind in desc_lower for ind in cable_indicators)
    
    def _parse_pole(self, placemark: ET.Element, name: str, description: str) -> Optional[Pole]:
        """Parse pole/tiang data"""
        try:
            # Extract coordinates
            point = placemark.find('.//kml:Point/kml:coordinates', self.NS)
            if point is None:
                return None
            
            coords = self._parse_coordinates(point.text)
            if not coords:
                return None
            
            # Parse description fields
            designator = self._extract_field(description, 'Designator')
            construction_status = self._extract_field(description, 'Construction Status')
            material_type = self._extract_field(description, 'Material Type')
            usage = self._extract_field(description, 'Usage')
            
            return Pole(
                name=name,
                designator=designator or name,
                construction_status=construction_status or 'Unknown',
                material_type=material_type or 'Unknown',
                usage=usage or 'Telco',
                coordinates=coords[0]
            )
        except Exception as e:
            logger.warning(f"Error parsing pole {name}: {e}")
            return None
    
    def _parse_odp(self, placemark: ET.Element, name: str, description: str) -> Optional[ODP]:
        """Parse ODP data"""
        try:
            point = placemark.find('.//kml:Point/kml:coordinates', self.NS)
            if point is None:
                return None
            
            coords = self._parse_coordinates(point.text)
            if not coords:
                return None
            
            specification = self._extract_field(description, 'Specification ID')
            splice_type = self._extract_field(description, 'Splice Type')
            construction_status = self._extract_field(description, 'Construction Status')
            
            return ODP(
                name=name,
                specification=specification or 'Unknown',
                splice_type=splice_type or 'Unknown',
                construction_status=construction_status or 'Unknown',
                coordinates=coords[0]
            )
        except Exception as e:
            logger.warning(f"Error parsing ODP {name}: {e}")
            return None
    
    def _parse_cable(self, placemark: ET.Element, name: str, description: str) -> Optional[Cable]:
        """Parse cable data"""
        try:
            # Cables are LineStrings
            linestring = placemark.find('.//kml:LineString/kml:coordinates', self.NS)
            if linestring is None:
                return None
            
            coords = self._parse_coordinates(linestring.text)
            if not coords:
                return None
            
            specification = self._extract_field(description, 'Specification')
            cores_str = self._extract_field(description, 'Number of Core')
            length_str = self._extract_field(description, 'Fiber Length')
            construction_status = self._extract_field(description, 'Construction Status')
            
            # Parse numeric values
            cores = int(cores_str) if cores_str and cores_str.isdigit() else 0
            length = self._parse_length(length_str) if length_str else 0.0
            
            return Cable(
                name=name,
                specification=specification or 'Unknown',
                number_of_cores=cores,
                fiber_length=length,
                construction_status=construction_status or 'Unknown',
                coordinates=coords
            )
        except Exception as e:
            logger.warning(f"Error parsing cable {name}: {e}")
            return None
    
    def _parse_coordinates(self, coord_text: str) -> List[Coordinate]:
        """Parse coordinate string to Coordinate objects"""
        if not coord_text:
            return []
        
        coords = []
        # Split by whitespace and newlines
        coord_parts = coord_text.strip().split()
        
        for part in coord_parts:
            try:
                values = part.split(',')
                if len(values) >= 2:
                    lon = float(values[0])
                    lat = float(values[1])
                    alt = float(values[2]) if len(values) > 2 else 0.0
                    coords.append(Coordinate(lon, lat, alt))
            except (ValueError, IndexError):
                continue
        
        return coords
    
    def _extract_field(self, description: str, field_name: str) -> Optional[str]:
        """Extract field value from description text"""
        # Match pattern like "Field Name: Value" or "Field Name:Value"
        pattern = rf'{field_name}\s*:\s*([^\n]+)'
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return None
    
    def _parse_length(self, length_str: str) -> float:
        """Parse length string (e.g., '123m', '1.5km')"""
        try:
            # Remove 'm' or 'meter' and convert
            length_str = length_str.lower().replace('meter', '').replace('m', '').strip()
            if 'km' in length_str:
                length_str = length_str.replace('km', '').strip()
                return float(length_str) * 1000
            return float(length_str)
        except:
            return 0.0
    
    def _determine_type(self, name: str, description: str) -> str:
        """Determine infrastructure type"""
        if self._is_pole(name, description):
            return 'pole'
        elif self._is_odp(name, description):
            return 'odp'
        elif self._is_cable(name, description):
            return 'cable'
        return 'unknown'
    
    def get_statistics(self) -> Dict:
        """Get parsing statistics"""
        return {
            'total_poles': len(self.poles),
            'total_odps': len(self.odps),
            'total_cables': len(self.cables),
            'poles_in_service': len([p for p in self.poles if 'service' in p.construction_status.lower()]),
            'poles_planned': len([p for p in self.poles if 'planned' in p.construction_status.lower()]),
            'total_cable_length_m': sum(c.fiber_length for c in self.cables),
            'total_cable_length_km': sum(c.fiber_length for c in self.cables) / 1000,
        }
