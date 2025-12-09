import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button,
  Alert,
  CircularProgress,
  TextField,
  Grid
} from '@mui/material'
import { useDropzone } from 'react-dropzone'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import axios from 'axios'
import { useNetworkStore } from '../stores/networkStore'

const UploadPage = () => {
  const navigate = useNavigate()
  const { setNetworkData } = useNetworkStore()
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)
    setError(null)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('project_name', projectName || 'Untitled Project')

      const response = await axios.post('/api/upload/kml', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setUploadResult(response.data)
      
      // Save to store for map view
      if (response.data.data) {
        setNetworkData(
          response.data.data,
          response.data.project_name,
          response.data.statistics,
          response.data.opm_analysis
        )
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.google-earth.kml+xml': ['.kml'],
      'application/vnd.google-earth.kmz': ['.kmz']
    },
    multiple: false
  })

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Upload KML File
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload file KML dari Google Earth yang berisi data jaringan fiber optik
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., PT2AS-25-TMG-FAU047"
            sx={{ mb: 3 }}
          />

          <Paper
            {...getRootProps()}
            sx={{
              p: 4,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover'
              }
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop file here...' : 'Drag & drop KML file here'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to browse
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 2 }}>
              Supported formats: .kml, .kmz
            </Typography>
          </Paper>

          {uploading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {uploadResult && (
            <Paper sx={{ p: 3 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                File uploaded successfully!
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Parse Results
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Project:</strong> {uploadResult.project_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Filename:</strong> {uploadResult.filename}
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Network Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                      <Typography variant="h4">
                        {uploadResult.statistics.total_poles}
                      </Typography>
                      <Typography variant="body2">Poles/Tiang</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'white' }}>
                      <Typography variant="h4">
                        {uploadResult.statistics.total_odps}
                      </Typography>
                      <Typography variant="body2">ODPs</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                      <Typography variant="h4">
                        {uploadResult.statistics.total_cables}
                      </Typography>
                      <Typography variant="body2">Cables</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'white' }}>
                      <Typography variant="h4">
                        {uploadResult.statistics.total_cable_length_km?.toFixed(2)}
                      </Typography>
                      <Typography variant="body2">Total km</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {uploadResult.opm_analysis && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    OPM Analysis (Auto-calculated)
                  </Typography>
                  
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light' }}>
                    <Typography variant="h5" color="white">
                      Quality Score: {uploadResult.opm_analysis.summary.average_quality_score}%
                    </Typography>
                    <Typography variant="body2" color="white">
                      Average Network Quality
                    </Typography>
                  </Paper>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Loss: {uploadResult.opm_analysis.summary.total_network_loss_db.toFixed(2)} dB
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Segments: {uploadResult.opm_analysis.summary.total_segments}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Based on Telkom Access standards (λ=1550nm, α=0.35 dB/km)
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/map')}
                  >
                    View on Map
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/analysis')}
                  >
                    View Analysis
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  )
}

export default UploadPage
