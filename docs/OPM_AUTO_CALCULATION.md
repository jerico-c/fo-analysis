# OPM Auto-Calculation Feature

## Overview
Sistem sekarang melakukan analisis OPM (Optical Power Meter) secara otomatis setelah file KML berhasil di-upload.

## Perhitungan Berdasarkan Standar Telkom Access

### Formula Loss Total
```
Loss_total = (L × α) + (Nc × Loss_conn) + (Ns × Loss_splice) + Loss_splitter
```

Dimana:
- **L** = Panjang fiber (km)
- **α** = Atenuasi fiber (dB/km) = 0.35 dB/km @ 1550nm
- **Nc** = Jumlah konektor
- **Ns** = Jumlah splice
- **Loss_conn** = Loss per konektor = 0.25 dB (Connector Case)
- **Loss_splice** = Loss per splice = 0.1 dB (Max)

### Parameter Standar yang Digunakan

#### Optical Parameters
| Parameter | Value | Unit |
|-----------|-------|------|
| Tx Power (OLT) | 3.0 | dBm |
| Rx Sensitivity (ONT) | -28.0 | dBm |
| Wavelength | 1550 | nm |
| Fiber Type | Single Mode | - |

#### Loss Standards (Tabel 2: Loss Maksimum)
| Network Element | Database | Loss/Ukuran |
|-----------------|----------|-------------|
| Kabel | Max | 0.35 dB/km |
| Splicing | Max | 0.1 dB |
| Connector Case | - | 0.25 dB (IEC 61300-3-34 Grade B) |
| Splitter 1:2 | Max | 4.2 dB |
| Splitter 1:4 | Max | 7.4 dB |
| Splitter 1:8 | Max | 11.4 dB |
| Splitter 1:16 | Max | 14.4 dB |
| Splitter 1:32 | Max | 18.6 dB |
| Combiner/DWDM | - | 1.8 dB |

### Power Budget Calculation
```
Power Budget = Tx Power - Rx Sensitivity
             = 3.0 - (-28.0)
             = 31.0 dB
```

### Available Margin
```
Available Margin = Power Budget - Total Loss - Safety Margin
Safety Margin = 3.0 dB (standard)
```

## Quality Score Calculation

Quality Score (0-100%) dihitung berdasarkan:
- **Loss Efficiency (40%)**: Seberapa efisien loss dibanding panjang kabel
- **Margin Adequacy (60%)**: Seberapa cukup margin yang tersedia

Formula:
```python
loss_efficiency = max(0, 100 - (total_loss / fiber_length_km * 10))
margin_adequacy = min(100, (available_margin / 10) * 100)
quality_score = (loss_efficiency * 0.4) + (margin_adequacy * 0.6)
```

### Status Classification
- **OK**: Available margin ≥ 3 dB
- **Warning**: Available margin 0-3 dB
- **Critical**: Available margin < 0 dB

## Auto-Calculation Process

1. **Upload KML File** → Parse network data (poles, ODPs, cables)
2. **For Each Cable Segment**:
   - Calculate fiber length (km)
   - Estimate splice count: `max(2, int(length_m / 2000))` (1 splice per 2km)
   - Assume 2 connectors (1 at each end)
   - Calculate total loss
   - Calculate power budget & margin
   - Calculate quality score
   - Determine status (OK/Warning/Critical)
3. **Generate Summary**:
   - Average quality score across all segments
   - Total network loss
   - Per-segment analysis details

## Output Structure

```json
{
  "opm_analysis": {
    "results": [
      {
        "cable_name": "Cable Name",
        "power_budget_db": 31.0,
        "total_loss_db": 3.15,
        "available_margin_db": 24.85,
        "status": "OK",
        "quality_score": 95.94,
        "details": {
          "segment_details": {
            "fiber_length_km": 5.0,
            "splice_count": 2,
            "connector_count": 2
          },
          "loss_breakdown": {
            "fiber_loss_db": 1.75,
            "splice_loss_db": 0.2,
            "connector_loss_db": 0.5,
            "total_loss_db": 2.45
          }
        }
      }
    ],
    "summary": {
      "total_segments": 10,
      "average_quality_score": 93.5,
      "total_network_loss_db": 25.4,
      "optical_parameters": {...},
      "loss_standards": {...}
    }
  }
}
```

## UI Display

### Upload Page
- Network statistics (poles, ODPs, cables, total km)
- **OPM Analysis Summary Card**:
  - Average quality score
  - Total network loss
  - Number of segments analyzed
  - Standards reference

### Analysis Page
- **Summary Cards**: Quality, Segments, Total Loss, Length
- **Optical Parameters Table**: Tx, Rx, Wavelength
- **Loss Standards Table**: Fiber, Splice, Connector losses
- **Quality Score Chart**: Bar chart per cable segment
- **Detailed Results Table**: All cables with metrics
- **Loss Breakdown Chart**: Stacked bar showing fiber/splice/connector losses

## Benefits

1. ✅ **Instant Analysis**: No manual calculation needed
2. ✅ **Standardized**: Based on Telkom Access specifications
3. ✅ **Comprehensive**: All cables analyzed automatically
4. ✅ **Visual**: Charts and tables for easy understanding
5. ✅ **Status Alerts**: Immediate identification of problem segments
6. ✅ **Educational**: Shows all calculation details

## Usage

1. Go to Upload page
2. Upload KML file
3. See instant OPM analysis results
4. Click "View Analysis" for detailed breakdown
5. Click "View on Map" to see network visualization

## References

- ITU-T G.652: Single-mode fiber specifications
- ITU-T G.657: Bend-insensitive fiber specifications
- IEC 61300-3-34: Fiber optic connector loss measurement (Grade B)
- Telkom Access Network Design Standards
