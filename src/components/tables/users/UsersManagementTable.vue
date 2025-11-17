<template>
  <div
    class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
  >
    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="px-5 py-3 text-left w-3/11 sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">User</p>
            </th>
            <th class="px-5 py-3 text-left w-2/11 sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Role</p>
            </th>
            <th class="px-5 py-3 text-left w-2/11 sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Status</p>
            </th>
            <th class="px-5 py-3 text-left w-2/11 sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Last Login</p>
            </th>
            <th class="px-5 py-3 text-left w-1/11 sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Actions</p>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="isLoading">
            <td colspan="5" class="px-5 py-8 text-center">
              <div class="flex items-center justify-center">
                <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
                <span class="ml-3 text-gray-500 dark:text-gray-400">Loading users...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="users.length === 0">
            <td colspan="5" class="px-5 py-8 text-center">
              <p class="text-gray-500 dark:text-gray-400">No users found</p>
            </td>
          </tr>
          <tr
            v-else
            v-for="user in users"
            :key="user._id"
            class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <td class="px-5 py-4 sm:px-6">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    v-if="user.avatar"
                    :src="user.avatar"
                    :alt="user.name"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-white text-sm font-semibold">
                    {{ getUserInitials(user.name) }}
                  </span>
                </div>
                <div>
                  <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ user.name || user.email }}
                  </span>
                  <span class="block text-gray-500 text-theme-xs dark:text-gray-400">
                    {{ user.email }}
                  </span>
                </div>
              </div>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <span
                :class="[
                  'rounded-full px-2 py-0.5 text-theme-xs font-medium',
                  {
                    'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-500':
                      user.role === 'admin',
                    'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-500':
                      user.role === 'viewer',
                    'bg-gray-50 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400':
                      user.role === 'user',
                  },
                ]"
              >
                {{ getRoleDisplay(user.role) }}
              </span>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <span
                :class="[
                  'rounded-full px-2 py-0.5 text-theme-xs font-medium',
                  {
                    'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500':
                      getUserStatus(user) === 'Active',
                    'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500':
                      getUserStatus(user) === 'Inactive',
                  },
                ]"
              >
                {{ getUserStatus(user) }}
              </span>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ formatLastLogin(user.lastLogin) }}</p>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <div v-if="isCurrentUser(user)" class="flex items-center">
                <span class="text-xs text-gray-500 dark:text-gray-400 italic">Your account</span>
              </div>
              <div v-else class="flex items-center gap-2">
                <button
                  @click="$emit('edit', user)"
                  class="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-all"
                  title="Edit user"
                >
                  <Edit class="h-4 w-4" />
                </button>
                <button
                  @click="$emit('toggleStatus', user)"
                  :class="[
                    'rounded-lg p-1.5 transition-all',
                    user.isActive
                      ? 'text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20'
                      : 'text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
                  ]"
                  :title="user.isActive ? 'Deactivate user' : 'Activate user'"
                >
                  <UserMinus v-if="user.isActive" class="h-4 w-4" />
                  <UserPlus v-else class="h-4 w-4" />
                </button>
                <button
                  @click="$emit('delete', user)"
                  class="rounded-lg p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 transition-all"
                  title="Delete user"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { Edit, Trash2, UserMinus, UserPlus } from 'lucide-vue-next'
import userService from '@/services/userService'
import type { User } from '@/services/userService'
import authService from '@/services/authService'

defineEmits<{
  edit: [user: User]
  toggleStatus: [user: User]
  delete: [user: User]
}>()

const props = defineProps<{
  refreshTrigger?: number
}>()

const users = ref<User[]>([])
const isLoading = ref(false)

// Get current logged-in user
const currentUser = computed(() => authService.getCurrentUser())

// Check if user is the current logged-in user
const isCurrentUser = (user: User) => {
  return currentUser.value?._id === user._id
}

// Format last login date
const formatLastLogin = (lastLogin?: string) => {
  if (!lastLogin) return 'Never'
  
  const date = new Date(lastLogin)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `${diffMins} minutes ago`
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Get user initials from name
const getUserInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'U'
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return 'U'
  
  if (parts.length === 1) {
    // Only one name, return first two letters
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  // First name and first letter of last name
  const firstName = parts[0]
  const lastName = parts[parts.length - 1]
  
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
}

// Get status from user
const getUserStatus = (user: User) => {
  return user.isActive ? 'Active' : 'Inactive'
}

// Map role to display format
const getRoleDisplay = (role: string) => {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

const loadUsers = async () => {
  isLoading.value = true
  try {
    const usersData = await userService.getAllUsers()
    users.value = usersData || []
  } catch (error: any) {
    console.error('Error loading users:', error)
    users.value = []
  } finally {
    isLoading.value = false
  }
}

// Watch for refresh trigger
watch(() => props.refreshTrigger, () => {
  if (props.refreshTrigger) {
    loadUsers()
  }
})

onMounted(() => {
  loadUsers()
})

// Expose refresh method
defineExpose({
  refresh: loadUsers
})
</script>

<style scoped>
/* Add any additional styles here if needed */
</style>

