# Backend Server Setup - Langkah-langkah

## ✅ Status: Server Running
Backend API berhasil berjalan di `http://127.0.0.1:8000`

## 🔧 Dependencies yang Terinstall
- FastAPI 0.123.9
- Uvicorn 0.38.0
- Python-multipart 0.0.20
- Pandas 2.3.3
- NumPy 2.3.5
- lxml 6.0.2
- BeautifulSoup4 4.14.3
- pydantic-settings
- python-dotenv

## 📡 API Endpoints Tersedia

### 1. Comparison API (`/api/comparison`)
- `POST /upload-asplanned` - Upload As-Planned KML
- `POST /upload-asbuilt` - Upload As-Built KML + OPM/ATP CSV (optional)
- `POST /compare` - Compare As-Planned vs As-Built
- `GET /projects` - List all projects

### 2. Upload API (`/api/upload`)
- `POST /kml` - Upload KML files untuk analisis

### 3. Network API (`/api/network`)
- Endpoints untuk network topology

### 4. Analysis API (`/api/analysis`)
- Endpoints untuk OPM analysis

### 5. Optimization API (`/api/optimization`)
- Endpoints untuk network optimization

## 🚀 Cara Menjalankan

```bash
# Terminal 1: Backend
cd backend
python3 -m uvicorn app.main:app --reload

# Terminal 2: Frontend (jika sudah setup)
cd frontend
npm run dev
```

## 📚 API Documentation
Akses Swagger UI: `http://127.0.0.1:8000/docs`
Akses ReDoc: `http://127.0.0.1:8000/redoc`

## 📁 Sample Data Location
- `/sample_data/OPM_MEASUREMENT_SAMPLE.csv`
- `/sample_data/ATP_MEASUREMENT_SAMPLE.csv`
- `/uploads/MGE-FY026-PAYAMAN SECANG.kml` (As-Planned example)

## 🔄 Workflow Testing

### Test As-Planned vs As-Built Comparison:

1. **Upload As-Planned**:
```bash
curl -X POST "http://127.0.0.1:8000/api/comparison/upload-asplanned" \
  -F "kml_file=@uploads/MGE-FY026-PAYAMAN SECANG.kml" \
  -F "project_name=PAYAMAN-SECANG"
```

2. **Upload As-Built**:
```bash
curl -X POST "http://127.0.0.1:8000/api/comparison/upload-asbuilt" \
  -F "kml_file=@uploads/MGE-FY026-PAYAMAN SECANG.kml" \
  -F "opm_csv=@sample_data/OPM_MEASUREMENT_SAMPLE.csv" \
  -F "atp_csv=@sample_data/ATP_MEASUREMENT_SAMPLE.csv" \
  -F "project_name=PAYAMAN-SECANG"
```

3. **Compare**:
```bash
curl -X POST "http://127.0.0.1:8000/api/comparison/compare" \
  -F "project_name=PAYAMAN-SECANG"
```

4. **List Projects**:
```bash
curl "http://127.0.0.1:8000/api/comparison/projects"
```

## 🐛 Troubleshooting

### Issue: ModuleNotFoundError
**Solution**: Install missing packages
```bash
python3 -m pip install <package-name>
```

### Issue: Permission denied on uploads directory
**Solution**: Create uploads directory
```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```

### Issue: Port 8000 already in use
**Solution**: Use different port
```bash
python3 -m uvicorn app.main:app --reload --port 8001
```

## 📝 Next Steps untuk Development

1. ✅ Backend API running
2. ⬜ Setup frontend dan tambahkan route ke ComparisonPage
3. ⬜ Test comparison API dengan sample data
4. ⬜ Implementasi real-time dashboard (Feature Recommendation #1)
5. ⬜ Tambahkan SLA monitoring (Feature Recommendation #10)
