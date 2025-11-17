<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-[999999]" @close="handleClose">
      <!-- Backdrop -->
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
      </TransitionChild>

      <!-- Modal Container -->
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95 translate-y-4"
            enter-to="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100 translate-y-0"
            leave-to="opacity-0 scale-95 translate-y-4"
          >
            <DialogPanel
              class="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transform transition-all"
            >
              <!-- Modal Header -->
              <div
                class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gradient-to-r from-brand-50 to-white dark:from-gray-800 dark:to-gray-800"
              >
                <DialogTitle class="text-2xl font-bold text-gray-900 dark:text-white">
                  Nomination Details
                </DialogTitle>
                <button
                  @click="handleClose"
                  class="rounded-lg p-2 text-gray-400 hover:bg-white/50 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white transition-all duration-200"
                >
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Modal Content -->
              <div class="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-6">
                <div v-if="nomination" class="space-y-6">
                  <!-- Basic Information -->
                  <div class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Basic Information
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Vessel Name</label>
                        <p class="mt-1 text-base font-semibold text-gray-900 dark:text-white">{{ nomination.vesselName }}</p>
                      </div>
                      <div>
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">AmSpec Reference</label>
                        <p class="mt-1 text-base font-semibold text-brand-600 dark:text-brand-400">{{ nomination.amspecReference }}</p>
                      </div>
                      <div v-if="nomination.clientReference">
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Client Reference</label>
                        <p class="mt-1 text-base text-gray-900 dark:text-white">{{ nomination.clientReference }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Clients and Product Types -->
                  <div class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Products & Clients</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Clients</label>
                        <div v-if="nomination.clients && nomination.clients.length > 0" class="flex flex-wrap gap-2">
                          <span
                            v-for="(client, index) in nomination.clients"
                            :key="index"
                            class="inline-flex rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            {{ client }}
                          </span>
                        </div>
                        <p v-else class="text-gray-500 dark:text-gray-400">No clients assigned</p>
                      </div>
                      <div>
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Product Types</label>
                        <div v-if="nomination.productTypes && nomination.productTypes.length > 0" class="flex flex-wrap gap-2">
                          <span
                            v-for="(productType, index) in nomination.productTypes"
                            :key="index"
                            class="inline-flex rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          >
                            {{ productType }}
                          </span>
                        </div>
                        <p v-else class="text-gray-500 dark:text-gray-400">No product types assigned</p>
                      </div>
                    </div>
                  </div>

                  <!-- Operations Team -->
                  <div class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Operations Team</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div v-if="nomination.agent">
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Agent</label>
                        <p class="mt-1 text-base text-gray-900 dark:text-white">{{ nomination.agent }}</p>
                      </div>
                      <div v-if="nomination.surveyor">
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Surveyor</label>
                        <p class="mt-1 text-base text-gray-900 dark:text-white">{{ nomination.surveyor }}</p>
                      </div>
                      <div v-if="nomination.sampler">
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Sampler</label>
                        <p class="mt-1 text-base text-gray-900 dark:text-white">{{ nomination.sampler }}</p>
                      </div>
                      <div v-if="nomination.chemist">
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Chemist</label>
                        <p class="mt-1 text-base text-gray-900 dark:text-white">{{ nomination.chemist }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Location & Timing -->
                  <div class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location & Timing</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div class="space-y-4">
                        <div v-if="nomination.terminal">
                          <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Terminal</label>
                          <p class="mt-1 text-base text-gray-900 dark:text-white">{{ nomination.terminal }}</p>
                        </div>
                        <div v-if="nomination.berth">
                          <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Berth</label>
                          <p class="mt-1 text-base text-gray-900 dark:text-white">{{ nomination.berth }}</p>
                        </div>
                      </div>
                      <div class="space-y-4">
                        <div v-if="nomination.pilotOnBoard">
                          <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Pilot on Board</label>
                          <p class="mt-1 text-base text-gray-900 dark:text-white">{{ formatDate(nomination.pilotOnBoard) }}</p>
                        </div>
                        <div v-if="nomination.etb">
                          <label class="text-sm font-medium text-gray-600 dark:text-gray-400">ETB (Estimated Time of Berthing)</label>
                          <p class="mt-1 text-base text-gray-900 dark:text-white">{{ formatDate(nomination.etb) }}</p>
                        </div>
                        <div v-if="nomination.etc">
                          <label class="text-sm font-medium text-gray-600 dark:text-gray-400">ETC (Estimated Time of Completion)</label>
                          <p class="mt-1 text-base text-gray-900 dark:text-white">{{ formatDate(nomination.etc) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Status -->
                  <div class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status</h3>
                    <div class="flex items-center gap-3">
                      <span
                        class="inline-flex rounded-full px-4 py-2 text-sm font-medium"
                        :class="
                          nomination.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : nomination.status === 'approved'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : nomination.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : nomination.status === 'cancelled'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        "
                      >
                        {{ nomination.status || 'pending' }}
                      </span>
                    </div>
                  </div>

                  <!-- Record Information -->
                  <div class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Record Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div v-if="nomination.createdAt">
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</label>
                        <p class="mt-1 text-base text-gray-900 dark:text-white">{{ formatDate(nomination.createdAt) }}</p>
                      </div>
                      <div v-if="nomination.updatedAt">
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</label>
                        <p class="mt-1 text-base text-gray-900 dark:text-white">{{ formatDate(nomination.updatedAt) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Modal Footer -->
              <div
                class="flex justify-end border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50"
              >
                <button
                  @click="handleClose"
                  class="rounded-xl bg-brand-500 px-6 py-3 text-base font-semibold text-white hover:bg-brand-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Close
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import type { ShipNomination } from '@/services/shipNominationService'

interface Props {
  isOpen: boolean
  nomination: ShipNomination | null
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const handleClose = () => {
  emit('close')
}

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
</script>

