<template>
  <AdminLayout>
    <PageBreadcrumb pageTitle="Molekulis Loading" />

    <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Form -->
      <ComponentCard title="New Load" description="Register up to 4 loads for the same day">
        <div class="p-6">
      <form class="space-y-6" @keydown.enter.prevent>
            <!-- Global When (applies to all loads) -->
            <div class="flex items-center justify-start">
              <div class="w-full md:w-auto">
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">When</label>
                <flat-pickr
                  v-model="formWhen"
                  :config="dateConfig"
                  class="h-11 w-full md:w-60 appearance-none rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-hidden focus:ring-3 dark:bg-gray-800 dark:text-white"
                  :class="submittedOnce && isWhenInvalid ? 'border-red-500 focus:ring-red-500/20 dark:border-red-600' : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'"
                  placeholder="Select date"
                />
              </div>
            </div>

            <!-- Shared Header removed: Surveyor and Sampler no longer required -->

            <!-- Single Load input + Add button -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Load</h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Time</label>
                  <flat-pickr v-model="newLoad.time" :config="timeConfig" class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-800" placeholder="Select time" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Product</label>
                  <SingleSelect
                    v-model="newLoad.product"
                    :options="productOptions"
                    placeholder="Select product"
                  />
                </div>
                <div class="md:col-span-2 flex items-end">
                  <button type="button" @click="addLoad" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Add Load
                  </button>
                </div>
              </div>
            </div>

            <!-- Loads list -->
            <div v-if="loadsList.length" class="space-y-2">
              <div class="text-sm font-medium text-gray-900 dark:text-white">Loads Added</div>
              <ul class="space-y-1">
                <li v-for="(l, i) in loadsList" :key="i" class="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                  <span class="text-gray-800 dark:text-gray-200">L{{ i + 1 }} — {{ l.product }} at {{ l.time }}</span>
                  <button type="button" @click="removeLoad(i)" class="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" title="Remove">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </li>
              </ul>
            </div>

            <!-- Who (Sampler) + Start/End + Total Hours -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Who</label>
                <div
                  :class="submittedOnce && isWhoInvalid ? '[&>*]:!border-red-500 [&>*]:focus:!ring-red-500/20 dark:[&>*]:!border-red-600' : ''"
                >
                  <SingleSelect
                    v-model="whoSampler"
                    :options="samplerOptionsFormatted"
                    placeholder="Select sampler"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Start</label>
                <flat-pickr v-model="whoStart" :config="timeConfig24hr" class="h-11 w-full appearance-none rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white" :class="submittedOnce && isStartInvalid ? 'border-red-500 focus:ring-red-500/20 dark:border-red-600' : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800'" placeholder="Select time" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">End</label>
                <flat-pickr v-model="whoEnd" :config="timeConfig24hr" class="h-11 w-full appearance-none rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white" :class="submittedOnce && isEndInvalid ? 'border-red-500 focus:ring-red-500/20 dark:border-red-600' : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800'" placeholder="Select time" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Total Hours</label>
                <input :value="whoHours" disabled class="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" />
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end">
              <div class="flex gap-2">
                <button type="button" @click="handleSubmit" :disabled="isSubmitting" class="rounded-lg bg-brand-500 px-6 py-2.5 text-white font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed">{{ isEditing ? 'Update' : 'Save' }}</button>
                <button v-if="isEditing" type="button" class="rounded-lg bg-orange-500 px-6 py-2.5 text-white font-medium hover:bg-orange-600" @click="cancelEdit">Cancel Edit</button>
                <button type="button" class="rounded-lg bg-gray-200 px-6 py-2.5 text-gray-900 font-medium hover:bg-gray-300 dark:bg-gray-700 dark:text-white" @click="resetForm">Reset</button>
              </div>
            </div>
      </form>
        </div>
      </ComponentCard>

      <!-- Right: Table -->
      <ComponentCard title="Loads" description="Recent records">
        <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span>Rows per page:</span>
            <select class="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-800" v-model.number="rowsPerPage" @change="onRowsPerPageChange">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span>Showing {{ pageStart }}–{{ pageEnd }} of {{ totalItems }}</span>
            <div class="flex items-center gap-1">
              <button class="rounded-md px-2 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300" :disabled="currentPage === 1" @click="goToPrevPage">‹</button>
              <span class="px-2">Page {{ currentPage }} / {{ totalPages }}</span>
              <button class="rounded-md px-2 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300" :disabled="currentPage === totalPages || totalPages === 0" @click="goToNextPage">›</button>
            </div>
          </div>
        </div>
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Date</th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Loads</th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Surveyor</th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Status</th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            <tr v-for="item in items" :key="item._id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{{ item.when ? formatDateOnly(item.when) : '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{{ item.loads?.length ? 'L' + item.loads.length : '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{{ item.who || '-' }}</td>
              <td class="px-6 py-4">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="statusBadgeClass(getStatus(item))">
                  {{ getStatus(item) }}
                </span>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm">
                <div class="flex items-center gap-2">
                  <button @click="viewItem(item)" class="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200" title="View">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button @click="editItem(item)" class="rounded-lg p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-all duration-200" title="Edit">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button @click="openConfirmDelete(item)" class="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200" title="Delete">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </ComponentCard>
    </div>
  
  <!-- View Modal -->
  <ViewMolekulisLoadingModal :isOpen="isViewOpen" :item="viewTarget" @close="isViewOpen=false" />
  <!-- Delete Confirmation Modal -->
  <ConfirmationModal
    v-if="isDeleteOpen"
    :isOpen="isDeleteOpen"
    title="Delete Loading"
    message="Are you sure you want to delete this loading? This action cannot be undone."
    variant="danger"
    confirmText="Delete"
    @close="isDeleteOpen=false"
    @confirm="confirmDelete"
  />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { useToast } from 'vue-toastification'
import dropdownService from '@/services/dropdownService'
import { createMolekulisLoading, updateMolekulisLoading, listMolekulisLoadings, deleteMolekulisLoading, type MolekulisLoading, type MolekulisLoadingData } from '@/services/molekulisLoadingService'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import ViewMolekulisLoadingModal from '@/components/operations/ViewMolekulisLoadingModal.vue'
import ConfirmationModal from '@/components/ui/ConfirmationModal.vue'
import SingleSelect from '@/components/forms/FormElements/SingleSelect.vue'
import { useMolekulisLoadingStore } from '@/stores/molekulisLoading'
import { useAutoSocket } from '@/composables/useSocket'

const toast = useToast()
const loadingStore = useMolekulisLoadingStore()
const socket = useAutoSocket()

// Build payload at submit time; legacy form removed

// Global "When" for this loading session (applies as context)
const formWhen = ref<string>('')

const samplerOptions = ref<string[]>([])
const whoSampler = ref<string>('')
const whoStart = ref<string>('')
const whoEnd = ref<string>('')

// Product options for SingleSelect
const productOptions = computed(() => [
  { value: 'Hyvolt I', label: 'Hyvolt I' },
  { value: 'Hyvol III', label: 'Hyvol III' }
])

// Sampler options formatted for SingleSelect
const samplerOptionsFormatted = computed(() => {
  return samplerOptions.value.map((name) => ({ value: name, label: name }))
})

const buildDateTime = (dateStr: string, timeStr: string) => {
  if (!dateStr || !timeStr) return null
  // Expect dateStr as 'Y-m-d' and timeStr as 'HH:mm'
  const [y, m, d] = dateStr.split('-').map((x) => parseInt(x))
  const [hh, mm] = timeStr.split(':').map((x) => parseInt(x))
  if (!y || !m || !d || (hh === undefined) || (mm === undefined)) return null
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

const whoHours = computed(() => {
  const start = buildDateTime(formWhen.value, whoStart.value)
  const end = buildDateTime(formWhen.value, whoEnd.value)
  if (!start || !end) return '0.00'
  const diff = end.getTime() - start.getTime()
  return diff > 0 ? (diff / 36e5).toFixed(2) : '0.00'
})

// Date-only config for global "When"
const dateConfig = {
  enableTime: false,
  dateFormat: 'Y-m-d',
  altInput: true,
  altFormat: 'F j, Y',
  locale: { firstDayOfWeek: 1 },
}

// Time-only config for per-load time selection
const timeConfig = {
  enableTime: true,
  noCalendar: true,
  dateFormat: 'H:i',
  altInput: true,
  altFormat: 'h:i K',
  time_24hr: true,
  minuteIncrement: 15,
}

// Time config for Start/End fields (24-hour format)
const timeConfig24hr = {
  enableTime: true,
  noCalendar: true,
  dateFormat: 'H:i',
  altInput: true,
  altFormat: 'H:i',
  time_24hr: true,
  minuteIncrement: 15,
}

// Loads dynamic list
type LoadProduct = '' | 'Hyvolt I' | 'Hyvol III'
const newLoad = ref<{ time: string; product: LoadProduct }>({ time: '', product: '' })
const loadsList = ref<Array<{ time: string; product: LoadProduct }>>([])

const timeToMinutes = (t: string) => {
  const parts = t.split(':')
  if (parts.length !== 2) return -1
  const hh = parseInt(parts[0])
  const mm = parseInt(parts[1])
  if (Number.isNaN(hh) || Number.isNaN(mm)) return -1
  return hh * 60 + mm
}

const isLoadsChronological = () => {
  if (!loadsList.value.length) return true
  let prev = timeToMinutes(loadsList.value[0].time)
  for (let i = 1; i < loadsList.value.length; i++) {
    const cur = timeToMinutes(loadsList.value[i].time)
    if (cur < prev) return false
    prev = cur
  }
  return true
}

const addLoad = () => {
  if (!newLoad.value.time || !newLoad.value.product) {
    toast.warning('Select time and product to add a load')
    return
    }
  if (loadsList.value.length) {
    const last = loadsList.value[loadsList.value.length - 1]
    const lastMin = timeToMinutes(last.time)
    const nextMin = timeToMinutes(newLoad.value.time)
    if (nextMin < 0 || lastMin < 0) {
      toast.error('Invalid time format')
      return
    }
    if (nextMin < lastMin) {
      toast.warning('Loads must be in chronological order')
      return
    }
  }
  loadsList.value.push({ time: newLoad.value.time, product: newLoad.value.product })
  newLoad.value = { time: '', product: '' }
}

const removeLoad = (index: number) => {
  loadsList.value.splice(index, 1)
}

const resetForm = () => {
  newLoad.value = { time: '', product: '' }
  loadsList.value = []
  formWhen.value = ''
  whoSampler.value = ''
  whoStart.value = ''
  whoEnd.value = ''
  submittedOnce.value = false
  isEditing.value = false
  editingId.value = ''
}

const isSubmitting = ref(false)
const isEditing = ref(false)
const editingId = ref<string>('')

const handleSubmit = async () => {
  console.debug('[ML] handleSubmit: invoked, isSubmitting=', isSubmitting.value)
  if (isSubmitting.value) { console.debug('[ML] handleSubmit: blocked (already submitting)'); return }
  isSubmitting.value = true
  if (!validateBeforeSubmit()) { isSubmitting.value = false; return }
  try {
    const start = buildDateTime(formWhen.value, whoStart.value)
    const end = buildDateTime(formWhen.value, whoEnd.value)
    const payload: MolekulisLoadingData = {
      when: formWhen.value,
      who: whoSampler.value,
      startAt: start ? start.toISOString() : '',
      endAt: end ? end.toISOString() : '',
      loads: loadsList.value.map((l) => ({ time: l.time, product: l.product as 'Hyvolt I' | 'Hyvol III' })),
    }
    console.debug('[ML] handleSubmit: payload', payload)
    const res = isEditing.value && editingId.value
      ? await updateMolekulisLoading(editingId.value, payload)
      : await createMolekulisLoading(payload)
    console.debug('[ML] handleSubmit: response', res)
    if (res.success) {
      toast.success(isEditing.value ? 'Loading updated' : 'Loading created')
      resetForm()
      if (!isEditing.value) currentPage.value = 1
      await loadItems().catch(() => {})
    } else {
      toast.error(res.message || 'Failed to create')
    }
  } catch (error) {
    console.error('[ML] handleSubmit: exception', error)
    toast.error(isEditing.value ? 'Failed to update' : 'Failed to create')
  } finally {
    console.debug('[ML] handleSubmit: finalize -> set isSubmitting=false')
    isSubmitting.value = false
  }
}

// Table state
const items = ref<MolekulisLoading[]>([])
const currentPage = ref(1)
const rowsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)
const pageStart = computed(() => (totalItems.value === 0 ? 0 : (currentPage.value - 1) * rowsPerPage.value + 1))
const pageEnd = computed(() => Math.min(currentPage.value * rowsPerPage.value, totalItems.value))
const isFetching = ref(false)

const loadItems = async () => {
  // Prevent concurrent requests
  if (isFetching.value) return

  try {
    isFetching.value = true
    // Reduced default limit to prevent rate limiting
    const effectiveLimit = Math.min(rowsPerPage.value, 50)
    const res = await listMolekulisLoadings({ page: currentPage.value, limit: effectiveLimit, sortBy: 'when', sortOrder: 'desc' })
    if (res.success && res.data) {
      items.value = res.data
      totalItems.value = res.total ?? res.count ?? 0
      totalPages.value = res.pages ?? Math.ceil((res.total ?? 0) / effectiveLimit)

      // Update store with fetched data
      loadingStore.setLoadings(res.data.map(l => ({ ...l, status: (l.status || 'pending') as 'pending' | 'in-progress' | 'completed' })))
    }
  } catch {
    // noop
  } finally {
    isFetching.value = false
  }
}

const onRowsPerPageChange = () => { currentPage.value = 1; loadItems() }
const goToPrevPage = () => { if (currentPage.value > 1) { currentPage.value--; loadItems() } }
const goToNextPage = () => { if (currentPage.value < totalPages.value) { currentPage.value++; loadItems() } }

onMounted(async () => {
  const samplersResponse = await dropdownService.getSamplers(true)
  if (samplersResponse.success && samplersResponse.data) {
    samplerOptions.value = samplersResponse.data.map((s: { name: string }) => s.name)
  }
  await loadItems()

  // WebSocket event listeners (notifications handled centrally in useSocketNotifications)
  socket.on('molekulis-loading:created', (loading: MolekulisLoading) => {
    // Store is already updated by central notification handler
    // Add to current view if on first page
    if (currentPage.value === 1) {
      items.value.unshift(loading)
      if (items.value.length > rowsPerPage.value) {
        items.value.pop()
      }
      totalItems.value++
    }
  })

  socket.on('molekulis-loading:updated', (loading: MolekulisLoading) => {
    // Store is already updated by central notification handler
    const index = items.value.findIndex(item => item._id === loading._id)
    if (index !== -1) {
      items.value[index] = loading
    }
  })

  socket.on('molekulis-loading:deleted', (data: { id: string }) => {
    // Store is already updated by central notification handler
    const index = items.value.findIndex(item => item._id === data.id)
    if (index !== -1) {
      items.value.splice(index, 1)
      totalItems.value--
    }
  })
})

onUnmounted(() => {
  // Cleanup WebSocket listeners
  socket.off('molekulis-loading:created')
  socket.off('molekulis-loading:updated')
  socket.off('molekulis-loading:deleted')
})

// Cancel edit handler
const cancelEdit = () => {
  resetForm()
}

// Validation
const submittedOnce = ref(false)
const isWhenInvalid = computed(() => !formWhen.value)
const isWhoInvalid = computed(() => !whoSampler.value)
const isStartInvalid = computed(() => !whoStart.value)
const isEndInvalid = computed(() => !whoEnd.value)
const hasAnyLoad = computed(() => loadsList.value.length > 0)

const validateBeforeSubmit = () => {
  submittedOnce.value = true
  if (isWhenInvalid.value || isWhoInvalid.value || isStartInvalid.value || isEndInvalid.value || !hasAnyLoad.value) {
    toast.warning('Please complete required fields: When, Who, Start, End, and at least one Load')
    return false
  }
  if (!isLoadsChronological()) {
    toast.warning('Loads must be in chronological order')
    return false
  }
  return true
}

// Helpers for table
const formatDateOnly = (dateString: string) => {
  const d = new Date(dateString)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getStatus = (item: MolekulisLoading) => {
  // Use database status if available
  if (item.status) return item.status

  // Fallback to calculation for backward compatibility
  const now = new Date()
  const start = item.startAt ? new Date(item.startAt) : null
  const end = item.endAt ? new Date(item.endAt) : null
  if (start && now < start) return 'pending'
  if (start && end && now >= start && now <= end) return 'in-progress'
  if (end && now > end) return 'completed'
  return 'pending'
}

const statusBadgeClass = (status: string) => {
  if (status === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (status === 'in-progress') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

const editItem = (item: MolekulisLoading) => {
  // Populate form for editing
  isEditing.value = true
  editingId.value = item._id
  // Normalize date to 'YYYY-MM-DD'
  const normalizeYmd = (input: string) => {
    if (!input) return ''
    if (input.includes('T')) {
      const d = new Date(input)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    return input
  }
  const isoToTime = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  formWhen.value = normalizeYmd(item.when as string)
  whoSampler.value = item.who || ''
  whoStart.value = isoToTime(item.startAt)
  whoEnd.value = isoToTime(item.endAt)
  loadsList.value = (item.loads || []).map((l: { time: string; product: 'Hyvolt I' | 'Hyvol III' }) => ({ time: l.time, product: l.product }))
  submittedOnce.value = false
}

const deleteItem = async (item: MolekulisLoading) => {
  try {
    const res = await deleteMolekulisLoading(item._id)
    if (res.success) {
      toast.success('Loading deleted')
      await loadItems()
    } else {
      toast.error(res.message || 'Failed to delete')
    }
  } catch {
    toast.error('Failed to delete')
  }
}

// View modal state
const isViewOpen = ref(false)
const viewTarget = ref<MolekulisLoading | null>(null)

const viewItem = (item: MolekulisLoading) => {
  viewTarget.value = item
  isViewOpen.value = true
}

// Delete confirmation state
const isDeleteOpen = ref(false)
const deleteTarget = ref<MolekulisLoading | null>(null)

const openConfirmDelete = (item: MolekulisLoading) => {
  deleteTarget.value = item
  isDeleteOpen.value = true
}

const confirmDelete = async () => {
  if (!deleteTarget.value) { isDeleteOpen.value = false; return }
  await deleteItem(deleteTarget.value)
  isDeleteOpen.value = false
  deleteTarget.value = null
}
</script>


