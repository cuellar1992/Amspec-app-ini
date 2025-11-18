import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ApiResponse } from '@/types/api'

export interface OtherJob {
  _id: string
  when: Date | string
  description: string
  who: string
  startAt: Date | string
  endAt: Date | string
  hours: number
  status: 'pending' | 'in-progress' | 'completed'
  createdAt?: Date | string
  updatedAt?: Date | string
}

export const useOtherJobsStore = defineStore('otherJobs', () => {
  const jobs = ref<OtherJob[]>([])
  const lastFetched = ref<number | null>(null)
  const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

  // Computed
  const activeJobs = computed(() =>
    jobs.value.filter(j => j.status !== 'completed')
  )

  const pendingJobs = computed(() =>
    jobs.value.filter(j => j.status === 'pending')
  )

  const inProgressJobs = computed(() =>
    jobs.value.filter(j => j.status === 'in-progress')
  )

  // Actions
  const setJobs = (newJobs: OtherJob[]) => {
    jobs.value = newJobs
    lastFetched.value = Date.now()
  }

  const addJob = (job: OtherJob) => {
    const index = jobs.value.findIndex(j => j._id === job._id)
    if (index === -1) {
      jobs.value.unshift(job)
    } else {
      jobs.value[index] = job
    }
  }

  const updateJob = (job: OtherJob) => {
    const index = jobs.value.findIndex(j => j._id === job._id)
    if (index !== -1) {
      jobs.value[index] = job
    }
  }

  const removeJob = (id: string) => {
    jobs.value = jobs.value.filter(j => j._id !== id)
  }

  const isCacheValid = () => {
    if (!lastFetched.value) return false
    return Date.now() - lastFetched.value < CACHE_DURATION
  }

  const invalidateCache = () => {
    lastFetched.value = null
  }

  const getJobById = (id: string) => {
    return jobs.value.find(j => j._id === id)
  }

  const getJobsByDateRange = (startDate: Date, endDate: Date) => {
    return jobs.value.filter(j => {
      const jobStart = new Date(j.startAt)
      const jobEnd = new Date(j.endAt)
      return (
        (jobStart >= startDate && jobStart <= endDate) ||
        (jobEnd >= startDate && jobEnd <= endDate) ||
        (jobStart <= startDate && jobEnd >= endDate)
      )
    })
  }

  const getJobsBySampler = (sampler: string) => {
    return jobs.value.filter(j => j.who === sampler)
  }

  const getJobsByDescription = (searchTerm: string) => {
    const term = searchTerm.toLowerCase()
    return jobs.value.filter(j => j.description.toLowerCase().includes(term))
  }

  return {
    // State
    jobs,
    lastFetched,

    // Computed
    activeJobs,
    pendingJobs,
    inProgressJobs,

    // Actions
    setJobs,
    addJob,
    updateJob,
    removeJob,
    isCacheValid,
    invalidateCache,
    getJobById,
    getJobsByDateRange,
    getJobsBySampler,
    getJobsByDescription
  }
})
