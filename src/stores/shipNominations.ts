import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getAllShipNominations,
  searchShipNominations,
  checkAmspecReference,
  updateShipNomination,
  type ShipNomination,
  type ShipNominationData
} from '@/services/shipNominationService'

export const useShipNominationsStore = defineStore('shipNominations', () => {
  // State
  const shipNominations = ref<ShipNomination[]>([])
  const recentShipNominations = ref<ShipNomination[]>([])
  const isLoading = ref(false)
  const lastFetchTime = ref(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Cache for individual ship nominations by reference
  const shipNominationCache = ref<{
    [key: string]: { data: ShipNomination; timestamp: number }
  }>({})

  // Helper function to remove duplicates from array
  const removeDuplicates = (ships: ShipNomination[]): ShipNomination[] => {
    const seen = new Set<string>()
    return ships.filter(ship => {
      if (seen.has(ship._id)) {
        return false
      }
      seen.add(ship._id)
      return true
    })
  }

  // Getters
  const getByReference = computed(() => {
    return (amspecRef: string) => {
      return shipNominations.value.find(s => s.amspecReference === amspecRef)
    }
  })

  const getById = computed(() => {
    return (id: string) => {
      return shipNominations.value.find(s => s._id === id)
    }
  })

  // Actions
  const fetchRecentShipNominations = async (limit = 5, forceRefresh = false) => {
    const now = Date.now()

    // Check if cache is still valid
    if (!forceRefresh && recentShipNominations.value.length > 0 && (now - lastFetchTime.value) < CACHE_DURATION) {
      // Remove duplicates before returning
      recentShipNominations.value = removeDuplicates(recentShipNominations.value)
      return recentShipNominations.value
    }

    isLoading.value = true

    try {
      const response = await getAllShipNominations({
        limit,
        sortBy: 'etb',
        sortOrder: 'desc'
      })

      if (response.success && response.data) {
        // Remove duplicates from response
        const uniqueData = removeDuplicates(response.data)
        recentShipNominations.value = uniqueData

        // Also add to full list if not already there
        uniqueData.forEach(ship => {
          const exists = shipNominations.value.find(s => s._id === ship._id)
          if (!exists) {
            shipNominations.value.push(ship)
          }
        })
        lastFetchTime.value = now
        return uniqueData
      }
    } catch (error) {
      console.error('Error fetching recent ship nominations:', error)
    } finally {
      isLoading.value = false
    }

    return []
  }

  const searchShips = async (searchTerm: string, limit = 10) => {
    isLoading.value = true

    try {
      const response = await searchShipNominations(searchTerm, limit)

      if (response.success && response.data) {
        // Update recent list with search results (remove duplicates)
        recentShipNominations.value = response.data

        // Add to full list if not already there
        response.data.forEach(ship => {
          const exists = shipNominations.value.find(s => s._id === ship._id)
          if (!exists) {
            shipNominations.value.push(ship)
          }
        })
        return response.data
      }
    } catch (error) {
      console.error('Error searching ship nominations:', error)
    } finally {
      isLoading.value = false
    }

    return []
  }

  const getShipByReferenceCached = async (amspecRef: string): Promise<ShipNomination | null> => {
    const now = Date.now()
    const cached = shipNominationCache.value[amspecRef]

    // Check if we have a valid cached entry
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.data
    }

    // Check in store first
    const inStore = getByReference.value(amspecRef)
    if (inStore) {
      // Update cache
      shipNominationCache.value[amspecRef] = {
        data: inStore,
        timestamp: now
      }
      return inStore
    }

    // Fetch from API
    try {
      const response = await checkAmspecReference(amspecRef)
      if (response.success && response.data) {
        // Add to store
        const exists = shipNominations.value.find(s => s._id === response.data!._id)
        if (!exists) {
          shipNominations.value.push(response.data)
        }

        // Update cache
        shipNominationCache.value[amspecRef] = {
          data: response.data,
          timestamp: now
        }
        return response.data
      }
    } catch (error) {
      console.error('Error fetching ship nomination by reference:', error)
    }

    return null
  }

  const updateShip = async (id: string, data: Partial<ShipNominationData>): Promise<ShipNomination | null> => {
    try {
      const response = await updateShipNomination(id, data)

      if (response.success && response.data) {
        // Update in store
        const index = shipNominations.value.findIndex(s => s._id === id)
        if (index !== -1) {
          shipNominations.value[index] = response.data
        }

        // Update in recent list if exists
        const recentIndex = recentShipNominations.value.findIndex(s => s._id === id)
        if (recentIndex !== -1) {
          recentShipNominations.value[recentIndex] = response.data
        }

        // Invalidate cache for this ship
        const amspecRef = response.data.amspecReference
        delete shipNominationCache.value[amspecRef]

        return response.data
      }
    } catch (error) {
      console.error('Error updating ship nomination:', error)
      throw error
    }

    return null
  }

  const addShip = (ship: ShipNomination) => {
    const exists = shipNominations.value.find(s => s._id === ship._id)
    if (!exists) {
      shipNominations.value.unshift(ship)
      recentShipNominations.value.unshift(ship)

      // Remove duplicates and keep recent list limited
      recentShipNominations.value = removeDuplicates(recentShipNominations.value)
      if (recentShipNominations.value.length > 10) {
        recentShipNominations.value = recentShipNominations.value.slice(0, 10)
      }
    }
  }

  const updateShipInStore = (ship: ShipNomination) => {
    // Update in main list
    const index = shipNominations.value.findIndex(s => s._id === ship._id)
    if (index !== -1) {
      shipNominations.value[index] = ship
    }

    // Update in recent list
    const recentIndex = recentShipNominations.value.findIndex(s => s._id === ship._id)
    if (recentIndex !== -1) {
      recentShipNominations.value[recentIndex] = ship
    }

    // Invalidate cache
    if (ship.amspecReference) {
      delete shipNominationCache.value[ship.amspecReference]
    }
  }

  const removeShip = (id: string) => {
    shipNominations.value = shipNominations.value.filter(s => s._id !== id)
    recentShipNominations.value = recentShipNominations.value.filter(s => s._id !== id)

    // Clear any cache entries for this ship
    Object.keys(shipNominationCache.value).forEach(key => {
      if (shipNominationCache.value[key].data._id === id) {
        delete shipNominationCache.value[key]
      }
    })
  }

  const setRecentShipNominations = (ships: ShipNomination[]) => {
    recentShipNominations.value = removeDuplicates(ships)

    // Also clean up shipNominations list to prevent duplicates
    shipNominations.value = removeDuplicates(shipNominations.value)

    lastFetchTime.value = Date.now()
  }

  const clearCache = () => {
    shipNominations.value = []
    recentShipNominations.value = []
    shipNominationCache.value = {}
    lastFetchTime.value = 0
  }

  const invalidateCacheForReference = (amspecRef: string) => {
    delete shipNominationCache.value[amspecRef]
  }

  return {
    // State
    shipNominations,
    recentShipNominations,
    isLoading,

    // Getters
    getByReference,
    getById,

    // Actions
    fetchRecentShipNominations,
    searchShips,
    getShipByReferenceCached,
    updateShip,
    addShip,
    updateShipInStore,
    removeShip,
    setRecentShipNominations,
    clearCache,
    invalidateCacheForReference
  }
})
