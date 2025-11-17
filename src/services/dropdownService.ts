import api from './api'
import type { ApiResponse } from './shipNominationService'

export interface DropdownItem {
  _id: string
  name: string
  email?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Terminal extends DropdownItem {
  berths: string[]
  requiresLineSampling: boolean
}

/**
 * Generic dropdown service for all dropdown endpoints with caching
 */
class DropdownService {
  private baseUrl = '/dropdowns'

  // Cache configuration
  private cache = new Map<string, { data: DropdownItem[]; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

  /**
   * Invalidate cache for a specific type
   */
  invalidateCache(type: string, includeInactive = false): void {
    const cacheKey = `${type}-${includeInactive}`
    this.cache.delete(cacheKey)
  }

  /**
   * Invalidate all cache entries for a base type (regardless of includeInactive flag)
   */
  invalidateAllForType(type: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${type}-`)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  // Get all items for a specific dropdown type
  async getAll(type: string, includeInactive = false): Promise<ApiResponse<DropdownItem[]>> {
    try {
      const params = includeInactive ? { includeInactive: 'true' } : {}
      const cacheKey = `${type}-${includeInactive}`

      // Check cache first
      const cached = this.cache.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        return {
          success: true,
          data: cached.data
        }
      }

      // Fetch from API
      const response = await api.get(`${this.baseUrl}/${type}`, { params })

      // Cache the successful response
      if (response.data.success) {
        this.cache.set(cacheKey, {
          data: response.data.data,
          timestamp: Date.now()
        })
      }

      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const axiosError = error as { response?: { data?: { message?: string } } }
      const responseMessage = axiosError.response?.data?.message || `Failed to fetch ${type}`
      
      return {
        success: false,
        message: responseMessage,
        error: errorMessage,
      }
    }
  }

  // Get single item by ID
  async getById(type: string, id: string): Promise<ApiResponse<DropdownItem>> {
    try {
      const response = await api.get(`${this.baseUrl}/${type}/${id}`)
      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const axiosError = error as { response?: { data?: { message?: string } } }
      const responseMessage = axiosError.response?.data?.message || `Failed to fetch ${type} item`
      
      return {
        success: false,
        message: responseMessage,
        error: errorMessage,
      }
    }
  }

  // Create new item
  async create(
    type: string,
    name: string,
    data?: { email?: string; [key: string]: unknown }
  ): Promise<ApiResponse<DropdownItem>> {
    try {
      const payload = { name, ...data }
      const response = await api.post(`${this.baseUrl}/${type}`, payload)

      // Invalidate cache on successful create
      if (response.data.success) {
        this.invalidateAllForType(type)
      }

      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const axiosError = error as { response?: { data?: { message?: string } } }
      const responseMessage = axiosError.response?.data?.message || `Failed to create ${type}`
      
      return {
        success: false,
        message: responseMessage,
        error: errorMessage,
      }
    }
  }

  // Update item
  async update(
    type: string,
    id: string,
    data: {
      name?: string
      isActive?: boolean
      email?: string
      phone?: string
      has24HourRestriction?: boolean
      restrictedDays?: number[]
      [key: string]: unknown
    }
  ): Promise<ApiResponse<DropdownItem>> {
    try {
      const response = await api.put(`${this.baseUrl}/${type}/${id}`, data)

      // Invalidate cache on successful update
      if (response.data.success) {
        this.invalidateAllForType(type)
      }

      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const axiosError = error as { response?: { data?: { message?: string } } }
      const responseMessage = axiosError.response?.data?.message || `Failed to update ${type}`
      
      return {
        success: false,
        message: responseMessage,
        error: errorMessage,
      }
    }
  }

  // Delete item (soft delete)
  async delete(type: string, id: string): Promise<ApiResponse<DropdownItem>> {
    try {
      const response = await api.delete(`${this.baseUrl}/${type}/${id}`)

      // Invalidate cache on successful delete
      if (response.data.success) {
        this.invalidateAllForType(type)
      }

      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const axiosError = error as { response?: { data?: { message?: string } } }
      const responseMessage = axiosError.response?.data?.message || `Failed to delete ${type}`
      
      return {
        success: false,
        message: responseMessage,
        error: errorMessage,
      }
    }
  }

  // Permanent delete
  async permanentDelete(type: string, id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`${this.baseUrl}/${type}/${id}/permanent`)
      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const axiosError = error as { response?: { data?: { message?: string } } }
      const responseMessage = axiosError.response?.data?.message || `Failed to permanently delete ${type}`
      
      return {
        success: false,
        message: responseMessage,
        error: errorMessage,
      }
    }
  }

  // Specific methods for each dropdown type
  async getAgents(includeInactive = false) {
    return this.getAll('agents', includeInactive)
  }

  async getBerths(includeInactive = false) {
    return this.getAll('berths', includeInactive)
  }

  async getChemists(includeInactive = false) {
    return this.getAll('chemists', includeInactive)
  }

  async getSamplers(includeInactive = false) {
    return this.getAll('samplers', includeInactive)
  }

  async getSurveyors(includeInactive = false) {
    return this.getAll('surveyors', includeInactive)
  }

  async getTerminals(includeInactive = false) {
    return this.getAll('terminals', includeInactive)
  }

  async getClients(includeInactive = false) {
    return this.getAll('clients', includeInactive)
  }

  async getProductTypes(includeInactive = false) {
    return this.getAll('product-types', includeInactive)
  }

  // Terminal-specific methods with berths and line sampling support
  async createTerminal(data: { name: string; berths?: string[]; requiresLineSampling?: boolean }): Promise<ApiResponse<Terminal>> {
    try {
      const response = await api.post(`${this.baseUrl}/terminals`, data)

      // Invalidate cache on successful create
      if (response.data.success) {
        this.invalidateAllForType('terminals')
      }

      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const axiosError = error as { response?: { data?: { message?: string } } }
      const responseMessage = axiosError.response?.data?.message || 'Failed to create terminal'
      
      return {
        success: false,
        message: responseMessage,
        error: errorMessage,
      }
    }
  }

  async updateTerminal(id: string, data: { name?: string; berths?: string[]; requiresLineSampling?: boolean; isActive?: boolean }): Promise<ApiResponse<Terminal>> {
    try {
      const response = await api.put(`${this.baseUrl}/terminals/${id}`, data)

      // Invalidate cache on successful update
      if (response.data.success) {
        this.invalidateAllForType('terminals')
      }

      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const axiosError = error as { response?: { data?: { message?: string } } }
      const responseMessage = axiosError.response?.data?.message || 'Failed to update terminal'
      
      return {
        success: false,
        message: responseMessage,
        error: errorMessage,
      }
    }
  }

  async deleteTerminal(id: string): Promise<ApiResponse<Terminal>> {
    try {
      const response = await api.delete(`${this.baseUrl}/terminals/${id}`)

      // Invalidate cache on successful delete
      if (response.data.success) {
        this.invalidateAllForType('terminals')
      }

      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const axiosError = error as { response?: { data?: { message?: string } } }
      const responseMessage = axiosError.response?.data?.message || 'Failed to delete terminal'
      
      return {
        success: false,
        message: responseMessage,
        error: errorMessage,
      }
    }
  }
}

export const dropdownService = new DropdownService()
export default dropdownService
