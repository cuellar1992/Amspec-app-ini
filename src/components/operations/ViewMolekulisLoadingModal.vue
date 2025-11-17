<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" class="relative z-[999999]" @close="handleClose">
      <TransitionChild
        as="template"
        enter="duration-200 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/40" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-200 ease-out"
            enter-from="opacity-0 translate-y-2 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="duration-150 ease-in"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-2 sm:scale-95"
          >
            <DialogPanel class="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
              <div class="flex items-center justify-between">
                <DialogTitle class="text-lg font-semibold text-gray-900 dark:text-white">Loading Details</DialogTitle>
                <button @click="handleClose" class="rounded p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div class="mt-4 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</div>
                    <div class="text-sm text-gray-900 dark:text-gray-100">{{ formattedDate }}</div>
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Surveyor</div>
                    <div class="text-sm text-gray-900 dark:text-gray-100">{{ item?.who || '-' }}</div>
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</div>
                    <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium" :class="statusBadgeClass(status)">{{ status }}</span>
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Shift</div>
                    <div class="text-sm text-gray-900 dark:text-gray-100">{{ shiftText }}</div>
                  </div>
                </div>

                <div>
                  <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Loads</div>
                  <ul class="space-y-1 text-sm text-gray-900 dark:text-gray-100">
                    <li v-for="(l, idx) in item?.loads || []" :key="idx">
                      L{{ idx + 1 }} - {{ l.product }} {{ l.time }}
                    </li>
                    <li v-if="!item?.loads || !item?.loads.length" class="text-gray-500 dark:text-gray-400">No loads</li>
                  </ul>
                </div>
              </div>

              <div class="mt-6 flex justify-end gap-2">
                <button type="button" @click="handleClose" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Close</button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { computed } from 'vue'

interface LoadItem { time: string; product: string }
interface MolekulisLoadingItem {
  _id: string
  when: string
  who: string
  startAt: string
  endAt: string
  loads: LoadItem[]
}

interface Props {
  isOpen: boolean
  item: MolekulisLoadingItem | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const handleClose = () => { emit('close') }

const formattedDate = computed(() => {
  if (!props.item?.when) return '-'
  const d = new Date(props.item.when)
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' })
})

const two = (n: number) => (n < 10 ? `0${n}` : `${n}`)

const formatTime = (iso?: string) => {
  if (!iso) return '--:--'
  const d = new Date(iso)
  return `${two(d.getHours())}:${two(d.getMinutes())}`
}

const hoursDiff = computed(() => {
  if (!props.item?.startAt || !props.item?.endAt) return 0
  const s = new Date(props.item.startAt).getTime()
  const e = new Date(props.item.endAt).getTime()
  const diff = Math.max(0, e - s)
  return +(diff / 36e5).toFixed(0)
})

const shiftText = computed(() => {
  if (!props.item) return '-'
  return `${formatTime(props.item.startAt)} - ${formatTime(props.item.endAt)} (${hoursDiff.value}h)`
})

const status = computed(() => {
  const now = new Date()
  const start = props.item?.startAt ? new Date(props.item.startAt) : null
  const end = props.item?.endAt ? new Date(props.item.endAt) : null
  if (start && now < start) return 'pending'
  if (start && end && now >= start && now <= end) return 'in-progress'
  if (end && now > end) return 'completed'
  return 'pending'
})

const statusBadgeClass = (s: string) => {
  if (s === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (s === 'in-progress') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}
</script>


