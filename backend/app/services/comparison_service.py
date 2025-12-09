"""
As-Planned vs As-Built Comparison Service
Compare planned network design with actual field implementation
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import math

logger = logging.getLogger(__name__)


@dataclass
class ComparisonResult:
    """Result of comparing planned vs built network"""
    cable_id: str
    planned_length_km: float
    built_length_km: float
    length_variance_km: float
    length_variance_pct: float
    planned_status: str
    built_status: str
    status_match: bool
    planned_loss_db: Optional[float]
    measured_loss_db: Optional[float]
    loss_variance_db: Optional[float]
    compliance_status: str  # "Compliant", "Minor Deviation", "Major Deviation"
    remarks: List[str]


@dataclass
class NetworkComparison:
    """Complete network comparison data"""
    cable_comparisons: List[ComparisonResult]
    summary: Dict
    discrepancies: List[Dict]
    recommendations: List[str]


class AsPlannedVsAsBuiltComparator:
    """Compare As-Planned (KML) with As-Built (KML + CSV) data"""
    
    # Tolerance thresholds
    LENGTH_TOLERANCE_PCT = 5.0  # 5% length tolerance
    LOSS_TOLERANCE_DB = 0.5  # 0.5 dB loss tolerance
    
    def __init__(self):
        pass
    
    def compare_networks(
        self,
        planned_data: Dict,
        built_data: Dict,
        opm_measurements: Optional[List] = None
    ) -> NetworkComparison:
        """
        Compare planned network with as-built data
        
        Args:
            planned_data: Parsed KML data (As-Planned)
            built_data: Parsed KML data (As-Built)
            opm_measurements: OPM measurement results (optional)
            
        Returns:
            NetworkComparison with detailed analysis
        """
        try:
            cable_comparisons = []
            
            # Create cable lookup dictionaries
            planned_cables = {c['name']: c for c in planned_data.get('cables', [])}
            built_cables = {c['name']: c for c in built_data.get('cables', [])}
            
            # Create OPM measurement lookup if available
            opm_lookup = {}
            if opm_measurements:
                for m in opm_measurements:
                    opm_lookup[m.cable_id] = m
            
            # Compare each planned cable
            for cable_name, planned_cable in planned_cables.items():
                built_cable = built_cables.get(cable_name)
                opm_data = opm_lookup.get(cable_name)
                
                comparison = self._compare_cable(
                    cable_name,
                    planned_cable,
                    built_cable,
                    opm_data
                )
                cable_comparisons.append(comparison)
            
            # Check for cables in built but not in planned
            for cable_name in built_cables:
                if cable_name not in planned_cables:
                    comparison = self._create_unplanned_cable_result(
                        cable_name,
                        built_cables[cable_name],
                        opm_lookup.get(cable_name)
                    )
                    cable_comparisons.append(comparison)
            
            # Generate summary and recommendations
            summary = self._generate_summary(cable_comparisons)
            discrepancies = self._identify_discrepancies(cable_comparisons)
            recommendations = self._generate_recommendations(cable_comparisons, summary)
            
            return NetworkComparison(
                cable_comparisons=cable_comparisons,
                summary=summary,
                discrepancies=discrepancies,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error comparing networks: {e}")
            raise
    
    def _compare_cable(
        self,
        cable_name: str,
        planned: Dict,
        built: Optional[Dict],
        opm: Optional[any]
    ) -> ComparisonResult:
        """Compare single cable planned vs built"""
        
        planned_length = planned.get('fiber_length_km', 0)
        planned_status = planned.get('construction_status', 'Unknown')
        planned_loss = None  # Can be calculated from planned parameters
        
        if not built:
            # Cable planned but not built
            return ComparisonResult(
                cable_id=cable_name,
                planned_length_km=planned_length,
                built_length_km=0,
                length_variance_km=-planned_length,
                length_variance_pct=-100.0,
                planned_status=planned_status,
                built_status='Not Built',
                status_match=False,
                planned_loss_db=planned_loss,
                measured_loss_db=None,
                loss_variance_db=None,
                compliance_status='Major Deviation',
                remarks=['Cable planned but not built']
            )
        
        built_length = built.get('fiber_length_km', 0)
        built_status = built.get('construction_status', 'Unknown')
        
        # Calculate variances
        length_variance_km = built_length - planned_length
        length_variance_pct = (length_variance_km / planned_length * 100) if planned_length > 0 else 0
        
        status_match = planned_status.lower() == built_status.lower()
        
        # OPM data comparison
        measured_loss = opm.loss_db if opm else None
        loss_variance = None
        
        remarks = []
        
        # Determine compliance status
        if abs(length_variance_pct) <= self.LENGTH_TOLERANCE_PCT:
            if measured_loss is None or (planned_loss and abs(measured_loss - planned_loss) <= self.LOSS_TOLERANCE_DB):
                compliance_status = 'Compliant'
            else:
                compliance_status = 'Minor Deviation'
                remarks.append(f'Loss variance detected')
        elif abs(length_variance_pct) <= self.LENGTH_TOLERANCE_PCT * 2:
            compliance_status = 'Minor Deviation'
            remarks.append(f'Length variance: {length_variance_pct:.1f}%')
        else:
            compliance_status = 'Major Deviation'
            remarks.append(f'Significant length variance: {length_variance_pct:.1f}%')
        
        if not status_match:
            remarks.append(f'Status mismatch: {planned_status} → {built_status}')
        
        return ComparisonResult(
            cable_id=cable_name,
            planned_length_km=planned_length,
            built_length_km=built_length,
            length_variance_km=length_variance_km,
            length_variance_pct=length_variance_pct,
            planned_status=planned_status,
            built_status=built_status,
            status_match=status_match,
            planned_loss_db=planned_loss,
            measured_loss_db=measured_loss,
            loss_variance_db=loss_variance,
            compliance_status=compliance_status,
            remarks=remarks
        )
    
    def _create_unplanned_cable_result(
        self,
        cable_name: str,
        built: Dict,
        opm: Optional[any]
    ) -> ComparisonResult:
        """Create result for cable built but not planned"""
        built_length = built.get('fiber_length_km', 0)
        built_status = built.get('construction_status', 'Unknown')
        measured_loss = opm.loss_db if opm else None
        
        return ComparisonResult(
            cable_id=cable_name,
            planned_length_km=0,
            built_length_km=built_length,
            length_variance_km=built_length,
            length_variance_pct=100.0,
            planned_status='Not Planned',
            built_status=built_status,
            status_match=False,
            planned_loss_db=None,
            measured_loss_db=measured_loss,
            loss_variance_db=None,
            compliance_status='Major Deviation',
            remarks=['Cable built but not in original plan']
        )
    
    def _generate_summary(self, comparisons: List[ComparisonResult]) -> Dict:
        """Generate summary statistics"""
        total = len(comparisons)
        if total == 0:
            return {}
        
        compliant = sum(1 for c in comparisons if c.compliance_status == 'Compliant')
        minor_dev = sum(1 for c in comparisons if c.compliance_status == 'Minor Deviation')
        major_dev = sum(1 for c in comparisons if c.compliance_status == 'Major Deviation')
        
        total_planned_length = sum(c.planned_length_km for c in comparisons)
        total_built_length = sum(c.built_length_km for c in comparisons)
        
        return {
            'total_cables': total,
            'compliant': compliant,
            'minor_deviations': minor_dev,
            'major_deviations': major_dev,
            'compliance_rate': round(compliant / total * 100, 2),
            'total_planned_length_km': round(total_planned_length, 2),
            'total_built_length_km': round(total_built_length, 2),
            'overall_length_variance_km': round(total_built_length - total_planned_length, 2),
            'overall_length_variance_pct': round((total_built_length - total_planned_length) / total_planned_length * 100, 2) if total_planned_length > 0 else 0
        }
    
    def _identify_discrepancies(self, comparisons: List[ComparisonResult]) -> List[Dict]:
        """Identify significant discrepancies"""
        discrepancies = []
        
        for comp in comparisons:
            if comp.compliance_status in ['Minor Deviation', 'Major Deviation']:
                discrepancies.append({
                    'cable_id': comp.cable_id,
                    'severity': comp.compliance_status,
                    'length_variance_pct': comp.length_variance_pct,
                    'remarks': comp.remarks
                })
        
        # Sort by severity
        severity_order = {'Major Deviation': 0, 'Minor Deviation': 1}
        discrepancies.sort(key=lambda x: severity_order.get(x['severity'], 2))
        
        return discrepancies
    
    def _generate_recommendations(self, comparisons: List[ComparisonResult], summary: Dict) -> List[str]:
        """Generate recommendations based on comparison"""
        recommendations = []
        
        if summary.get('major_deviations', 0) > 0:
            recommendations.append('🔴 Critical: Investigate major deviations immediately')
            recommendations.append('Review cables with >10% length variance')
        
        if summary.get('minor_deviations', 0) > 0:
            recommendations.append('🟡 Warning: Minor deviations detected')
            recommendations.append('Document reasons for length variances')
        
        if summary.get('compliance_rate', 0) >= 95:
            recommendations.append('✅ Excellent: Network implementation highly compliant with plan')
        elif summary.get('compliance_rate', 0) >= 85:
            recommendations.append('✅ Good: Network implementation mostly compliant')
        else:
            recommendations.append('⚠️ Review: Multiple compliance issues detected')
        
        # Specific recommendations
        not_built = [c for c in comparisons if c.built_status == 'Not Built']
        if not_built:
            recommendations.append(f'📋 {len(not_built)} planned cables not yet built')
        
        unplanned = [c for c in comparisons if c.planned_status == 'Not Planned']
        if unplanned:
            recommendations.append(f'📋 {len(unplanned)} unplanned cables built - update design documentation')
        
        return recommendations
