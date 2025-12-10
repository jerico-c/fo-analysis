# 📡 Fiber Optic Network Analyzer & Optimizer

**Aplikasi Web Analisis Kualitas Sinyal & Optimisasi Jaringan Fiber Optik PT Telkom Akses**

## 🎯 Deskripsi Proyek

Platform berbasis web yang mengintegrasikan AI dan GIS untuk menganalisis kualitas sinyal jaringan fiber optik, memberikan visualisasi interaktif, dan rekomendasi optimisasi rute berdasarkan data real dari Google Earth (KML), ABD (As Built Drawing), dan perhitungan OPM (Optical Power Meter).

### Relevansi Akademik
Proyek ini mendukung konversi mata kuliah:
- ✅ Rekayasa Trafik
- ✅ Transmisi Telekomunikasi  
- ✅ Jaringan Telekomunikasi
- ✅ Isyarat Acak dan Derau
- ✅ Sistem Komunikasi Nirkabel
- ✅ Komunikasi Digital

**Judul Laporan**: *Analisis Proses Operasional End to End Jaringan Fiber Optik pada PT Telkom Akses Kota Magelang*

---

## 🚀 Fitur Utama

### 1. **Data Management**
- 📂 Upload file KML dari Google Earth (peta jaringan)
- 📄 Import file ABD jaringan
- 📊 Input parameter OPM (Optical Power Meter)

### 2. **Analisis Kualitas Sinyal** ✨ NEW: Auto-calculation!
- 🔍 **Auto OPM Analysis**: Perhitungan otomatis setelah upload KML
- 📊 **Power Budget Calculation**: Berdasarkan standar Telkom Access
- 📉 **Loss Budget Analysis**: Fiber (0.35 dB/km), Splice (0.1 dB), Connector (0.25 dB)
- 📏 **Quality Score (0-100%)**: Evaluasi kualitas per segment
- 📈 **Visual Charts**: Bar chart & breakdown analysis
- ⚠️ **Status Classification**: OK / Warning / Critical
- 📋 **Detailed Reports**: Per-cable metrics & recommendations
- 🎯 **Standards Compliant**: ITU-T G.652/G.657, IEC 61300-3-34

### 3. **Visualisasi Interaktif**
- 🗺️ **Multiple Base Maps**: Esri Satellite, Esri Street, Esri Topo, OpenStreetMap, CartoDB Light/Dark
- 📍 **Network Elements**: Visualisasi tiang, ODP, kabel dengan koordinat real
- 🎨 **Color-coded Status**: Green (In Service), Orange (Planned)
- 📊 **Statistics Dashboard**: Real-time metrics
- 🔄 **Auto-center Map**: Fokus otomatis ke lokasi jaringan

### 4. **AI-Powered Optimization**
- 🤖 Machine Learning untuk prediksi kualitas sinyal
- 🛣️ Rekomendasi rute optimal
- 💡 Alternative path suggestions
- 💰 Cost-benefit analysis
- 📋 Automated report generation

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ Map Viewer   │  │  Dashboard   │  │ Reports  │  │
│  │  (Leaflet)   │  │   (Charts)   │  │  (PDF)   │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────┐
│              BACKEND (FastAPI/Flask)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ KML Parser   │  │ OPM Engine   │  │   AI     │  │
│  │   Service    │  │  Calculator  │  │  Engine  │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              DATABASE (PostgreSQL + PostGIS)         │
│         Network Data, Analysis Results, Users        │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Struktur Project

```
fiber-optic-analyzer/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # UI Components
│   │   │   ├── MapViewer/   # Interactive map
│   │   │   ├── Dashboard/   # Analytics dashboard
│   │   │   └── Reports/     # Report generation
│   │   ├── services/        # API clients
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Helper functions
│   │   └── App.tsx
│   └── package.json
│
├── backend/                 # Python FastAPI
│   ├── app/
│   │   ├── api/            # REST API endpoints
│   │   ├── core/           # Configuration
│   │   ├── models/         # Database models
│   │   ├── services/
│   │   │   ├── kml_parser.py       # Parse KML files
│   │   │   ├── opm_calculator.py   # OPM calculations
│   │   │   ├── network_analyzer.py # Network analysis
│   │   │   └── ai_optimizer.py     # AI optimization
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── ml/                      # Machine Learning Models
│   ├── models/             # Trained models
│   ├── notebooks/          # Jupyter notebooks
│   ├── training/           # Training scripts
│   └── requirements.txt
│
├── docs/                   # Documentation
│   ├── api/               # API documentation
│   ├── user-guide/        # User manual
│   └── technical/         # Technical specs
│
├── tests/                  # Unit & Integration tests
├── docker-compose.yml      # Container orchestration
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Mapping**: Leaflet / Mapbox GL JS
- **UI Library**: Material-UI (MUI) / Ant Design
- **Charts**: Recharts / Apache ECharts
- **State Management**: Zustand / Redux Toolkit
- **API Client**: Axios

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Geospatial**: Python GDAL, Shapely, GeoPandas
- **Parser**: lxml, BeautifulSoup4 (KML parsing)
- **Database**: PostgreSQL 15 + PostGIS
- **ORM**: SQLAlchemy 2.0
- **API Docs**: OpenAPI (Swagger)

### AI/ML
- **Framework**: PyTorch / TensorFlow
- **ML Libraries**: scikit-learn, pandas, numpy
- **Optimization**: NetworkX (graph optimization)
- **Model Types**: 
  - Regression (signal prediction)
  - Classification (network status)
  - Path optimization (A*, Dijkstra)

### DevOps
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx
- **Process Manager**: Gunicorn / Uvicorn
- **Monitoring**: Prometheus + Grafana (optional)

---

## 📊 Data Model

### Input Data Sources

#### 1. KML File (Google Earth)
```xml
<Placemark>
  <name>Tiang-001</name>
  <description>
    Designator:PU-S7.0-400NM
    Construction Status: In Service
    Material Type:Steel
    Usage:Telco
  </description>
  <Point>
    <coordinates>110.xxx,-7.xxx,0</coordinates>
  </Point>
</Placemark>
```

#### 2. OPM Parameters
- Power Output (dBm)
- Fiber Loss (dB/km)
- Splice Loss (dB)
- Connector Loss (dB)
- Safety Margin (dB)
- Receiver Sensitivity (dBm)

#### 3. Network Elements
- **Tiang (Poles)**: Location, status, type
- **ODP (Optical Distribution Point)**: Capacity, splices
- **Kabel (Cables)**: Length, core count, specification
- **Splice Points**: Type, method, loss

---

## 🔬 Algoritma Analisis

### 1. Power Budget Calculation
```
Power Budget = Tx Power - Rx Sensitivity
Available Loss = Power Budget - Safety Margin

Total Loss = (Fiber Length × Fiber Loss) + 
             (Splice Count × Splice Loss) + 
             (Connector Count × Connector Loss)

Status: OK if Total Loss < Available Loss
```

### 2. Route Optimization (AI)
- **Input Features**: Distance, loss, topology, existing infrastructure
- **Algorithm**: Reinforcement Learning + Graph Optimization
- **Output**: Optimal route dengan minimal loss dan cost

### 3. Quality Scoring
```python
Quality Score = w1×PowerScore + w2×DistanceScore + 
                w3×TopologyScore + w4×CostScore
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ & npm/yarn
- Python 3.11+
- PostgreSQL 15+ with PostGIS extension
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone repository
git clone [<repository-url>](https://github.com/jerico-c/fo-analysis/)
cd fiber-optic-analyzer

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Database setup
createdb fiber_network_db
psql fiber_network_db -c "CREATE EXTENSION postgis;"
```

### Running the Application

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

Access: `http://localhost:5173`

### Using Docker (Recommended)

```bash
docker-compose up --build
```

---

## 📖 Use Cases

### 1. Analisis Jaringan Existing
1. Upload file KML dari Google Earth
2. System parsing otomatis (tiang, ODP, kabel)
3. Visualisasi peta jaringan
4. Analisis kualitas sinyal per segment
5. Generate report dengan scores

### 2. Perencanaan Rute Baru
1. Tentukan titik awal dan akhir
2. Input constraint (budget, existing poles)
3. AI generate rekomendasi rute optimal
4. Compare dengan rute manual
5. Export KML untuk Google Earth

### 3. Troubleshooting
1. Deteksi segment dengan loss tinggi
2. Identifikasi penyebab (jarak, splice, dll)
3. Rekomendasi perbaikan
4. Cost estimation

---

## 🎓 Kontribusi Akademik

### Aspek Rekayasa Trafik
- Analisis kapasitas jaringan
- Optimisasi routing
- Load balancing

### Aspek Transmisi Telekomunikasi
- Power budget calculation
- Loss budget analysis
- Signal degradation modeling

### Aspek Jaringan Telekomunikasi
- Network topology analysis
- End-to-end connectivity
- Fault detection

### Aspek Komunikasi Digital
- Digital signal processing
- Optical signal analysis
- Noise and interference modeling

---

## 📝 Roadmap

### Phase 1: MVP (2-3 minggu)
- [x] Project setup
- [ ] KML parser implementation
- [ ] Basic map visualization
- [ ] OPM calculator
- [ ] Simple UI

### Phase 2: Core Features (3-4 minggu)
- [ ] Complete network analysis
- [ ] AI model training
- [ ] Advanced visualization
- [ ] Report generation

### Phase 3: Optimization (2-3 minggu)
- [ ] Route optimization AI
- [ ] Performance tuning
- [ ] User testing
- [ ] Documentation

### Phase 4: Deployment (1-2 minggu)
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Final presentation materials

---

## 👥 Author

**[Nama Anda]**
- Program Studi: [Program Studi]
- Institusi: [Nama Universitas]
- Pembimbing: [Nama Pembimbing]

---

## 📄 License

This project is for academic purposes (Internship/Thesis) at PT Telkom Akses.

---

## 🤝 Acknowledgments

- PT Telkom Akses Kota Magelang
- [Nama Pembimbing Lapangan]
- [Nama Dosen Pembimbing]

---

**Status**: 🚧 In Development | **Version**: 0.1.0 | **Last Updated**: November 2025
