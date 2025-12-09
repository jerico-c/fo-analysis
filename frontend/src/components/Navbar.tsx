import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { Link } from 'react-router-dom'
import HomeIcon from '@mui/icons-material/Home'
import UploadIcon from '@mui/icons-material/Upload'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import MapIcon from '@mui/icons-material/Map'

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          📡 Fiber Optic Network Analyzer
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={Link} to="/" startIcon={<HomeIcon />}>
            Home
          </Button>
          <Button color="inherit" component={Link} to="/upload" startIcon={<UploadIcon />}>
            Upload
          </Button>
          <Button color="inherit" component={Link} to="/analysis" startIcon={<AnalyticsIcon />}>
            Analysis
          </Button>
          <Button color="inherit" component={Link} to="/map" startIcon={<MapIcon />}>
            Map
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
