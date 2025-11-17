<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span class="mr-3 overflow-hidden rounded-full h-11 w-11 bg-brand-500 flex items-center justify-center flex-shrink-0">
        <img
          v-if="currentUser?.avatar"
          :src="currentUser.avatar"
          alt="User Avatar"
          class="w-full h-full object-cover"
        />
        <span v-else-if="currentUser" class="text-white text-sm font-semibold">
          {{ getUserInitials(currentUser.name) }}
        </span>
        <span v-else class="text-white text-sm font-semibold">U</span>
      </span>

      <span class="block mr-1 font-medium text-theme-sm">
        {{ currentUser?.name || 'Usuario' }}
      </span>

      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <!-- Dropdown Start -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark z-50"
    >
      <div>
        <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
          {{ currentUser?.name || 'Usuario' }}
        </span>
        <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
          {{ currentUser?.email || 'No email' }}
        </span>
      </div>

      <ul class="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <li v-for="item in menuItems" :key="item.href">
          <router-link
            :to="item.href"
            @click="closeDropdown"
            class="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <component
              :is="item.icon"
              class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
            />
            {{ item.text }}
          </router-link>
        </li>
      </ul>
      <button
        @click="handleLogout"
        class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 w-full text-left"
      >
        <LogoutIcon
          class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        />
        Sign out
      </button>
    </div>
    <!-- Dropdown End -->
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon, LogoutIcon, SettingsIcon, UserCircleIcon } from '@/icons'
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import authService from '@/services/authService'

const router = useRouter()
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// Usar el ref directamente para reactividad completa
const currentUser = authService.getCurrentUserRef()

// Get user initials from name
const getUserInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'U';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'U';
  
  if (parts.length === 1) {
    // Only one name, return first two letters
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  // First name and first letter of last name
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
};

const menuItems = [
  { href: '/profile', icon: UserCircleIcon, text: 'Edit profile' },
  { href: '/account-settings', icon: SettingsIcon, text: 'Account settings' },
]

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const handleLogout = async () => {
  try {
    await authService.logout()
    closeDropdown()
    router.push('/signin')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    // Limpiar localstorage de todas formas
    authService.clearAuth()
    router.push('/signin')
  }
}

const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
