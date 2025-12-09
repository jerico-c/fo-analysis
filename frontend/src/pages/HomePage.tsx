import { Container, Typography, Box, Grid, Card, CardContent, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import MapIcon from '@mui/icons-material/Map'

const HomePage = () => {
  const navigate = useNavigate()

  const features = [
    {
      title: 'Upload KML Files',
      description: 'Import network infrastructure data from Google Earth',
      icon: <CloudUploadIcon sx={{ fontSize: 60 }} />,
      action: () => navigate('/upload')
    },
    {
      title: 'OPM Analysis',
      description: 'Analyze optical power budget and signal quality',
      icon: <AnalyticsIcon sx={{ fontSize: 60 }} />,
      action: () => navigate('/analysis')
    },
    {
      title: 'Interactive Map',
      description: 'Visualize network topology and quality metrics',
      icon: <MapIcon sx={{ fontSize: 60 }} />,
      action: () => navigate('/map')
    }
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Fiber Optic Network Analyzer
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          AI-Powered Analysis & Optimization untuk Jaringan Fiber Optik
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 800, mx: 'auto' }}>
          Platform analisis end-to-end untuk jaringan fiber optik PT Telkom Akses. 
          Mengintegrasikan data KML, perhitungan OPM, dan AI untuk optimisasi rute jaringan.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-8px)' }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography gutterBottom variant="h5" component="h2">
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {feature.description}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={feature.action}
                  sx={{ mt: 2 }}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 8, p: 4, bgcolor: 'grey.100', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Tentang Proyek
        </Typography>
        <Typography variant="body1" paragraph>
          Proyek ini dikembangkan sebagai bagian dari program magang di PT Telkom Akses Kota Magelang 
          dengan judul <strong>"Analisis Proses Operasional End to End Jaringan Fiber Optik"</strong>.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Mata Kuliah Terkait:</strong> Rekayasa Trafik, Transmisi Telekomunikasi, 
          Jaringan Telekomunikasi, Isyarat Acak dan Derau, Sistem Komunikasi Nirkabel, Komunikasi Digital
        </Typography>
      </Box>
    </Container>
  )
}

export default HomePage
