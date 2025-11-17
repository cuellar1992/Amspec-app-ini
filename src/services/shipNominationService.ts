import api from './api'

export interface ShipNominationData {
  vesselName: string
  amspecReference: string
  clientReference?: string
  clients?: string[]
  productTypes: string[]
  agent?: string
  pilotOnBoard?: string
  etb?: string
  etc?: string
  terminal?: string
  berth?: string
  surveyor?: string
  sampler?: string
  chemist?: string
  status?: 'pending' | 'approved' | 'in-progress' | 'completed' | 'cancelled'
}

export interface ShipNomination extends ShipNominationData {
  _id: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: string[]
  count?: number
  total?: number
  page?: number
  pages?: number
  limit?: number
  exists?: boolean
}

// Get all ship nominations (paginated)
export const getAllShipNominations = async (
  params?: { page?: number; limit?: number; sortBy?: 'createdAt' | 'etb'; sortOrder?: 'asc' | 'desc'; search?: string }
): Promise<ApiResponse<ShipNomination[]>> => {
  const response = await api.get('/ship-nominations', { params })
  return response.data
}

// Search ship nominations by vessel name or reference
export const searchShipNominations = async (
  searchTerm: string,
  limit: number = 10
): Promise<ApiResponse<ShipNomination[]>> => {
  const response = await api.get('/ship-nominations', {
    params: {
      search: searchTerm,
      limit,
      sortBy: 'etb',
      sortOrder: 'desc'
    }
  })
  return response.data
}

// Get ship nomination by ID
export const getShipNominationById = async (id: string): Promise<ApiResponse<ShipNomination>> => {
  const response = await api.get(`/ship-nominations/${id}`)
  return response.data
}

// Check if AmSpec reference exists
export const checkAmspecReference = async (
  amspecReference: string
): Promise<ApiResponse<ShipNomination | null>> => {
  const encoded = encodeURIComponent(amspecReference)
  const response = await api.get(`/ship-nominations/ref/${encoded}`)
  return response.data
}

// Create new ship nomination
export const createShipNomination = async (
  data: ShipNominationData
): Promise<ApiResponse<ShipNomination>> => {
  const response = await api.post('/ship-nominations', data)
  return response.data
}

// Update ship nomination
export const updateShipNomination = async (
  id: string,
  data: Partial<ShipNominationData>
): Promise<ApiResponse<ShipNomination>> => {
  const response = await api.put(`/ship-nominations/${id}`, data)
  return response.data
}

// Delete ship nomination
export const deleteShipNomination = async (id: string): Promise<ApiResponse<Record<string, never>>> => {
  const response = await api.delete(`/ship-nominations/${id}`)
  return response.data
}

// Get ship nominations by status
export const getShipNominationsByStatus = async (
  status: string
): Promise<ApiResponse<ShipNomination[]>> => {
  const response = await api.get(`/ship-nominations/status/${status}`)
  return response.data
}

// Get ships count by year statistics
export interface ShipsByYear {
  year: number
  count: number
  ships: string[]
}

export const getShipsByYear = async (): Promise<ApiResponse<ShipsByYear[]>> => {
  const response = await api.get('/ship-nominations/stats/by-year')
  return response.data
}

// Get ships count by month and terminal
export interface ShipsByMonth {
  month: number
  monthName: string
  count: number
  ships: string[]
}

export const getShipsByMonthAndTerminal = async (
  year?: number,
  terminal?: string
): Promise<ApiResponse<ShipsByMonth[]> & { year: number; terminal: string }> => {
  const params: { year?: number; terminal?: string } = {}
  if (year) params.year = year
  if (terminal) params.terminal = terminal

  const response = await api.get('/ship-nominations/stats/by-month-terminal', { params })
  return response.data
}

// Get available years from ship nominations
export const getAvailableYears = async (): Promise<ApiResponse<number[]>> => {
  const response = await api.get('/ship-nominations/stats/available-years')
  return response.data
}

// Get ships count by terminal
export interface ShipsByTerminal {
  terminal: string
  count: number
  ships: string[]
}

export const getShipsByTerminal = async (
  period?: 'monthly' | 'yearly' | 'all'
): Promise<ApiResponse<ShipsByTerminal[]>> => {
  const params = period ? { period } : {}
  const response = await api.get('/ship-nominations/stats/by-terminal', { params })
  return response.data
}

// Get top clients by ship nominations
export interface TopClient {
  clientName: string
  totalNominations: number
  uniqueShips: number
  terminals: number
  ships: string[]
}

export const getTopClients = async (
  limit: number = 10,
  period: 'monthly' | 'yearly' | 'all' = 'all'
): Promise<ApiResponse<TopClient[]>> => {
  const params: { limit?: number; period?: string } = { limit, period }
  const response = await api.get('/ship-nominations/stats/by-client', { params })
  return response.data
}

// Get samplers hours summary
export interface SamplerHours {
  samplerName: string
  week: number
  year: number
  totalHours: number
  percentage: number
  targetHours: number
  status: 'on-track' | 'under-target' | 'overtime'
  has24HourRestriction: boolean
  restrictedDays: number[]
  breakdown: {
    officeSampling: number
    lineSampling: number
    molekulisLoading: number
    otherJobs: number
  }
}

export const getSamplersHoursSummary = async (
  week?: number,
  year?: number,
  targetHours: number = 38
): Promise<ApiResponse<SamplerHours[]>> => {
  const params: { week?: number; year?: number; targetHours?: number } = {}
  if (week) params.week = week
  if (year) params.year = year
  if (targetHours !== 38) params.targetHours = targetHours

  const response = await api.get('/samplers/hours-summary', { params })
  return response.data
}

export const getSamplersMonthSummary = async (
  month?: number,
  year?: number,
  targetHours: number = 38
): Promise<ApiResponse<SamplerHours[]>> => {
  const params: { month?: number; year?: number; targetHours?: number } = {}
  if (month) params.month = month
  if (year) params.year = year
  if (targetHours !== 38) params.targetHours = targetHours

  const response = await api.get('/samplers/month-summary', { params })
  return response.data
}
