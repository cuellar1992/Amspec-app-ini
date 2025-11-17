import { ref } from 'vue'
import authService from '@/services/authService'

export function useAuthValidation() {
  const isValidating = ref(false)
  const isSessionValid = ref(false)
  const validationError = ref<string | null>(null)

  /**
   * Valida la sesión actual intentanto refrescar el token
   */
  const validateSession = async (): Promise<boolean> => {
    // Si no hay tokens, no es válida
    if (!authService.getAccessToken() || !authService.getRefreshToken()) {
      isSessionValid.value = false
      validationError.value = 'No hay tokens de autenticación'
      return false
    }

    isValidating.value = true
    validationError.value = null

    try {
      // Intentar refrescar el token
      await authService.refreshAccessToken()
      isSessionValid.value = true
      return true
    } catch (error) {
      // Refresh falló, limpiar autenticación
      console.warn('Sesión expirada:', error)
      authService.clearAuth()
      isSessionValid.value = false
      validationError.value = error instanceof Error ? error.message : 'Error validando sesión'
      return false
    } finally {
      isValidating.value = false
    }
  }

  /**
   * Verifica si la sesión está siendo validada
   */
  const isValidatingSession = (): boolean => {
    return isValidating.value
  }

  return {
    isValidating: isValidating,
    isSessionValid: isSessionValid,
    validationError: validationError,
    validateSession,
    isValidatingSession
  }
}
