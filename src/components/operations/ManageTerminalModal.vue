<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="handleClose">
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
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl transform transition-all"
            >
              <!-- Modal Header -->
              <div
                class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gradient-to-r from-brand-50 to-white dark:from-gray-800 dark:to-gray-800"
              >
                <DialogTitle class="text-xl font-semibold text-gray-900 dark:text-white">
                  Manage Terminals & Berths
                </DialogTitle>
                <button
                  @click="handleClose"
                  class="rounded-lg p-2 text-gray-400 hover:bg-white/50 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white transition-all duration-200"
                >
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <!-- Add New Terminal Form -->
              <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                <form @submit.prevent="handleAdd" class="space-y-3">
                  <div class="flex gap-3">
                    <input
                      v-model="newTerminal.name"
                      type="text"
                      placeholder="Enter new terminal name"
                      class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-brand-800 transition-all duration-200"
                      required
                    />
                    <button
                      type="submit"
                      :disabled="isAdding || !newTerminal.name.trim()"
                      class="rounded-lg bg-brand-500 px-6 py-2.5 text-white font-medium hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <span v-if="isAdding">Adding...</span>
                      <span v-else>Add Terminal</span>
                    </button>
                  </div>

                  <!-- Line Sampling Toggle and Berths selector for new terminal -->
                  <div v-if="newTerminal.name.trim()" class="space-y-3">
                    <!-- Line Sampling Toggle -->
                    <div class="flex items-center gap-3">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Requires Line Sampling:</label>
                      <button
                        type="button"
                        @click="newTerminal.requiresLineSampling = !newTerminal.requiresLineSampling"
                        :class="newTerminal.requiresLineSampling ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'"
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                      >
                        <span
                          :class="newTerminal.requiresLineSampling ? 'translate-x-6' : 'translate-x-1'"
                          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        />
                      </button>
                      <span class="text-sm text-gray-600 dark:text-gray-400">
                        {{ newTerminal.requiresLineSampling ? 'Yes' : 'No' }}
                      </span>
                    </div>

                    <!-- Berths selector -->
                    <div class="flex flex-wrap gap-2 items-center">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Berths:</label>
                      <div class="flex flex-wrap gap-2">
                        <label
                          v-for="berth in availableBerths"
                          :key="berth._id"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer"
                          :class="newTerminal.berths.includes(berth.name)
                            ? 'bg-brand-500 border-brand-500 text-white'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-brand-500'"
                        >
                          <input
                            type="checkbox"
                            :value="berth.name"
                            v-model="newTerminal.berths"
                            class="hidden"
                          />
                          <span class="text-sm font-medium">{{ berth.name }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Terminals List -->
              <div class="max-h-[500px] overflow-y-auto px-6 py-4">
                <div v-if="isLoading" class="text-center py-12">
                  <div
                    class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"
                  ></div>
                  <p class="mt-3 text-gray-500 dark:text-gray-400 font-medium">Loading...</p>
                </div>

                <div v-else-if="terminals.length === 0" class="text-center py-12">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  <p class="mt-3 text-gray-500 dark:text-gray-400 font-medium">
                    No terminals found
                  </p>
                  <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
                    Get started by adding one above
                  </p>
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="terminal in terminals"
                    :key="terminal._id"
                    class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-200"
                  >
                    <!-- Terminal Header -->
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex-1 min-w-0">
                        <input
                          v-if="editingId === terminal._id"
                          v-model="editingName"
                          type="text"
                          class="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-brand-800 transition-all duration-200"
                          @keyup.enter="handleUpdate(terminal._id)"
                          @keyup.esc="cancelEdit"
                        />
                        <div v-else class="flex items-center gap-2">
                          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ terminal.name }}</h3>
                          <span
                            v-if="!terminal.isActive"
                            class="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-medium"
                          >
                            Inactive
                          </span>
                        </div>
                      </div>

                      <div class="flex items-center gap-1 ml-4">
                        <!-- Edit Mode Buttons -->
                        <template v-if="editingId === terminal._id">
                          <button
                            @click="handleUpdate(terminal._id)"
                            :disabled="isUpdating"
                            class="rounded-lg px-3 py-1.5 text-sm bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-all duration-200 font-medium shadow-sm hover:shadow"
                          >
                            Save
                          </button>
                          <button
                            @click="cancelEdit"
                            class="rounded-lg px-3 py-1.5 text-sm bg-gray-500 text-white hover:bg-gray-600 transition-all duration-200 font-medium shadow-sm hover:shadow"
                          >
                            Cancel
                          </button>
                        </template>

                        <!-- Normal Mode Buttons -->
                        <template v-else>
                          <button
                            @click="startEdit(terminal)"
                            class="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200"
                            title="Edit"
                          >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            @click="handleDelete(terminal._id)"
                            :disabled="isDeletingId === terminal._id"
                            class="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50"
                            title="Delete"
                          >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </template>
                      </div>
                    </div>

                    <!-- Line Sampling Toggle and Berths Selection -->
                    <div class="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
                      <!-- Line Sampling Toggle -->
                      <div class="flex items-center gap-3">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Requires Line Sampling:</label>
                        <button
                          type="button"
                          @click="toggleLineSampling(terminal)"
                          :class="terminal.requiresLineSampling ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'"
                          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        >
                          <span
                            :class="terminal.requiresLineSampling ? 'translate-x-6' : 'translate-x-1'"
                            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                          />
                        </button>
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                          {{ terminal.requiresLineSampling ? 'Yes' : 'No' }}
                        </span>
                      </div>

                      <!-- Associated Berths -->
                      <div>
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Associated Berths:
                        </label>
                      <div class="flex flex-wrap gap-2">
                        <label
                          v-for="berth in availableBerths"
                          :key="berth._id"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer"
                          :class="terminal.berths?.includes(berth.name)
                            ? 'bg-brand-500 border-brand-500 text-white'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-brand-500'"
                        >
                          <input
                            type="checkbox"
                            :value="berth.name"
                            :checked="terminal.berths?.includes(berth.name)"
                            @change="toggleBerth(terminal, berth.name)"
                            class="hidden"
                          />
                          <span class="text-sm font-medium">{{ berth.name }}</span>
                        </label>
                        <span v-if="!availableBerths.length" class="text-sm text-gray-500 dark:text-gray-400 italic">
                          No berths available. Please add berths first.
                        </span>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                <button
                  @click="handleClose"
                  class="w-full rounded-lg bg-gray-200 px-4 py-2.5 text-gray-900 font-medium hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-all duration-200"
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
import { ref, watch, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import dropdownService from '@/services/dropdownService'
import { useToast } from 'vue-toastification'

interface Terminal {
  _id: string
  name: string
  berths: string[]
  requiresLineSampling: boolean
  isActive: boolean
}

interface Berth {
  _id: string
  name: string
  isActive: boolean
}

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const toast = useToast()

// State
const terminals = ref<Terminal[]>([])
const availableBerths = ref<Berth[]>([])
const isLoading = ref(false)
const isAdding = ref(false)
const isUpdating = ref(false)
const isDeletingId = ref<string | null>(null)
const editingId = ref<string | null>(null)
const editingName = ref('')
const editingBerths = ref<string[]>([])

const newTerminal = ref({
  name: '',
  berths: [] as string[],
  requiresLineSampling: false,
})

// Load data
const loadTerminals = async () => {
  isLoading.value = true
  try {
    const response = await dropdownService.getTerminals()
    if (response.success && response.data) {
      // Transform DropdownItem[] to Terminal[] by adding missing properties
      terminals.value = response.data.map((item) => ({
        _id: item._id,
        name: item.name,
        berths: (item as any).berths || [],
        requiresLineSampling: (item as any).requiresLineSampling || false,
        isActive: (item as any).isActive !== undefined ? (item as any).isActive : true,
      }))
    }
  } catch (error) {
    console.error('Error loading terminals:', error)
    toast.error('Failed to load terminals')
  } finally {
    isLoading.value = false
  }
}

const loadBerths = async () => {
  try {
    const response = await dropdownService.getBerths()
    if (response.success && response.data) {
      availableBerths.value = response.data.filter((b) => b.isActive)
    }
  } catch (error) {
    console.error('Error loading berths:', error)
  }
}

// Add new terminal
const handleAdd = async () => {
  if (!newTerminal.value.name.trim()) return

  isAdding.value = true
  try {
    const response = await dropdownService.createTerminal({
      name: newTerminal.value.name.trim(),
      berths: newTerminal.value.berths,
      requiresLineSampling: newTerminal.value.requiresLineSampling,
    })

    if (response.success) {
      toast.success('Terminal added successfully')
      newTerminal.value = { name: '', berths: [], requiresLineSampling: false }
      await loadTerminals()
      emit('updated')
    } else {
      toast.error(response.message || 'Failed to add terminal')
    }
  } catch (error: any) {
    console.error('Error adding terminal:', error)
    toast.error(error.response?.data?.message || 'Failed to add terminal')
  } finally {
    isAdding.value = false
  }
}

// Start editing
const startEdit = (terminal: Terminal) => {
  editingId.value = terminal._id
  editingName.value = terminal.name
  editingBerths.value = [...(terminal.berths || [])]
}

// Cancel editing
const cancelEdit = () => {
  editingId.value = null
  editingName.value = ''
  editingBerths.value = []
}

// Update terminal
const handleUpdate = async (id: string) => {
  if (!editingName.value.trim()) return

  isUpdating.value = true
  try {
    const terminal = terminals.value.find((t) => t._id === id)
    const response = await dropdownService.updateTerminal(id, {
      name: editingName.value.trim(),
      berths: terminal?.berths || [],
    })

    if (response.success) {
      toast.success('Terminal updated successfully')
      await loadTerminals()
      cancelEdit()
      emit('updated')
    } else {
      toast.error(response.message || 'Failed to update terminal')
    }
  } catch (error: any) {
    console.error('Error updating terminal:', error)
    toast.error(error.response?.data?.message || 'Failed to update terminal')
  } finally {
    isUpdating.value = false
  }
}

// Toggle berth association
const toggleBerth = async (terminal: Terminal, berthName: string) => {
  try {
    // Save current scroll position
    const scrollContainer = document.querySelector('.max-h-\\[500px\\]')
    const scrollPosition = scrollContainer?.scrollTop || 0

    const currentBerths = terminal.berths || []
    const newBerths = currentBerths.includes(berthName)
      ? currentBerths.filter((b) => b !== berthName)
      : [...currentBerths, berthName]

    const response = await dropdownService.updateTerminal(terminal._id, {
      name: terminal.name,
      berths: newBerths,
      requiresLineSampling: terminal.requiresLineSampling,
    })

    if (response.success) {
      await loadTerminals()
      emit('updated')

      // Restore scroll position after DOM update
      setTimeout(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollPosition
        }
      }, 0)
    } else {
      toast.error(response.message || 'Failed to update berths')
    }
  } catch (error) {
    console.error('Error toggling berth:', error)
    toast.error('Failed to update berths')
  }
}

// Toggle line sampling requirement
const toggleLineSampling = async (terminal: Terminal) => {
  try {
    // Save current scroll position
    const scrollContainer = document.querySelector('.max-h-\\[500px\\]')
    const scrollPosition = scrollContainer?.scrollTop || 0

    const response = await dropdownService.updateTerminal(terminal._id, {
      name: terminal.name,
      berths: terminal.berths,
      requiresLineSampling: !terminal.requiresLineSampling,
    })

    if (response.success) {
      await loadTerminals()
      emit('updated')

      // Restore scroll position after DOM update
      setTimeout(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollPosition
        }
      }, 0)
    } else {
      toast.error(response.message || 'Failed to update line sampling requirement')
    }
  } catch (error) {
    console.error('Error toggling line sampling:', error)
    toast.error('Failed to update line sampling requirement')
  }
}

// Delete terminal
const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this terminal?')) return

  isDeletingId.value = id
  try {
    const response = await dropdownService.deleteTerminal(id)

    if (response.success) {
      toast.success('Terminal deleted successfully')
      await loadTerminals()
      emit('updated')
    } else {
      toast.error(response.message || 'Failed to delete terminal')
    }
  } catch (error: any) {
    console.error('Error deleting terminal:', error)
    toast.error(error.response?.data?.message || 'Failed to delete terminal')
  } finally {
    isDeletingId.value = null
  }
}

// Handle close
const handleClose = () => {
  emit('close')
}

// Watch modal open
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      loadTerminals()
      loadBerths()
    } else {
      cancelEdit()
      newTerminal.value = { name: '', berths: [], requiresLineSampling: false }
    }
  }
)

// Load on mount
onMounted(() => {
  if (props.isOpen) {
    loadTerminals()
    loadBerths()
  }
})
</script>

<style scoped>
/* List transition animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
