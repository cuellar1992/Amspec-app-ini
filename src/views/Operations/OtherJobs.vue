<template>
  <AdminLayout>
    <PageBreadcrumb pageTitle="Other Jobs" />

    <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Form -->
      <ComponentCard title="New Other Job" description="Register an auxiliary job">
        <div class="p-6 space-y-6">
          <!-- When -->
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">When</label>
            <flat-pickr
              v-model="whenDate"
              :config="dateConfig"
              class="h-11 w-full appearance-none rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-hidden focus:ring-3 dark:bg-gray-800 dark:text-white"
              :class="submittedOnce && isWhenInvalid ? 'border-red-500 focus:ring-red-500/20 dark:border-red-600' : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'"
              placeholder="Select date"
            />
          </div>

          <!-- Job Description -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-900 dark:text-white">Job Description</label>
            <textarea
              v-model="jobDescription"
              @blur="submittedOnce = true"
              rows="6"
              class="w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-hidden focus:ring-3 dark:bg-gray-800 dark:text-white"
              :class="submittedOnce && isDescriptionInvalid ? 'border-red-500 focus:ring-red-500/20 dark:border-red-600' : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'"
              placeholder="Write the job description..."
            />
            <p v-if="submittedOnce && isDescriptionInvalid" class="text-xs text-red-600 dark:text-red-500">Please enter a message in the textarea.</p>
          </div>

          <!-- Who + Start/End + Total Hours -->
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
        </div>
      </ComponentCard>

      <!-- Right: Table -->
      <ComponentCard title="Other Jobs" description="Recent records">
        <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Rows per page:</span>
              <select class="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-800" v-model.number="rowsPerPage" @change="onRowsPerPageChange">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
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
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Who</th>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Total Hours</th>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Status</th>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              <tr v-for="row in rows" :key="row._id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{{ formatDateOnly(row.when) }}</td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{{ row.who }}</td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{{ row.hours.toFixed(2) }}</td>
                <td class="px-6 py-4">
                  <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium" :class="statusBadgeClass(getStatus(row))">{{ getStatus(row) }}</span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm">
                  <div class="flex items-center gap-2">
                    <button @click="openView(row)" class="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200" title="View">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button @click="editRow(row)" class="rounded-lg p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-all duration-200" title="Edit">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button @click="openConfirmDelete(row)" class="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200" title="Delete">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!rows.length">
                <td colspan="6" class="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No records yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ComponentCard>
      <!-- Delete confirmation modal instance -->
      <ConfirmationModal
        v-if="isDeleteOpen"
        :isOpen="isDeleteOpen"
        title="Delete Other Job"
        message="Are you sure you want to delete this job? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
        @close="isDeleteOpen=false"
        @confirm="confirmDelete"
      />
      <ViewOtherJobModal :isOpen="isViewOpen" :item="viewTarget" @close="isViewOpen=false" />
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import dropdownService from '@/services/dropdownService'
import { useToast } from 'vue-toastification'
import ConfirmationModal from '@/components/ui/ConfirmationModal.vue'
import { listOtherJobs, createOtherJob, updateOtherJob, deleteOtherJob, type OtherJob, type OtherJobData } from '@/services/otherJobsService'
import ViewOtherJobModal from '@/components/operations/ViewOtherJobModal.vue'
import SingleSelect from '@/components/forms/FormElements/SingleSelect.vue'
import { useOtherJobsStore } from '@/stores/otherJobs'
import { useAutoSocket } from '@/composables/useSocket'

const toast = useToast()
const jobsStore = useOtherJobsStore()
const socket = useAutoSocket()

const jobDescription = ref('')
const submittedOnce = ref(false)
const isDescriptionInvalid = computed(() => !jobDescription.value.trim())
const whenDate = ref('')
const isWhenInvalid = computed(() => !whenDate.value)
const dateConfig = {
  enableTime: false,
  dateFormat: 'Y-m-d',
  altInput: true,
  altFormat: 'F j, Y',
  locale: { firstDayOfWeek: 1 },
}

// Who + time window
const samplerOptions = ref<string[]>([])
const whoSampler = ref('')
const whoStart = ref('')
const whoEnd = ref('')

// Sampler options formatted for SingleSelect
const samplerOptionsFormatted = computed(() => {
  return samplerOptions.value.map((name) => ({ value: name, label: name }))
})

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


const buildDateTime = (dateStr: string, timeStr: string) => {
  if (!dateStr || !timeStr) return null
  const [y, m, d] = dateStr.split('-').map((x) => parseInt(x))
  const [hh, mm] = timeStr.split(':').map((x) => parseInt(x))
  if (!y || !m || !d || (hh === undefined) || (mm === undefined)) return null
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

const whoHours = computed(() => {
  const start = buildDateTime(whenDate.value, whoStart.value)
  const end = buildDateTime(whenDate.value, whoEnd.value)
  if (!start || !end) return '0.00'
  const diff = end.getTime() - start.getTime()
  return diff > 0 ? (diff / 36e5).toFixed(2) : '0.00'
})

const isWhoInvalid = computed(() => !whoSampler.value)
const isStartInvalid = computed(() => !whoStart.value)
const isEndInvalid = computed(() => !whoEnd.value)

onMounted(async () => {
  const samplersResponse = await dropdownService.getSamplers(true)
  if (samplersResponse.success && samplersResponse.data) {
    samplerOptions.value = samplersResponse.data.map((s: { name: string }) => s.name)
  }
})

// Save/Reset
const isSubmitting = ref(false)

const validateBeforeSubmit = () => {
  submittedOnce.value = true
  if (isWhenInvalid.value || isDescriptionInvalid.value || isWhoInvalid.value || isStartInvalid.value || isEndInvalid.value) {
    toast.warning('Please complete required fields: When, Description, Who, Start, End')
    return false
  }
  return true
}

const resetForm = () => {
  whenDate.value = ''
  jobDescription.value = ''
  whoSampler.value = ''
  whoStart.value = ''
  whoEnd.value = ''
  submittedOnce.value = false
  isEditing.value = false
  editingId.value = ''
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  if (!validateBeforeSubmit()) { isSubmitting.value = false; return }
  try {
    const start = buildDateTime(whenDate.value, whoStart.value)
    const end = buildDateTime(whenDate.value, whoEnd.value)
    const payload: OtherJobData = {
      when: whenDate.value,
      description: jobDescription.value.trim(),
      who: whoSampler.value,
      startAt: start ? start.toISOString() : '',
      endAt: end ? end.toISOString() : '',
    }
    if (isEditing.value && editingId.value) {
      const res = await updateOtherJob(editingId.value, payload)
      if (!res.success) throw new Error(res.message || 'Update failed')
      toast.success('Other job updated')
    } else {
      const res = await createOtherJob(payload)
      if (!res.success) throw new Error(res.message || 'Create failed')
      toast.success('Other job saved')
    }
    await loadRows()
    resetForm()
  } catch {
    toast.error('Failed to save')
  } finally {
    isSubmitting.value = false
  }
}

// Tabla y helpers
type OtherJobRow = OtherJob
const rows = ref<OtherJobRow[]>([])
const currentPage = ref(1)
const rowsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)
const pageStart = computed(() => (totalItems.value === 0 ? 0 : (currentPage.value - 1) * rowsPerPage.value + 1))
const pageEnd = computed(() => Math.min(currentPage.value * rowsPerPage.value, totalItems.value))

const loadRows = async () => {
  const res = await listOtherJobs({ page: currentPage.value, limit: rowsPerPage.value, sortBy: 'when', sortOrder: 'desc' })
  if (res.success && res.data) {
    rows.value = res.data
    totalItems.value = res.total ?? res.count ?? 0
    totalPages.value = res.pages ?? Math.ceil((res.total ?? 0) / rowsPerPage.value)

    // Update store with fetched data
    jobsStore.setJobs(res.data.map(j => ({ ...j, status: (j.status || 'pending') as 'pending' | 'in-progress' | 'completed' })))
  }
}

const onRowsPerPageChange = () => { currentPage.value = 1; loadRows() }
const goToPrevPage = () => { if (currentPage.value > 1) { currentPage.value--; loadRows() } }
const goToNextPage = () => { if (currentPage.value < totalPages.value) { currentPage.value++; loadRows() } }

const formatDateOnly = (dateString: string) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getStatus = (row: OtherJobRow) => {
  // Use the status from the database if available
  if (row.status) return row.status

  // Fallback to calculating status (for backward compatibility)
  const now = new Date()
  const start = row.startAt ? new Date(row.startAt) : null
  const end = row.endAt ? new Date(row.endAt) : null
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

// Editar
const isEditing = ref(false)
const editingId = ref<string>('')
const editRow = (row: OtherJobRow) => {
  isEditing.value = true
  editingId.value = row._id
  whenDate.value = row.when ? new Date(row.when).toISOString().slice(0,10) : ''
  jobDescription.value = row.description
  whoSampler.value = row.who
  const toHm = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
  whoStart.value = toHm(row.startAt)
  whoEnd.value = toHm(row.endAt)
  submittedOnce.value = false
}

// Delete con confirmación
const isDeleteOpen = ref(false)
const deleteTarget = ref<OtherJobRow | null>(null)
const openConfirmDelete = (row: OtherJobRow) => { deleteTarget.value = row; isDeleteOpen.value = true }
const confirmDelete = async () => {
  if (!deleteTarget.value) { isDeleteOpen.value = false; return }
  const res = await deleteOtherJob(deleteTarget.value._id)
  if (res.success) {
    toast.success('Other job deleted')
    await loadRows()
  } else {
    toast.error(res.message || 'Failed to delete')
  }
  isDeleteOpen.value = false
  deleteTarget.value = null
}

onMounted(async () => {
  await loadRows()

  // WebSocket event listeners (notifications handled centrally in useSocketNotifications)
  socket.on('other-job:created', (job: OtherJob) => {
    // Store is already updated by central notification handler
    // Add to current view if on first page
    if (currentPage.value === 1) {
      rows.value.unshift(job)
      if (rows.value.length > rowsPerPage.value) {
        rows.value.pop()
      }
      totalItems.value++
    }
  })

  socket.on('other-job:updated', (job: OtherJob) => {
    // Store is already updated by central notification handler
    const index = rows.value.findIndex(row => row._id === job._id)
    if (index !== -1) {
      rows.value[index] = job
    }
  })

  socket.on('other-job:deleted', (data: { id: string }) => {
    // Store is already updated by central notification handler
    const index = rows.value.findIndex(row => row._id === data.id)
    if (index !== -1) {
      rows.value.splice(index, 1)
      totalItems.value--
    }
  })
})

onUnmounted(() => {
  // Cleanup WebSocket listeners
  socket.off('other-job:created')
  socket.off('other-job:updated')
  socket.off('other-job:deleted')
})

// View modal
const isViewOpen = ref(false)
const viewTarget = ref<OtherJobRow | null>(null)
const openView = (row: OtherJobRow) => { viewTarget.value = row; isViewOpen.value = true }

const cancelEdit = () => {
  resetForm()
}
</script>
