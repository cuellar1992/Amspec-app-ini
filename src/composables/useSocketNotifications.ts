import { onMounted, onUnmounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAutoSocket } from '@/composables/useSocket'
import { useShipNominationsStore } from '@/stores/shipNominations'
import { useMolekulisLoadingStore } from '@/stores/molekulisLoading'
import { useOtherJobsStore } from '@/stores/otherJobs'
import type { ShipNomination } from '@/services/shipNominationService'
import type { MolekulisLoading } from '@/services/molekulisLoadingService'
import type { OtherJob } from '@/services/otherJobsService'

/**
 * Centralized WebSocket notifications handler
 * This composable should be used ONLY ONCE in the main App/Layout component
 * to prevent duplicate notifications across different views
 */
export function useSocketNotifications() {
  const toast = useToast()
  const socket = useAutoSocket()
  const shipsStore = useShipNominationsStore()
  const molekulisStore = useMolekulisLoadingStore()
  const otherJobsStore = useOtherJobsStore()

  // Ship Nomination Handlers
  const handleShipNominationCreated = (nomination: ShipNomination) => {
    console.log('🔔 New ship nomination created:', nomination)
    shipsStore.addShip(nomination)
    // Only show notification for changes from other users
    // User's own actions are notified by the form component
  }

  const handleShipNominationUpdated = (nomination: ShipNomination) => {
    console.log('🔔 Ship nomination updated:', nomination)
    shipsStore.updateShipInStore(nomination)
    // Only show notification for changes from other users
    // User's own actions are notified by the form component
  }

  const handleShipNominationDeleted = (data: { id: string }) => {
    console.log('🔔 Ship nomination deleted:', data.id)
    shipsStore.removeShip(data.id)
    // Only show notification for changes from other users
    // User's own actions are notified by the form component
  }

  // Molekulis Loading Handlers
  const handleMolekulisLoadingCreated = (loading: MolekulisLoading) => {
    console.log('🔔 New molekulis loading created:', loading)
    molekulisStore.addLoading(loading)
    // Only show notification for changes from other users
    // User's own actions are notified by the component
  }

  const handleMolekulisLoadingUpdated = (loading: MolekulisLoading) => {
    console.log('🔔 Molekulis loading updated:', loading)
    molekulisStore.updateLoading(loading)
    // Only show notification for changes from other users
    // User's own actions are notified by the component
  }

  const handleMolekulisLoadingDeleted = (data: { id: string }) => {
    console.log('🔔 Molekulis loading deleted:', data.id)
    molekulisStore.removeLoading(data.id)
    // Only show notification for changes from other users
    // User's own actions are notified by the component
  }

  // Other Jobs Handlers
  const handleOtherJobCreated = (job: OtherJob) => {
    console.log('🔔 New other job created:', job)
    otherJobsStore.addJob(job)
    // Only show notification for changes from other users
    // User's own actions are notified by the component
  }

  const handleOtherJobUpdated = (job: OtherJob) => {
    console.log('🔔 Other job updated:', job)
    otherJobsStore.updateJob(job)
    // Only show notification for changes from other users
    // User's own actions are notified by the component
  }

  const handleOtherJobDeleted = (data: { id: string }) => {
    console.log('🔔 Other job deleted:', data.id)
    otherJobsStore.removeJob(data.id)
    // Only show notification for changes from other users
    // User's own actions are notified by the component
  }

  // Sampling Roster Handlers
  const handleSamplingRosterCreated = (rosterData: any) => {
    console.log('🔔 New sampling roster created:', rosterData)
    // Only show notification for changes from other users
    // User's own actions are notified by the component
  }

  const setupListeners = () => {
    // Ship Nomination Events
    socket.on('ship-nomination:created', handleShipNominationCreated)
    socket.on('ship-nomination:updated', handleShipNominationUpdated)
    socket.on('ship-nomination:deleted', handleShipNominationDeleted)

    // Molekulis Loading Events
    socket.on('molekulis-loading:created', handleMolekulisLoadingCreated)
    socket.on('molekulis-loading:updated', handleMolekulisLoadingUpdated)
    socket.on('molekulis-loading:deleted', handleMolekulisLoadingDeleted)

    // Other Job Events
    socket.on('other-job:created', handleOtherJobCreated)
    socket.on('other-job:updated', handleOtherJobUpdated)
    socket.on('other-job:deleted', handleOtherJobDeleted)

    // Sampling Roster Events
    socket.on('sampling-roster:created', handleSamplingRosterCreated)

    console.log('✅ Centralized WebSocket notification listeners registered')
  }

  const cleanupListeners = () => {
    // Ship Nomination Events
    socket.off('ship-nomination:created', handleShipNominationCreated)
    socket.off('ship-nomination:updated', handleShipNominationUpdated)
    socket.off('ship-nomination:deleted', handleShipNominationDeleted)

    // Molekulis Loading Events
    socket.off('molekulis-loading:created', handleMolekulisLoadingCreated)
    socket.off('molekulis-loading:updated', handleMolekulisLoadingUpdated)
    socket.off('molekulis-loading:deleted', handleMolekulisLoadingDeleted)

    // Other Job Events
    socket.off('other-job:created', handleOtherJobCreated)
    socket.off('other-job:updated', handleOtherJobUpdated)
    socket.off('other-job:deleted', handleOtherJobDeleted)

    // Sampling Roster Events
    socket.off('sampling-roster:created', handleSamplingRosterCreated)

    console.log('🧹 Centralized WebSocket notification listeners cleaned up')
  }

  onMounted(() => {
    setupListeners()
  })

  onUnmounted(() => {
    cleanupListeners()
  })

  return {
    setupListeners,
    cleanupListeners
  }
}
