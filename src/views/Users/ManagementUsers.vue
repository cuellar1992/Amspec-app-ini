<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Management Users">
        <div class="mb-4 flex justify-end">
          <button
            @click="showAddModal = true"
            class="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-white font-medium hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add User
          </button>
        </div>
        <UsersManagementTable
          :refresh-trigger="refreshTrigger"
          ref="tableRef"
          @edit="handleEdit"
          @toggle-status="handleToggleStatus"
          @delete="handleDelete"
        />
      </ComponentCard>
    </div>

    <!-- Add User Modal -->
    <AddUserModal
      :is-open="showAddModal"
      @close="showAddModal = false"
      @created="handleUserCreated"
    />

    <!-- Edit User Modal -->
    <EditUserModal
      :is-open="showEditModal"
      :editing-user="editingUser"
      @close="showEditModal = false"
      @updated="handleUserUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <TransitionRoot :show="showDeleteModal" as="template">
      <Dialog as="div" class="relative z-50" @close="showDeleteModal = false">
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
                class="w-full max-w-md overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl transform transition-all"
              >
                <div class="px-6 py-4">
                  <DialogTitle class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Delete User
                  </DialogTitle>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Are you sure you want to delete the user "{{ userToDelete?.name }}"? This action cannot be undone.
                  </p>
                  <div class="flex justify-end gap-3">
                    <button
                      @click="showDeleteModal = false"
                      class="rounded-lg bg-gray-200 px-4 py-2 text-gray-900 font-medium hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      @click="confirmDelete"
                      :disabled="isDeleting"
                      class="rounded-lg bg-red-500 px-4 py-2 text-white font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <span v-if="isDeleting" class="flex items-center gap-2">
                        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </span>
                      <span v-else>Delete</span>
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from '@headlessui/vue'
import PageBreadcrumb from "@/components/common/PageBreadcrumb.vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import ComponentCard from "@/components/common/ComponentCard.vue";
import UsersManagementTable from "@/components/tables/users/UsersManagementTable.vue";
import AddUserModal from "@/components/users/AddUserModal.vue";
import EditUserModal from "@/components/users/EditUserModal.vue";
import userService from "@/services/userService";
import type { User } from "@/services/userService";
import { useToast } from 'vue-toastification';

const currentPageTitle = ref("Management Users");
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const editingUser = ref<User | null>(null);
const userToDelete = ref<User | null>(null);
const isDeleting = ref(false);
const refreshTrigger = ref(0);
const tableRef = ref<{ refresh?: () => void } | null>(null);

const toast = useToast();

const handleUserCreated = () => {
  refreshTrigger.value += 1;
  if (tableRef.value && tableRef.value.refresh) {
    tableRef.value.refresh();
  }
};

const handleEdit = (user: User) => {
  editingUser.value = user;
  showEditModal.value = true;
};

const handleUserUpdated = () => {
  refreshTrigger.value += 1;
  if (tableRef.value && tableRef.value.refresh) {
    tableRef.value.refresh();
  }
};

const handleToggleStatus = async (user: User) => {
  try {
    await userService.toggleUserStatus(user._id, !user.isActive);
    toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`);
    refreshTrigger.value += 1;
    if (tableRef.value && tableRef.value.refresh) {
      tableRef.value.refresh();
    }
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    toast.error(error.message || 'Failed to update user status');
  }
};

const handleDelete = (user: User) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!userToDelete.value) return;

  isDeleting.value = true;
  try {
    await userService.deleteUser(userToDelete.value._id);
    toast.success('User deleted successfully');
    showDeleteModal.value = false;
    userToDelete.value = null;
    refreshTrigger.value += 1;
    if (tableRef.value && tableRef.value.refresh) {
      tableRef.value.refresh();
    }
  } catch (error: any) {
    console.error('Error deleting user:', error);
    toast.error(error.message || 'Failed to delete user');
  } finally {
    isDeleting.value = false;
  }
};
</script>

