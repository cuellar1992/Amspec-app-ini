import api from './api'

export interface OtherJobData {
  when: string
  description: string
  who: string
  startAt: string
  endAt: string
}

export interface OtherJob extends OtherJobData {
  _id: string
  hours: number
  status?: 'pending' | 'in-progress' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  total?: number
  count?: number
  page?: number
  pages?: number
  limit?: number
}

export const listOtherJobs = async (params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<ApiResponse<OtherJob[]>> => {
  const response = await api.get('/other-jobs', { params })
  return response.data
}

export const createOtherJob = async (data: OtherJobData): Promise<ApiResponse<OtherJob>> => {
  const response = await api.post('/other-jobs', data)
  return response.data
}

export const updateOtherJob = async (id: string, data: Partial<OtherJobData>): Promise<ApiResponse<OtherJob>> => {
  const response = await api.put(`/other-jobs/${id}`, data)
  return response.data
}

export const deleteOtherJob = async (id: string): Promise<ApiResponse<Record<string, never>>> => {
  const response = await api.delete(`/other-jobs/${id}`)
  return response.data
}


