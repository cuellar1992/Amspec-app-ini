import api from './api'
import type { ShipNomination } from './shipNominationService'
import type { MolekulisLoading } from './molekulisLoadingService'
import type { OtherJob } from './otherJobsService'

export interface SamplerDropdown {
  name: string
  has24HourRestriction: boolean
  restrictedDays: number[]
}

export interface DropdownsData {
  surveyors: string[]
  samplers: SamplerDropdown[]
  terminals: string[]
  products: string[]
  agents: string[]
  clients: string[]
}

export interface SamplingRosterInitData {
  shipNominations: ShipNomination[]
  molekulisLoadings: MolekulisLoading[]
  otherJobs: OtherJob[]
  dropdowns: DropdownsData
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * Fetch all initialization data for Sampling Roster in a single request
 */
export const getSamplingRosterInitData = async (): Promise<ApiResponse<SamplingRosterInitData>> => {
  const response = await api.get('/batch/sampling-roster-init')
  return response.data
}

/**
 * Fetch all dropdowns in a single request
 */
export const getAllDropdowns = async (includeInactive = false): Promise<ApiResponse<DropdownsData>> => {
  const response = await api.get('/batch/dropdowns', {
    params: { includeInactive }
  })
  return response.data
}
