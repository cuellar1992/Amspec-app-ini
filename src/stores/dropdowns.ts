import { defineStore } from 'pinia'
import { ref } from 'vue'
import dropdownService, { type Terminal } from '@/services/dropdownService'

interface Surveyor {
  name: string
  isActive: boolean
}

interface Sampler {
  name: string
  isActive: boolean
  has24HourRestriction: boolean
  restrictedDays: number[]
}

interface Product {
  name: string
  isActive: boolean
}

interface Agent {
  name: string
  isActive: boolean
}

interface Client {
  name: string
  isActive: boolean
}

export const useDropdownsStore = defineStore('dropdowns', () => {
  // State
  const surveyors = ref<Surveyor[]>([])
  const samplers = ref<Sampler[]>([])
  const terminals = ref<Terminal[]>([])
  const products = ref<Product[]>([])
  const agents = ref<Agent[]>([])
  const clients = ref<Client[]>([])

  const isLoading = ref(false)
  const lastFetchTime = ref(0)
  const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  // Getters
  const activeSurveyors = ref<string[]>([])
  const activeSamplers = ref<string[]>([])
  const activeTerminals = ref<string[]>([])
  const activeProducts = ref<string[]>([])
  const activeAgents = ref<string[]>([])
  const activeClients = ref<string[]>([])

  // Actions
  const fetchAllDropdowns = async (forceRefresh = false) => {
    const now = Date.now()

    // Check if cache is still valid
    if (!forceRefresh && surveyors.value.length > 0 && (now - lastFetchTime.value) < CACHE_DURATION) {
      return
    }

    isLoading.value = true

    try {
      // Fetch all dropdowns in parallel
      const [
        surveyorsRes,
        samplersRes,
        terminalsRes,
        productsRes,
        agentsRes,
        clientsRes
      ] = await Promise.all([
        dropdownService.getSurveyors(true),
        dropdownService.getSamplers(true),
        dropdownService.getTerminals(true),
        dropdownService.getProducts(true),
        dropdownService.getAgents(true),
        dropdownService.getClients(true)
      ])

      // Update state
      if (surveyorsRes.success && surveyorsRes.data) {
        surveyors.value = surveyorsRes.data
        activeSurveyors.value = surveyorsRes.data
          .filter((s: Surveyor) => s.isActive)
          .map((s: Surveyor) => s.name)
      }

      if (samplersRes.success && samplersRes.data) {
        samplers.value = samplersRes.data
        activeSamplers.value = samplersRes.data
          .filter((s: Sampler) => s.isActive)
          .map((s: Sampler) => s.name)
      }

      if (terminalsRes.success && terminalsRes.data) {
        terminals.value = terminalsRes.data
        activeTerminals.value = terminalsRes.data
          .filter((t: Terminal) => t.isActive)
          .map((t: Terminal) => t.name)
      }

      if (productsRes.success && productsRes.data) {
        products.value = productsRes.data
        activeProducts.value = productsRes.data
          .filter((p: Product) => p.isActive)
          .map((p: Product) => p.name)
      }

      if (agentsRes.success && agentsRes.data) {
        agents.value = agentsRes.data
        activeAgents.value = agentsRes.data
          .filter((a: Agent) => a.isActive)
          .map((a: Agent) => a.name)
      }

      if (clientsRes.success && clientsRes.data) {
        clients.value = clientsRes.data
        activeClients.value = clientsRes.data
          .filter((c: Client) => c.isActive)
          .map((c: Client) => c.name)
      }

      lastFetchTime.value = now
    } catch (error) {
      console.error('Error fetching dropdowns:', error)
    } finally {
      isLoading.value = false
    }
  }

  const getSamplerData = (samplerName: string): Sampler | undefined => {
    return samplers.value.find(s => s.name === samplerName)
  }

  const clearCache = () => {
    surveyors.value = []
    samplers.value = []
    terminals.value = []
    products.value = []
    agents.value = []
    clients.value = []
    lastFetchTime.value = 0
  }

  return {
    // State
    surveyors,
    samplers,
    terminals,
    products,
    agents,
    clients,
    isLoading,

    // Getters
    activeSurveyors,
    activeSamplers,
    activeTerminals,
    activeProducts,
    activeAgents,
    activeClients,

    // Actions
    fetchAllDropdowns,
    getSamplerData,
    clearCache
  }
})
