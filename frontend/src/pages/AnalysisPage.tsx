import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Box,
  Alert,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import axios from 'axios'
import { useNetworkStore } from '../stores/networkStore'

const AnalysisPage = () => {
  const { opmAnalysis, statistics, projectName } = useNetworkStore()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize with uploaded data if available
  useEffect(() => {
    if (opmAnalysis) {
      setResult({ opm_analysis: opmAnalysis })
    }
  }, [opmAnalysis])

  const [formData, setFormData] = useState({
    // Optical parameters
    tx_power: 3.0,
    rx_sensitivity: -28.0,
    wavelength: '1550nm',
    fiber_type: 'single_mode',
    
    // Loss parameters
    fiber_loss_per_km: 0.35,
    splice_loss: 0.1,
    connector_loss: 0.5,
    safety_margin: 3.0,
    
    // Segment parameters
    segment_name: 'Test Segment',
    fiber_length_km: 5.0,
    splice_count: 4,
    connector_count: 2
  })

  const handleChange = (field: string) => (event: any) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    })
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await axios.post('/api/analysis/opm/calculate', {
        optical_params: {
          tx_power: parseFloat(formData.tx_power.toString()),
          rx_sensitivity: parseFloat(formData.rx_sensitivity.toString()),
          wavelength: formData.wavelength,
          fiber_type: formData.fiber_type
        },
        loss_params: {
          fiber_loss_per_km: parseFloat(formData.fiber_loss_per_km.toString()),
          splice_loss: parseFloat(formData.splice_loss.toString()),
          connector_loss: parseFloat(formData.connector_loss.toString()),
          safety_margin: parseFloat(formData.safety_margin.toString())
        },
        segment: {
          name: formData.segment_name,
          fiber_length_km: parseFloat(formData.fiber_length_km.toString()),
          splice_count: parseInt(formData.splice_count.toString()),
          connector_count: parseInt(formData.connector_count.toString())
        }
      })

      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'success'
      case 'Warning': return 'warning'
      case 'Critical': return 'error'
      default: return 'info'
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        OPM Analysis Results
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Optical Power Meter - Analisis Power Budget dan Loss Budget (Auto-calculated)
      </Typography>

      {!opmAnalysis && !result && (
        <Alert severity="info">
          No analysis data available. Please upload a KML file first.
        </Alert>
      )}

      {opmAnalysis && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Project: {projectName || 'Untitled'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h3">
                        {opmAnalysis.summary.average_quality_score.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">Average Quality</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h3">
                        {opmAnalysis.summary.total_segments}
                      </Typography>
                      <Typography variant="body2">Cable Segments</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h3">
                        {opmAnalysis.summary.total_network_loss_db.toFixed(2)}
                      </Typography>
                      <Typography variant="body2">Total Loss (dB)</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h3">
                        {statistics?.total_cable_length_km.toFixed(2)}
                      </Typography>
                      <Typography variant="body2">Total Length (km)</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Optical Parameters */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Optical Parameters (Standard)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Tx Power</strong></TableCell>
                      <TableCell align="right">
                        {opmAnalysis.summary.optical_parameters.tx_power_dbm} dBm
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Rx Sensitivity</strong></TableCell>
                      <TableCell align="right">
                        {opmAnalysis.summary.optical_parameters.rx_sensitivity_dbm} dBm
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Wavelength</strong></TableCell>
                      <TableCell align="right">
                        {opmAnalysis.summary.optical_parameters.wavelength}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Loss Standards */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Loss Standards (Telkom Access)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Fiber Loss</strong></TableCell>
                      <TableCell align="right">
                        {opmAnalysis.summary.loss_standards.fiber_loss_per_km_db} dB/km
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Splice Loss</strong></TableCell>
                      <TableCell align="right">
                        {opmAnalysis.summary.loss_standards.splice_loss_db} dB
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Connector Loss</strong></TableCell>
                      <TableCell align="right">
                        {opmAnalysis.summary.loss_standards.connector_loss_db} dB
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Safety Margin</strong></TableCell>
                      <TableCell align="right">
                        {opmAnalysis.summary.loss_standards.safety_margin_db} dB
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Quality Score Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quality Score per Cable Segment
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={opmAnalysis.results.map((r, i) => ({
                  name: `Cable ${i + 1}`,
                  quality: r.quality_score,
                  loss: r.total_loss_db
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" label={{ value: 'Quality (%)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Loss (dB)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="quality" fill="#4caf50" name="Quality Score (%)" />
                  <Bar yAxisId="right" dataKey="loss" fill="#ff9800" name="Total Loss (dB)" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Detailed Results Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Detailed Cable Analysis
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Cable Name</strong></TableCell>
                      <TableCell align="right"><strong>Length (km)</strong></TableCell>
                      <TableCell align="right"><strong>Power Budget (dB)</strong></TableCell>
                      <TableCell align="right"><strong>Total Loss (dB)</strong></TableCell>
                      <TableCell align="right"><strong>Margin (dB)</strong></TableCell>
                      <TableCell align="right"><strong>Quality</strong></TableCell>
                      <TableCell align="center"><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {opmAnalysis.results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>{result.cable_name}</TableCell>
                        <TableCell align="right">
                          {result.details.segment_details.fiber_length_km.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          {result.power_budget_db.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          {result.total_loss_db.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          {result.available_margin_db.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <strong>{result.quality_score.toFixed(1)}%</strong>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={result.status}
                            color={
                              result.status === 'OK' ? 'success' :
                              result.status === 'Warning' ? 'warning' : 'error'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Loss Breakdown */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Loss Breakdown Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={opmAnalysis.results.map((r, i) => ({
                    name: `Cable ${i + 1}`,
                    fiber: r.details.loss_breakdown.fiber_loss_db,
                    splice: r.details.loss_breakdown.splice_loss_db,
                    connector: r.details.loss_breakdown.connector_loss_db
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" label={{ value: 'Loss (dB)', position: 'insideBottom', offset: -5 }} />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="fiber" stackId="a" fill="#2196f3" name="Fiber Loss" />
                  <Bar dataKey="splice" stackId="a" fill="#ff9800" name="Splice Loss" />
                  <Bar dataKey="connector" stackId="a" fill="#f44336" name="Connector Loss" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Manual Calculator Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Manual OPM Calculator
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Calculate custom segment parameters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Tx Power (dBm)"
                  type="number"
                  value={formData.tx_power}
                  onChange={handleChange('tx_power')}
                  inputProps={{ step: 0.1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Rx Sensitivity (dBm)"
                  type="number"
                  value={formData.rx_sensitivity}
                  onChange={handleChange('rx_sensitivity')}
                  inputProps={{ step: 0.1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Wavelength</InputLabel>
                  <Select
                    value={formData.wavelength}
                    onChange={handleChange('wavelength')}
                    label="Wavelength"
                  >
                    <MenuItem value="1310nm">1310 nm</MenuItem>
                    <MenuItem value="1550nm">1550 nm</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Fiber Type</InputLabel>
                  <Select
                    value={formData.fiber_type}
                    onChange={handleChange('fiber_type')}
                    label="Fiber Type"
                  >
                    <MenuItem value="single_mode">Single Mode</MenuItem>
                    <MenuItem value="multi_mode">Multi Mode</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Loss Parameters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Fiber Loss (dB/km)"
                  type="number"
                  value={formData.fiber_loss_per_km}
                  onChange={handleChange('fiber_loss_per_km')}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Splice Loss (dB)"
                  type="number"
                  value={formData.splice_loss}
                  onChange={handleChange('splice_loss')}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Connector Loss (dB)"
                  type="number"
                  value={formData.connector_loss}
                  onChange={handleChange('connector_loss')}
                  inputProps={{ step: 0.1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Safety Margin (dB)"
                  type="number"
                  value={formData.safety_margin}
                  onChange={handleChange('safety_margin')}
                  inputProps={{ step: 0.1 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Network Segment
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Segment Name"
                  value={formData.segment_name}
                  onChange={handleChange('segment_name')}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Length (km)"
                  type="number"
                  value={formData.fiber_length_km}
                  onChange={handleChange('fiber_length_km')}
                  inputProps={{ step: 0.1 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Splices"
                  type="number"
                  value={formData.splice_count}
                  onChange={handleChange('splice_count')}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Connectors"
                  type="number"
                  value={formData.connector_count}
                  onChange={handleChange('connector_count')}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleAnalyze}
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </Paper>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={6}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <>
              <Paper sx={{ p: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Analysis Results
                </Typography>
                
                <Alert severity={getStatusColor(result.result.link_status)} sx={{ mb: 2 }}>
                  Link Status: <strong>{result.result.link_status}</strong>
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Power Budget
                        </Typography>
                        <Typography variant="h4">
                          {result.result.power_budget_db} dB
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Total Loss
                        </Typography>
                        <Typography variant="h4">
                          {result.result.total_loss_db} dB
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Available Margin
                        </Typography>
                        <Typography variant="h4">
                          {result.result.available_margin_db} dB
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Quality Score
                        </Typography>
                        <Typography variant="h4">
                          {result.result.quality_score}/100
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Loss Breakdown
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">
                    Fiber Loss: {result.result.details.loss_breakdown.fiber_loss_db} dB
                  </Typography>
                  <Typography variant="body2">
                    Splice Loss: {result.result.details.loss_breakdown.splice_loss_db} dB
                  </Typography>
                  <Typography variant="body2">
                    Connector Loss: {result.result.details.loss_breakdown.connector_loss_db} dB
                  </Typography>
                </Box>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recommendations
                </Typography>
                {result.recommendations.map((rec: string, idx: number) => (
                  <Typography key={idx} variant="body2" sx={{ mb: 1 }}>
                    {rec}
                  </Typography>
                ))}
              </Paper>
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  )
}

export default AnalysisPage
