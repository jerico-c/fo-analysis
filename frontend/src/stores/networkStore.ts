import { create } from 'zustand'

interface Coordinate {
  longitude: number
  latitude: number
  altitude: number
}

interface Pole {
  name: string
  designator: string
  construction_status: string
  material_type: string
  usage: string
  coordinates: Coordinate
}

interface ODP {
  name: string
  specification: string
  splice_type: string
  construction_status: string
  coordinates: Coordinate
}

interface Cable {
  name: string
  specification: string
  number_of_cores: number
  fiber_length_m: number
  fiber_length_km: number
  construction_status: string
  coordinates: Coordinate[]
}

interface NetworkData {
  poles: Pole[]
  odps: ODP[]
  cables: Cable[]
}

interface OPMResult {
  cable_name: string
  power_budget_db: number
  total_loss_db: number
  available_margin_db: number
  status: string
  quality_score: number
  details: any
}

interface OPMAnalysis {
  results: OPMResult[]
  summary: {
    total_segments: number
    average_quality_score: number
    total_network_loss_db: number
    optical_parameters: {
      tx_power_dbm: number
      rx_sensitivity_dbm: number
      wavelength: string
    }
    loss_standards: {
      fiber_loss_per_km_db: number
      splice_loss_db: number
      connector_loss_db: number
      safety_margin_db: number
    }
  }
}

interface NetworkStore {
  networkData: NetworkData | null
  projectName: string
  statistics: {
    total_poles: number
    total_odps: number
    total_cables: number
    total_cable_length_km: number
  } | null
  opmAnalysis: OPMAnalysis | null
  setNetworkData: (data: NetworkData, projectName: string, stats: any, opmAnalysis?: OPMAnalysis) => void
  clearNetworkData: () => void
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  networkData: null,
  projectName: '',
  statistics: null,
  opmAnalysis: null,
  setNetworkData: (data, projectName, stats, opmAnalysis) => 
    set({ networkData: data, projectName, statistics: stats, opmAnalysis: opmAnalysis || null }),
  clearNetworkData: () => 
    set({ networkData: null, projectName: '', statistics: null, opmAnalysis: null })
}))
