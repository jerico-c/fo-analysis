import { useState } from 'react'
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Card,
  CardContent
} from '@mui/material'
import { useDropzone } from 'react-dropzone'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import axios from 'axios'

const ComparisonPage = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [projectName, setProjectName] = useState('')
  const [asPlannedFile, setAsPlannedFile] = useState<File | null>(null)
  const [asBuiltFile, setAsBuiltFile] = useState<File | null>(null)
  const [opmFile, setOpmFile] = useState<File | null>(null)
  const [atpFile, setAtpFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [comparisonResult, setComparisonResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const steps = ['Project Info', 'As-Planned Data', 'As-Built Data', 'Compare Results']

  const onDropAsPlanned = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAsPlannedFile(acceptedFiles[0])
    }
  }

  const onDropAsBuilt = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAsBuiltFile(acceptedFiles[0])
    }
  }

  const onDropOPM = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setOpmFile(acceptedFiles[0])
    }
  }

  const onDropATP = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAtpFile(acceptedFiles[0])
    }
  }

  const { getRootProps: getAsPlannedProps, getInputProps: getAsPlannedInput } = useDropzone({
    onDrop: onDropAsPlanned,
    accept: { 'application/vnd.google-earth.kml+xml': ['.kml'] },
    multiple: false
  })

  const { getRootProps: getAsBuiltProps, getInputProps: getAsBuiltInput } = useDropzone({
    onDrop: onDropAsBuilt,
    accept: { 'application/vnd.google-earth.kml+xml': ['.kml'] },
    multiple: false
  })

  const { getRootProps: getOPMProps, getInputProps: getOPMInput } = useDropzone({
    onDrop: onDropOPM,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  })

  const { getRootProps: getATPProps, getInputProps: getATPInput } = useDropzone({
    onDrop: onDropATP,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  })

  const handleUploadAsPlanned = async () => {
    if (!asPlannedFile || !projectName) {
      setError('Please provide project name and As-Planned KML file')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('kml_file', asPlannedFile)
      formData.append('project_name', projectName)

      await axios.post('/api/comparison/upload-asplanned', formData)
      setActiveStep(2)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleUploadAsBuilt = async () => {
    if (!asBuiltFile) {
      setError('Please provide As-Built KML file')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('kml_file', asBuiltFile)
      formData.append('project_name', projectName)
      
      if (opmFile) {
        formData.append('opm_csv', opmFile)
      }
      if (atpFile) {
        formData.append('atp_csv', atpFile)
      }

      await axios.post('/api/comparison/upload-asbuilt', formData)
      setActiveStep(3)
      handleCompare()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleCompare = async () => {
    setComparing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('project_name', projectName)

      const response = await axios.post('/api/comparison/compare', formData)
      setComparisonResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Comparison failed')
    } finally {
      setComparing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === 'Compliant') return <CheckCircleIcon sx={{ color: 'success.main' }} />
    if (status === 'Minor Deviation') return <WarningIcon sx={{ color: 'warning.main' }} />
    return <ErrorIcon sx={{ color: 'error.main' }} />
  }

  const getStatusColor = (status: string) => {
    if (status === 'Compliant') return 'success'
    if (status === 'Minor Deviation') return 'warning'
    return 'error'
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        <CompareArrowsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        As-Planned vs As-Built Comparison
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Compare network design (As-Planned) with actual field implementation (As-Built)
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step 0: Project Info */}
      {activeStep === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Step 1: Enter Project Information
          </Typography>
          <TextField
            fullWidth
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., MGE-FY026-PAYAMAN-SECANG"
            sx={{ mb: 3 }}
          />
          <Button
            variant="contained"
            onClick={() => setActiveStep(1)}
            disabled={!projectName}
          >
            Next: Upload As-Planned Data
          </Button>
        </Paper>
      )}

      {/* Step 1: As-Planned Upload */}
      {activeStep === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Step 2: Upload As-Planned KML
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Design/planning data from network engineering
              </Typography>
              
              <Paper
                {...getAsPlannedProps()}
                sx={{
                  p: 4,
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  cursor: 'pointer',
                  textAlign: 'center',
                  bgcolor: 'action.hover'
                }}
              >
                <input {...getAsPlannedInput()} />
                <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6">
                  Drop As-Planned KML here
                </Typography>
                <Typography variant="caption">
                  or click to browse
                </Typography>
              </Paper>

              {asPlannedFile && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Selected: {asPlannedFile.name}
                </Alert>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={handleUploadAsPlanned}
                disabled={!asPlannedFile || uploading}
                sx={{ mt: 3 }}
              >
                Upload & Continue
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, bgcolor: 'info.light', color: 'white' }}>
              <Typography variant="h6" gutterBottom>
                📋 As-Planned Data
              </Typography>
              <Typography variant="body2" paragraph>
                KML file dari tim perencanaan/desain jaringan yang berisi:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>Planned cable routes & lengths</li>
                <li>Pole positions (Tiang Baru)</li>
                <li>ODP locations (Distribution points)</li>
                <li>Network specifications</li>
                <li>Construction status: "Planned"</li>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Step 2: As-Built Upload */}
      {activeStep === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Step 3: Upload As-Built KML *
              </Typography>
              <Paper
                {...getAsBuiltProps()}
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: 'secondary.main',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <input {...getAsBuiltInput()} />
                <CloudUploadIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                <Typography variant="body2">As-Built KML</Typography>
              </Paper>
              {asBuiltFile && (
                <Alert severity="success" sx={{ mt: 1 }} icon={false}>
                  {asBuiltFile.name}
                </Alert>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                OPM Measurements (Optional)
              </Typography>
              <Paper
                {...getOPMProps()}
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: 'grey.400',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <input {...getOPMInput()} />
                <CloudUploadIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                <Typography variant="body2">OPM CSV</Typography>
              </Paper>
              {opmFile && (
                <Alert severity="info" sx={{ mt: 1 }} icon={false}>
                  {opmFile.name}
                </Alert>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                ATP Results (Optional)
              </Typography>
              <Paper
                {...getATPProps()}
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: 'grey.400',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <input {...getATPInput()} />
                <CloudUploadIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                <Typography variant="body2">ATP CSV</Typography>
              </Paper>
              {atpFile && (
                <Alert severity="info" sx={{ mt: 1 }} icon={false}>
                  {atpFile.name}
                </Alert>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleUploadAsBuilt}
              disabled={!asBuiltFile || uploading}
              size="large"
            >
              Upload & Start Comparison
            </Button>
          </Grid>
        </Grid>
      )}

      {/* Step 3: Comparison Results */}
      {activeStep === 3 && comparisonResult && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Comparison Results: {comparisonResult.project_name}
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h3">
                  {comparisonResult.summary.compliance_rate}%
                </Typography>
                <Typography variant="body2">Compliance Rate</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h3">
                  {comparisonResult.summary.compliant}
                </Typography>
                <Typography variant="body2">Compliant Cables</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h3">
                  {comparisonResult.summary.minor_deviations}
                </Typography>
                <Typography variant="body2">Minor Deviations</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h3">
                  {comparisonResult.summary.major_deviations}
                </Typography>
                <Typography variant="body2">Major Deviations</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendations */}
          {comparisonResult.recommendations && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📊 Recommendations
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {comparisonResult.recommendations.map((rec: string, idx: number) => (
                    <Typography component="li" key={idx} variant="body2" sx={{ mb: 1 }}>
                      {rec}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Detailed Comparison Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Detailed Cable Comparison
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Cable ID</strong></TableCell>
                      <TableCell align="right"><strong>Planned (km)</strong></TableCell>
                      <TableCell align="right"><strong>Built (km)</strong></TableCell>
                      <TableCell align="right"><strong>Variance</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="center"><strong>Compliance</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comparisonResult.comparisons.map((comp: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{comp.cable_id}</TableCell>
                        <TableCell align="right">{comp.planned_length_km.toFixed(3)}</TableCell>
                        <TableCell align="right">{comp.built_length_km.toFixed(3)}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${comp.length_variance_pct > 0 ? '+' : ''}${comp.length_variance_pct.toFixed(1)}%`}
                            size="small"
                            color={Math.abs(comp.length_variance_pct) <= 5 ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          {comp.planned_status} → {comp.built_status}
                        </TableCell>
                        <TableCell align="center">
                          {getStatusIcon(comp.compliance_status)}
                          <Typography variant="caption" display="block">
                            {comp.compliance_status}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  )
}

export default ComparisonPage
