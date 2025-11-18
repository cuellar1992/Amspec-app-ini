import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ApiResponse } from '@/types/api'

export interface Load {
  time: string
  product: 'Hyvolt I' | 'Hyvol III'
}

export interface MolekulisLoading {
  _id: string
  when: Date | string
  who: string
  startAt: Date | string
  endAt: Date | string
  hours: number
  status: 'pending' | 'in-progress' | 'completed'
  loads: Load[]
  createdAt?: Date | string
  updatedAt?: Date | string
}

export const useMolekulisLoadingStore = defineStore('molekulisLoading', () => {
  const loadings = ref<MolekulisLoading[]>([])
  const lastFetched = ref<number | null>(null)
  const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

  // Computed
  const activeLoadings = computed(() =>
    loadings.value.filter(l => l.status !== 'completed')
  )

  const pendingLoadings = computed(() =>
    loadings.value.filter(l => l.status === 'pending')
  )

  const inProgressLoadings = computed(() =>
    loadings.value.filter(l => l.status === 'in-progress')
  )

  // Actions
  const setLoadings = (newLoadings: MolekulisLoading[]) => {
    loadings.value = newLoadings
    lastFetched.value = Date.now()
  }

  const addLoading = (loading: MolekulisLoading) => {
    const index = loadings.value.findIndex(l => l._id === loading._id)
    if (index === -1) {
      loadings.value.unshift(loading)
    } else {
      loadings.value[index] = loading
    }
  }

  const updateLoading = (loading: MolekulisLoading) => {
    const index = loadings.value.findIndex(l => l._id === loading._id)
    if (index !== -1) {
      loadings.value[index] = loading
    }
  }

  const removeLoading = (id: string) => {
    loadings.value = loadings.value.filter(l => l._id !== id)
  }

  const isCacheValid = () => {
    if (!lastFetched.value) return false
    return Date.now() - lastFetched.value < CACHE_DURATION
  }

  const invalidateCache = () => {
    lastFetched.value = null
  }

  const getLoadingById = (id: string) => {
    return loadings.value.find(l => l._id === id)
  }

  const getLoadingsByDateRange = (startDate: Date, endDate: Date) => {
    return loadings.value.filter(l => {
      const loadingStart = new Date(l.startAt)
      const loadingEnd = new Date(l.endAt)
      return (
        (loadingStart >= startDate && loadingStart <= endDate) ||
        (loadingEnd >= startDate && loadingEnd <= endDate) ||
        (loadingStart <= startDate && loadingEnd >= endDate)
      )
    })
  }

  const getLoadingsBySampler = (sampler: string) => {
    return loadings.value.filter(l => l.who === sampler)
  }

  return {
    // State
    loadings,
    lastFetched,

    // Computed
    activeLoadings,
    pendingLoadings,
    inProgressLoadings,

    // Actions
    setLoadings,
    addLoading,
    updateLoading,
    removeLoading,
    isCacheValid,
    invalidateCache,
    getLoadingById,
    getLoadingsByDateRange,
    getLoadingsBySampler
  }
})
