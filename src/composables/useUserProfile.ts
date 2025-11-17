import { ref, readonly } from 'vue'
import userService from '@/services/userService'
import authService from '@/services/authService'
import type { UserProfile } from '@/services/userService'

// Estado compartido entre componentes
const userProfile = ref<UserProfile | null>(null)
const isLoading = ref(false)

export function useUserProfile() {
  const loadProfile = async () => {
    isLoading.value = true
    try {
      userProfile.value = await userService.getProfile()
      // Sincronizar con authService también
      await authService.getMe()
    } catch (error: any) {
      console.error('Error loading profile:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const updatedProfile = await userService.updateProfile(data)
      userProfile.value = updatedProfile
      // Actualizar también en authService
      await authService.getMe()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  return {
    userProfile: readonly(userProfile),
    isLoading: readonly(isLoading),
    loadProfile,
    updateProfile,
  }
}
