<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-[100000]" @close="handleClose">
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
        <div class="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity" />
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
              class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all max-h-[90vh] flex flex-col"
            >
              <!-- Header -->
              <div class="px-5 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3 mb-2">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <WarningIcon class="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <DialogTitle class="text-xl font-bold text-gray-900 dark:text-white">
                    Sampler Conflict Detected
                  </DialogTitle>
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm ml-[52px]">
                  {{ conflictData?.samplerName }} has a scheduling conflict. Review the details below to proceed with override.
                </p>
              </div>

              <!-- Conflict Details -->
              <div class="px-5 py-3 space-y-3 overflow-y-auto flex-1">
                <!-- Conflict Type -->
                <div class="rounded-lg border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <svg class="h-4 w-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span class="text-sm font-semibold text-orange-900 dark:text-orange-200">Conflict Type:</span>
                  </div>
                  <p class="text-sm text-orange-800 dark:text-orange-300">{{ conflictData?.reason }}</p>
                </div>

                <!-- Previous Shift -->
                <div v-if="conflictData?.previousShift" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">Previous Shift</span>
                  </div>
                  <div class="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span class="text-gray-600 dark:text-gray-400">Start:</span>
                      <p class="font-medium text-gray-900 dark:text-white text-sm">{{ formatDateTime(conflictData.previousShift?.start || '') }}</p>
                    </div>
                    <div>
                      <span class="text-gray-600 dark:text-gray-400">End:</span>
                      <p class="font-medium text-gray-900 dark:text-white text-sm">{{ formatDateTime(conflictData.previousShift?.end || '') }}</p>
                    </div>
                    <div v-if="conflictData?.previousShift?.duration" class="col-span-2 flex justify-between">
                      <span class="text-gray-600 dark:text-gray-400">Duration:</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ conflictData.previousShift.duration }}</span>
                    </div>
                    <div v-if="conflictData?.previousShift?.source" class="col-span-2 flex justify-between">
                      <span class="text-gray-600 dark:text-gray-400">Source:</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ conflictData.previousShift.source }}</span>
                    </div>
                  </div>
                </div>

                <!-- Proposed Shift -->
                <div class="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span class="text-sm font-semibold text-blue-900 dark:text-blue-200">Proposed Shift</span>
                  </div>
                  <div class="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span class="text-blue-700 dark:text-blue-300">Start:</span>
                      <p class="font-medium text-blue-900 dark:text-blue-100 text-sm">{{ formatDateTime(conflictData?.proposedShift?.start || '') }}</p>
                    </div>
                    <div>
                      <span class="text-blue-700 dark:text-blue-300">End:</span>
                      <p class="font-medium text-blue-900 dark:text-blue-100 text-sm">{{ formatDateTime(conflictData?.proposedShift?.end || '') }}</p>
                    </div>
                    <div v-if="conflictData?.proposedShift?.duration" class="col-span-2 flex justify-between">
                      <span class="text-blue-700 dark:text-blue-300">Duration:</span>
                      <span class="font-medium text-blue-900 dark:text-blue-100">{{ conflictData.proposedShift.duration }}</span>
                    </div>
                  </div>
                </div>

                <!-- Rest Period Warning -->
                <div v-if="conflictData?.restHours !== undefined" class="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-2.5">
                  <div class="flex items-center gap-2">
                    <svg class="h-4 w-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-xs font-medium text-yellow-900 dark:text-yellow-200">
                      Rest Period: {{ conflictData?.restHours?.toFixed(1) }}h (Minimum 10h required)
                    </span>
                  </div>
                </div>

                <!-- Weekly Hours Limit Warning -->
                <div v-if="conflictData?.weeklyHoursDetails" class="rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="h-4 w-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span class="text-sm font-semibold text-red-900 dark:text-red-200">Weekly Hours Limit Exceeded</span>
                  </div>
                  
                  <!-- Hours Summary -->
                  <div class="mb-3 space-y-1.5">
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-red-700 dark:text-red-300">Current hours this week:</span>
                      <span class="font-semibold text-red-900 dark:text-red-100">{{ conflictData.weeklyHoursDetails?.currentHours?.toFixed(1) }}h</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-red-700 dark:text-red-300">Proposed shift hours:</span>
                      <span class="font-semibold text-red-900 dark:text-red-100">{{ conflictData.weeklyHoursDetails?.proposedHours?.toFixed(1) }}h</span>
                    </div>
                    <div class="flex justify-between items-center text-xs pt-1.5 border-t border-red-200 dark:border-red-800">
                      <span class="text-red-800 dark:text-red-200 font-semibold">Total would be:</span>
                      <span class="font-bold text-red-900 dark:text-red-100 text-base">{{ conflictData.weeklyHoursDetails?.totalHours?.toFixed(1) }}h</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-red-700 dark:text-red-300">Maximum allowed:</span>
                      <span class="font-semibold text-red-900 dark:text-red-100">{{ conflictData.weeklyHoursDetails?.maxHours }}h</span>
                    </div>
                  </div>

                  <!-- Existing Shifts List -->
                  <div v-if="conflictData?.weeklyHoursDetails?.existingShifts && conflictData.weeklyHoursDetails.existingShifts.length > 0" class="mt-2">
                    <p class="text-xs font-medium text-red-900 dark:text-red-200 mb-1.5">Existing shifts this week:</p>
                    <div class="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar">
                      <div
                        v-for="(shift, index) in conflictData.weeklyHoursDetails?.existingShifts || []"
                        :key="index"
                        class="rounded-md border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 p-2 text-xs"
                      >
                        <div class="grid grid-cols-2 gap-1.5 mb-1">
                          <div>
                            <span class="text-gray-600 dark:text-gray-400">Start:</span>
                            <p class="font-medium text-gray-900 dark:text-white text-xs">{{ formatDateTime(shift.start) }}</p>
                          </div>
                          <div>
                            <span class="text-gray-600 dark:text-gray-400">End:</span>
                            <p class="font-medium text-gray-900 dark:text-white text-xs">{{ formatDateTime(shift.end) }}</p>
                          </div>
                        </div>
                        <div class="flex justify-between items-center gap-2">
                          <span class="text-gray-600 dark:text-gray-400">Source:</span>
                          <span class="font-medium text-gray-900 dark:text-white">{{ shift.source }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600 dark:text-gray-400">Duration:</span>
                          <span class="font-semibold text-gray-900 dark:text-white">{{ shift.duration.toFixed(1) }}h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <button
                  @click="handleClose"
                  class="flex-1 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  @click="handleOverride"
                  class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-all duration-200"
                >
                  Override & Continue
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
import { WarningIcon } from '@/icons'

interface PreviousShift {
  start: Date | string
  end: Date | string
  duration?: string
  source?: string
}

interface ProposedShift {
  start: Date | string
  end: Date | string
  duration?: string
}

interface WeeklyHoursDetails {
  currentHours: number
  proposedHours: number
  totalHours: number
  maxHours: number
  existingShifts: Array<{
    start: Date | string
    end: Date | string
    duration: number
    source: string
  }>
}

interface ConflictData {
  samplerName: string
  reason: string
  previousShift?: PreviousShift
  proposedShift: ProposedShift
  restHours?: number
  weeklyHoursDetails?: WeeklyHoursDetails
}

interface Props {
  isOpen: boolean
  conflictData: ConflictData | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  override: []
  close: []
}>()

const formatDateTime = (date: Date | string): string => {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const handleOverride = () => {
  emit('override')
  handleClose()
}

const handleClose = () => {
  emit('close')
}
</script>

