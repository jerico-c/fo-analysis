# 🚀 Quick Start Guide

## Prerequisites

Pastikan sudah terinstall:
- **Python 3.11+** 
- **Node.js 18+**
- **PostgreSQL 15+** with PostGIS
- **Git**

## Installation

### 1. Clone Repository

```bash
cd "/Users/cumik/Documents/proyek magang"
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi database Anda
```

### 3. Setup Database

```bash
# Create database
createdb fiber_network_db

# Enable PostGIS extension
psql fiber_network_db -c "CREATE EXTENSION postgis;"
```

### 4. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install
```

## Running the Application

### Method 1: Manual (Development)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Akses aplikasi di: **http://localhost:5173**
API Documentation: **http://localhost:8000/api/docs**

### Method 2: Docker (Recommended)

```bash
# Build and run all services
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

## Testing the Application

### 1. Test KML Parser

```bash
cd backend
python -c "
from app.services.kml_parser import KMLParser
parser = KMLParser()
data = parser.parse_file('/Users/cumik/Documents/isi-kml.txt')
print(parser.get_statistics())
"
```

### 2. Test OPM Calculator

```bash
python -c "
from app.services.opm_calculator import *

calc = OPMCalculator()
optical = OpticalParameters(tx_power=3.0, rx_sensitivity=-28.0)
loss = LossParameters()
segment = NetworkSegment(name='Test', fiber_length_km=5.0, splice_count=4, connector_count=2)

result = calc.calculate_power_budget(optical, loss, segment)
print(f'Status: {result.status}')
print(f'Quality: {result.quality_score}')
"
```

### 3. Test API Endpoints

```bash
# Health check
curl http://localhost:8000/api/health

# Upload KML (replace with actual file)
curl -X POST http://localhost:8000/api/upload/kml \
  -F "file=@/path/to/your/file.kml" \
  -F "project_name=Test Project"

# OPM Analysis
curl -X POST http://localhost:8000/api/analysis/opm/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "optical_params": {
      "tx_power": 3.0,
      "rx_sensitivity": -28.0,
      "wavelength": "1550nm",
      "fiber_type": "single_mode"
    },
    "loss_params": {
      "fiber_loss_per_km": 0.35,
      "splice_loss": 0.1,
      "connector_loss": 0.5,
      "safety_margin": 3.0
    },
    "segment": {
      "name": "Test Segment",
      "fiber_length_km": 5.0,
      "splice_count": 4,
      "connector_count": 2
    }
  }'
```

## Usage Workflow

### 1. Upload KML File
- Buka halaman Upload
- Drag & drop file KML dari Google Earth
- Sistem akan parsing otomatis dan menampilkan statistik

### 2. Perform OPM Analysis
- Buka halaman Analysis
- Input parameter optik dan loss
- Klik "Analyze" untuk melihat hasil
- Review recommendations

### 3. View on Map
- Buka halaman Map
- Lihat visualisasi jaringan interaktif
- (Data akan muncul setelah upload KML)

## Next Steps

### Phase 1 - Complete MVP ✅
- [x] Project structure setup
- [x] KML parser implementation
- [x] OPM calculator
- [x] Basic UI components
- [ ] Database integration
- [ ] Store parsed data to DB

### Phase 2 - Advanced Features
- [ ] AI model training for quality prediction
- [ ] Route optimization algorithm
- [ ] Advanced map visualization
- [ ] PDF report generation
- [ ] User authentication

### Phase 3 - Optimization
- [ ] Performance tuning
- [ ] Caching layer
- [ ] Real-time updates
- [ ] Mobile responsive design

## Troubleshooting

### Backend Issues

**Import Error GDAL:**
```bash
# Mac
brew install gdal
export GDAL_CONFIG=/usr/local/bin/gdal-config

# Ubuntu/Debian
sudo apt-get install gdal-bin libgdal-dev
```

**Database Connection:**
```bash
# Check PostgreSQL is running
psql -l

# Check connection
psql -h localhost -U postgres -d fiber_network_db
```

### Frontend Issues

**Module not found:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

## Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React + Vite**: https://vitejs.dev/
- **Leaflet Maps**: https://leafletjs.com/
- **Material-UI**: https://mui.com/
- **KML Reference**: https://developers.google.com/kml/documentation

## Support

Untuk pertanyaan atau issues, silakan buat issue di repository atau hubungi tim development.

---

**Happy Coding!** 🚀📡
