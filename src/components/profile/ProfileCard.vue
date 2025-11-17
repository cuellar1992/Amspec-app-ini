<template>
  <div>
    <div class="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex flex-col items-center w-full gap-6 xl:flex-row">
          <AvatarUploader
            :current-avatar="userProfile?.avatar || null"
            :user-name="userProfile?.name || null"
            @avatar-updated="handleAvatarUpdated"
            @avatar-removed="handleAvatarRemoved"
          />
          <div class="text-center xl:text-left">
            <h4 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
              {{ userProfile?.name || 'Not specified' }}
            </h4>
            <div class="flex flex-col items-center gap-1 xl:flex-row xl:gap-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ userProfile?.bio || 'No bio' }}
              </p>
              <span v-if="userProfile?.bio && (userProfile?.address?.city || userProfile?.address?.country)" class="hidden xl:inline text-gray-400">|</span>
              <p v-if="userProfile?.address?.city || userProfile?.address?.country" class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatLocation(userProfile?.address) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserProfile } from '@/composables/useUserProfile'
import type { Address } from '@/services/userService'
import AvatarUploader from '@/components/AvatarUploader.vue'

const { userProfile, loadProfile } = useUserProfile()

onMounted(async () => {
  await loadProfile()
})

const handleAvatarUpdated = async (newAvatar: string) => {
  // Recargar el perfil para obtener los datos actualizados
  await loadProfile()
}

const handleAvatarRemoved = async () => {
  // Recargar el perfil para obtener los datos actualizados
  await loadProfile()
}

const formatLocation = (address?: Address): string => {
  if (!address) return 'No location'

  const parts = []
  if (address.city) parts.push(address.city)
  if (address.country) parts.push(address.country)

  return parts.length > 0 ? parts.join(', ') : 'No location'
}
</script>
