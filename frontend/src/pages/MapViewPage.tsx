import { useState, useEffect } from 'react'
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  ToggleButtonGroup, 
  ToggleButton,
  Chip,
  Stack
} from '@mui/material'
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  LayersControl,
  Circle,
  useMap
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useNetworkStore } from '../stores/networkStore'

// Fix Leaflet default icon issue
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import markerIconRed from 'leaflet/dist/images/marker-icon.png'

// Custom icons for different network elements
const poleIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [0, -41]
})

const odpIcon = L.icon({
  iconUrl: markerIconRed,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
  className: 'odp-marker'
})

L.Marker.prototype.options.icon = poleIcon

// Component to re-center map when data changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 15)
  }, [center, map])
  return null
}

const MapViewPage = () => {
  const { networkData, projectName, statistics } = useNetworkStore()
  
  // Calculate center from network data or use default
  const getMapCenter = (): [number, number] => {
    if (networkData && networkData.poles.length > 0) {
      const firstPole = networkData.poles[0]
      return [firstPole.coordinates.latitude, firstPole.coordinates.longitude]
    }
    // Default: Kandangan, Temanggung area
    return [-7.333, 110.483]
  }

  const center = getMapCenter()

  // Use real data from store if available, otherwise use sample data
  const poles = networkData?.poles.map((pole, idx) => ({
    id: idx + 1,
    name: pole.name,
    lat: pole.coordinates.latitude,
    lng: pole.coordinates.longitude,
    status: pole.construction_status,
    type: 'pole',
    designator: pole.designator,
    material: pole.material_type
  })) || [
    // Sample data (fallback)
    { 
      id: 1, 
      name: 'PU-S7.0-400NM', 
      lat: -7.3320, 
      lng: 110.4825, 
      status: 'In Service',
      type: 'pole',
      designator: 'PU-S7.0-400NM',
      material: 'Steel'
    },
    { 
      id: 2, 
      name: 'PU-S7.0-400NM', 
      lat: -7.3325, 
      lng: 110.4830, 
      status: 'In Service',
      type: 'pole',
      designator: 'PU-S7.0-400NM',
      material: 'Steel'
    },
    { 
      id: 3, 
      name: 'PU-S7.0-140', 
      lat: -7.3330, 
      lng: 110.4835, 
      status: 'Planned',
      type: 'pole',
      designator: 'PU-S7.0-140',
      material: 'Steel'
    },
    { 
      id: 4, 
      name: 'PU-S7.0-140', 
      lat: -7.3335, 
      lng: 110.4840, 
      status: 'In Service',
      type: 'pole',
      designator: 'PU-S7.0-140',
      material: 'Steel'
    },
    { 
      id: 5, 
      name: 'PU-S7.0-140', 
      lat: -7.3340, 
      lng: 110.4845, 
      status: 'In Service',
      type: 'pole',
      designator: 'PU-S7.0-140',
      material: 'Steel'
    }
  ]

  const odps = networkData?.odps.map((odp, idx) => ({
    id: idx + 1,
    name: odp.name,
    lat: odp.coordinates.latitude,
    lng: odp.coordinates.longitude,
    specification: odp.specification,
    status: odp.construction_status
  })) || [
    // Sample data (fallback)
    {
      id: 1,
      name: 'ODP-001',
      lat: -7.3322,
      lng: 110.4827,
      specification: 'ODP Solid-PB-8 AS',
      status: 'Planned'
    },
    {
      id: 2,
      name: 'ODP-002',
      lat: -7.3332,
      lng: 110.4837,
      specification: 'ODP Solid-PB-8 AS',
      status: 'Planned'
    }
  ]

  const cables = networkData?.cables.map((cable, idx) => ({
    id: idx + 1,
    name: cable.name,
    coordinates: cable.coordinates.map(coord => [coord.latitude, coord.longitude] as [number, number]),
    specification: cable.specification,
    cores: cable.number_of_cores,
    length: cable.fiber_length_km,
    status: cable.construction_status
  })) || [
    // Sample data (fallback)
    {
      id: 1,
      name: 'Cable-ADSS-24D',
      coordinates: poles.map(p => [p.lat, p.lng] as [number, number]),
      specification: 'AC-OF-SM-ADSS-24D',
      cores: 24,
      length: 2.5,
      status: 'In Service'
    }
  ]

  const getMarkerColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in service':
        return '#4CAF50'
      case 'planned':
        return '#FF9800'
      default:
        return '#9E9E9E'
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Network Map View
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {projectName || 'Interactive map showing fiber optic network infrastructure'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip 
            label={`${poles.length} Poles`} 
            color="primary" 
            size="small" 
          />
          <Chip 
            label={`${odps.length} ODPs`} 
            color="secondary" 
            size="small" 
          />
          <Chip 
            label={`${cables.length} Cables`} 
            color="success" 
            size="small" 
          />
        </Stack>
      </Box>

      <Paper sx={{ p: 0, height: '75vh', overflow: 'hidden' }}>
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <MapUpdater center={center} />
          <LayersControl position="topright">
            {/* OpenStreetMap - Default */}
            <LayersControl.BaseLayer checked name="🗺️ OpenStreetMap">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>

            {/* Esri World Imagery - Satellite */}
            <LayersControl.BaseLayer name="🛰️ Satellite (Esri)">
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>

            {/* Esri World Street Map */}
            <LayersControl.BaseLayer name="🌍 Esri Street Map">
              <TileLayer
                attribution='Tiles &copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>

            {/* Esri World Topo Map */}
            <LayersControl.BaseLayer name="🏔️ Topographic (Esri)">
              <TileLayer
                attribution='Tiles &copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>

            {/* CartoDB Positron - Light */}
            <LayersControl.BaseLayer name="☀️ Light Mode">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>

            {/* CartoDB Dark Matter - Dark */}
            <LayersControl.BaseLayer name="🌙 Dark Mode">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>

            {/* Overlay layers */}
            <LayersControl.Overlay checked name="📍 Poles/Tiang">
              <>
                {poles.map(pole => (
                  <Marker 
                    key={pole.id} 
                    position={[pole.lat, pole.lng]}
                    icon={poleIcon}
                  >
                    <Popup>
                      <Box sx={{ minWidth: 200 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {pole.name}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Designator:</strong> {pole.designator}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Material:</strong> {pole.material}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Status:</strong> 
                          <Chip 
                            label={pole.status} 
                            size="small" 
                            color={pole.status === 'In Service' ? 'success' : 'warning'}
                            sx={{ ml: 1, height: 18 }}
                          />
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                          📍 {pole.lat.toFixed(4)}, {pole.lng.toFixed(4)}
                        </Typography>
                      </Box>
                    </Popup>
                    <Circle
                      center={[pole.lat, pole.lng]}
                      radius={10}
                      pathOptions={{
                        color: getMarkerColor(pole.status),
                        fillColor: getMarkerColor(pole.status),
                        fillOpacity: 0.3
                      }}
                    />
                  </Marker>
                ))}
              </>
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="🔌 ODPs">
              <>
                {odps.map(odp => (
                  <Marker 
                    key={odp.id} 
                    position={[odp.lat, odp.lng]}
                  >
                    <Popup>
                      <Box sx={{ minWidth: 200 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="secondary">
                          {odp.name}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Specification:</strong> {odp.specification}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Status:</strong> 
                          <Chip 
                            label={odp.status} 
                            size="small" 
                            color="warning"
                            sx={{ ml: 1, height: 18 }}
                          />
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                          📍 {odp.lat.toFixed(4)}, {odp.lng.toFixed(4)}
                        </Typography>
                      </Box>
                    </Popup>
                    <Circle
                      center={[odp.lat, odp.lng]}
                      radius={8}
                      pathOptions={{
                        color: '#FF5722',
                        fillColor: '#FF5722',
                        fillOpacity: 0.4
                      }}
                    />
                  </Marker>
                ))}
              </>
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="📡 Fiber Cables">
              <>
                {cables.map(cable => (
                  <Polyline
                    key={cable.id}
                    positions={cable.coordinates}
                    pathOptions={{
                      color: cable.status === 'In Service' ? '#2196F3' : '#FF9800',
                      weight: 3,
                      opacity: 0.7,
                      dashArray: cable.status === 'Planned' ? '10, 5' : undefined
                    }}
                  >
                    <Popup>
                      <Box sx={{ minWidth: 200 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {cable.name}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Specification:</strong> {cable.specification}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Cores:</strong> {cable.cores}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Length:</strong> {cable.length.toFixed(2)} km
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Status:</strong> 
                          <Chip 
                            label={cable.status} 
                            size="small" 
                            color={cable.status === 'In Service' ? 'success' : 'warning'}
                            sx={{ ml: 1, height: 18 }}
                          />
                        </Typography>
                      </Box>
                    </Popup>
                  </Polyline>
                ))}
              </>
            </LayersControl.Overlay>
          </LayersControl>
        </MapContainer>
      </Paper>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Stack direction="row" spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#4CAF50', borderRadius: '50%' }} />
            <Typography variant="caption">In Service</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#FF9800', borderRadius: '50%' }} />
            <Typography variant="caption">Planned</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 30, height: 3, bgcolor: '#2196F3' }} />
            <Typography variant="caption">Fiber Cable</Typography>
          </Box>
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          💡 Tip: {networkData ? 'Showing data from uploaded KML file. ' : 'Upload a KML file to see your actual network data. '}
          Use the layer control (top-right) to switch map styles and toggle layers.
        </Typography>
      </Box>
    </Container>
  )
}

export default MapViewPage
