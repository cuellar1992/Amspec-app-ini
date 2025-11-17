<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="handleClose">
      <!-- Backdrop with smooth fade -->
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
          <!-- Modal Panel with smooth scale animation -->
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
              class="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl transform transition-all"
            >
              <!-- Modal Header -->
              <div
                class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gradient-to-r from-brand-50 to-white dark:from-gray-800 dark:to-gray-800"
              >
                <DialogTitle class="text-xl font-semibold text-gray-900 dark:text-white">
                  Manage {{ title }}
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

              <!-- Add New Item Form -->
              <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                <form @submit.prevent="handleAdd">
                  <div :class="needsEmailField ? 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' : 'flex gap-3'">
                    <!-- Name Field -->
                    <div :class="needsEmailField ? '' : 'flex-1'">
                      <label v-if="needsEmailField" class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Name <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="newItemName"
                        type="text"
                        :placeholder="`Enter new ${singularTitle.toLowerCase()}`"
                        class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-brand-800 transition-all duration-200"
                        required
                      />
                    </div>

                    <!-- Email Field (only for chemists and surveyors) -->
                    <div v-if="needsEmailField">
                      <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Email
                      </label>
                      <input
                        v-model="newItemEmail"
                        type="email"
                        placeholder="email@amspec.com"
                        class="w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-3 transition-all duration-200 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                        :class="newItemEmail && !isValidEmail(newItemEmail) ? 'border-red-500 focus:ring-red-500/20 dark:border-red-600' : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'"
                      />
                      <p v-if="newItemEmail && !isValidEmail(newItemEmail)" class="mt-1 text-xs text-red-600 dark:text-red-400">Enter a valid email address</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    :disabled="!!(isAdding || !newItemName.trim() || (newItemEmail && !isValidEmail(newItemEmail)))"
                    class="w-full rounded-lg bg-brand-500 px-6 py-2.5 text-white font-medium hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <span v-if="isAdding" class="flex items-center justify-center gap-2">
                      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </span>
                    <span v-else>Add</span>
                  </button>
                </form>
              </div>

              <!-- Items List -->
              <div class="max-h-[500px] overflow-y-auto px-6 py-4">
                <div v-if="isLoading" class="text-center py-12">
                  <div
                    class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"
                  ></div>
                  <p class="mt-3 text-gray-500 dark:text-gray-400 font-medium">Loading...</p>
                </div>

                <div v-else-if="items.length === 0" class="text-center py-12">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                  </svg>
                  <p class="mt-3 text-gray-500 dark:text-gray-400 font-medium">
                    No {{ title.toLowerCase() }} found
                  </p>
                  <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
                    Get started by adding one above
                  </p>
                </div>

                <TransitionGroup
                  v-else
                  name="list"
                  tag="div"
                  class="space-y-2"
                >
                  <div
                    v-for="item in items"
                    :key="item._id"
                    class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-200 hover:shadow-md group"
                  >
                    <div class="flex-1 min-w-0">
                      <template v-if="editingId === item._id">
                        <div v-if="needsEmailField" class="space-y-2">
                          <input
                            v-model="editingName"
                            type="text"
                            placeholder="Name"
                            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-brand-800 transition-all duration-200"
                            @keyup.enter="handleUpdate(item._id)"
                            @keyup.esc="cancelEdit"
                          />
                          <input
                            v-model="editingEmail"
                            type="email"
                            placeholder="Email (optional)"
                            class="w-full rounded-lg border bg-white px-3 py-1.5 text-gray-900 focus:outline-hidden focus:ring-3 transition-all duration-200 dark:bg-gray-900 dark:text-white"
                            :class="editingEmail && !isValidEmail(editingEmail) ? 'border-red-500 focus:ring-red-500/20 dark:border-red-600' : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-600 dark:focus:border-brand-800'"
                            @keyup.enter="handleUpdate(item._id)"
                            @keyup.esc="cancelEdit"
                          />
                          <p v-if="editingEmail && !isValidEmail(editingEmail)" class="text-xs text-red-600 dark:text-red-400">Enter a valid email address</p>
                        </div>
                        <input
                          v-else
                          v-model="editingName"
                          type="text"
                          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-brand-800 transition-all duration-200"
                          @keyup.enter="handleUpdate(item._id)"
                          @keyup.esc="cancelEdit"
                        />
                      </template>
                      <div v-else class="flex flex-col gap-1">
                        <div class="flex items-center gap-2">
                          <span class="text-gray-900 dark:text-white font-medium">{{ item.name }}</span>
                          <span
                            v-if="!item.isActive"
                            class="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-medium"
                          >
                            Inactive
                          </span>
                        </div>
                        <div v-if="needsEmailField && item.email" class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          {{ item.email }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-1 ml-4">
                      <!-- Edit Mode Buttons -->
                      <template v-if="editingId === item._id">
                        <button
                          @click="handleUpdate(item._id)"
                          :disabled="!!(isUpdating || (editingEmail && !isValidEmail(editingEmail)))"
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

                      <!-- Action Buttons -->
                      <template v-else>
                        <!-- Edit Button -->
                        <button
                          @click="startEdit(item)"
                          class="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200"
                          title="Edit"
                        >
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        <!-- Toggle Active Button -->
                        <button
                          @click="handleToggleActive(item._id, item.isActive)"
                          :disabled="isDeletingId === item._id"
                          class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                          :class="item.isActive ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'"
                          :title="item.isActive ? 'Deactivate' : 'Activate'"
                        >
                          <svg
                            v-if="isDeletingId === item._id"
                            class="h-4 w-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              class="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              stroke-width="4"
                            ></circle>
                            <path
                              class="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              v-if="item.isActive"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            />
                            <path
                              v-else
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>

                        <!-- Permanent Delete Button -->
                        <button
                          @click="handlePermanentDelete(item._id, item.name)"
                          :disabled="isPermanentDeletingId === item._id"
                          class="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
                          title="Delete Permanently"
                        >
                          <svg
                            v-if="isPermanentDeletingId === item._id"
                            class="h-4 w-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              class="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              stroke-width="4"
                            ></circle>
                            <path
                              class="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </template>
                    </div>
                  </div>
                </TransitionGroup>
              </div>

              <!-- Modal Footer -->
              <div
                class="flex justify-end border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50"
              >
                <button
                  @click="handleClose"
                  class="rounded-lg bg-gray-200 px-5 py-2.5 text-gray-900 font-medium hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow"
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

  <!-- Confirmation Modal -->
  <ConfirmationModal
    :isOpen="showConfirmModal"
    :title="confirmModalTitle"
    :message="confirmModalMessage"
    variant="danger"
    confirmText="Yes, delete"
    @confirm="executePermanentDelete"
    @close="showConfirmModal = false"
  />

</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from '@headlessui/vue'
import dropdownService, { type DropdownItem } from '@/services/dropdownService'
import ConfirmationModal from '@/components/ui/ConfirmationModal.vue'
import { useToast } from 'vue-toastification'

interface Props {
  isOpen: boolean
  type: string // 'agents', 'berths', 'chemists', etc.
  title: string // Display title like 'Agents', 'Berths'
  singularTitle: string // Singular form like 'Agent', 'Berth'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

// Initialize toast
const toast = useToast()

// Component state
const items = ref<DropdownItem[]>([])
const isLoading = ref(false)
const newItemName = ref('')
const newItemEmail = ref('')
const isAdding = ref(false)
const editingId = ref<string | null>(null)
const editingName = ref('')
const editingEmail = ref('')
const isUpdating = ref(false)
const isDeletingId = ref<string | null>(null)
const isPermanentDeletingId = ref<string | null>(null)

// Check if this dropdown type needs email field
const needsEmailField = computed(() => {
  return props.type === 'chemists' || props.type === 'surveyors'
})

// Email validation
const isValidEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Confirmation modal state
const showConfirmModal = ref(false)
const confirmModalTitle = ref('')
const confirmModalMessage = ref('')
const pendingDeleteData = ref<{ id: string; name: string } | null>(null)

// Load items when modal opens
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      await loadItems()
    }
  }
)

// Load items from API
const loadItems = async () => {
  isLoading.value = true
  try {
    const response = await dropdownService.getAll(props.type, true) // Include inactive
    if (response.success && response.data) {
      items.value = response.data
    }
  } catch (error) {
    console.error(`Error loading ${props.type}:`, error)
  } finally {
    isLoading.value = false
  }
}

// Show toast notifications using vue-toastification
const showSuccessToast = (title: string, message: string) => {
  toast.success(`${title}: ${message}`)
}

const showErrorToast = (title: string, message: string) => {
  toast.error(`${title}: ${message}`)
}

// Add new item
const handleAdd = async () => {
  if (!newItemName.value.trim()) return
  if (newItemEmail.value && !isValidEmail(newItemEmail.value)) return

  isAdding.value = true
  try {
    const emailData = needsEmailField.value && newItemEmail.value.trim() 
      ? { email: newItemEmail.value.trim() } 
      : undefined
    const response = await dropdownService.create(props.type, newItemName.value.trim(), emailData)
    if (response.success) {
      newItemName.value = ''
      newItemEmail.value = ''
      await loadItems()
      emit('updated')
      showSuccessToast('Success', 'Item added successfully')
    } else {
      showErrorToast('Error', response.message || 'Error adding item')
    }
  } catch (error) {
    console.error('Error adding item:', error)
    showErrorToast('Error', 'Failed to add item')
  } finally {
    isAdding.value = false
  }
}

// Start editing
const startEdit = (item: DropdownItem) => {
  editingId.value = item._id
  editingName.value = item.name
  editingEmail.value = item.email || ''
}

// Cancel editing
const cancelEdit = () => {
  editingId.value = null
  editingName.value = ''
  editingEmail.value = ''
}

// Update item
const handleUpdate = async (id: string) => {
  if (!editingName.value.trim()) return
  if (editingEmail.value && !isValidEmail(editingEmail.value)) return

  isUpdating.value = true
  try {
    const updateData: { name: string; email?: string } = {
      name: editingName.value.trim(),
    }
    
    if (needsEmailField.value) {
      updateData.email = editingEmail.value.trim() || undefined
    }
    
    const response = await dropdownService.update(props.type, id, updateData)
    if (response.success) {
      cancelEdit()
      await loadItems()
      emit('updated')
      showSuccessToast('Success', 'Item updated successfully')
    } else {
      showErrorToast('Error', response.message || 'Error updating item')
    }
  } catch (error) {
    console.error('Error updating item:', error)
    showErrorToast('Error', 'Failed to update item')
  } finally {
    isUpdating.value = false
  }
}

// Toggle active status (soft delete/restore)
const handleToggleActive = async (id: string, currentStatus: boolean) => {
  isDeletingId.value = id
  try {
    const response = await dropdownService.update(props.type, id, {
      isActive: !currentStatus,
    })
    if (response.success) {
      await loadItems()
      emit('updated')
      const action = currentStatus ? 'deactivated' : 'activated'
      showSuccessToast('Success', `Item ${action} successfully`)
    } else {
      showErrorToast('Error', response.message || 'Error updating status')
    }
  } catch (error) {
    console.error('Error toggling status:', error)
    showErrorToast('Error', 'Failed to update status')
  } finally {
    isDeletingId.value = null
  }
}

// Permanent delete (hard delete)
const handlePermanentDelete = async (id: string, name: string) => {
  // Store pending delete data
  pendingDeleteData.value = { id, name }
  
  // Show confirmation modal
  confirmModalTitle.value = 'Permanent Delete'
  confirmModalMessage.value = `Are you sure you want to permanently delete "${name}"?\n\nThis action cannot be undone and will remove the item from the database.`
  showConfirmModal.value = true
}

// Execute the permanent delete after confirmation
const executePermanentDelete = async () => {
  if (!pendingDeleteData.value) return

  const { id, name } = pendingDeleteData.value
  isPermanentDeletingId.value = id

  try {
    const response = await dropdownService.permanentDelete(props.type, id)
    if (response.success) {
      await loadItems()
      emit('updated')
      showSuccessToast('Deleted', `"${name}" has been permanently deleted from the database`)
    } else {
      showErrorToast('Error', response.message || 'Error deleting item')
    }
  } catch (error) {
    console.error('Error permanently deleting item:', error)
    showErrorToast('Error', 'Failed to permanently delete item')
  } finally {
    isPermanentDeletingId.value = null
    pendingDeleteData.value = null
  }
}

// Close modal
const handleClose = () => {
  cancelEdit()
  emit('close')
}
</script>

<style scoped>
/* List transition animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
