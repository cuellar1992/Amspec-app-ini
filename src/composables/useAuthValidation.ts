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
      isValidating.value = false
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
      // Check if it's a network error (server down)
      const isNetworkError = error instanceof Error &&
        (error.message.includes('Network Error') || error.message.includes('ERR_CONNECTION_REFUSED'))

      if (isNetworkError) {
        // Server is down, but don't clear auth - keep trying
        console.warn('⚠️ Server unavailable, will retry on next navigation')
        isSessionValid.value = false
        validationError.value = 'Server unavailable'
      } else {
        // Refresh falló por otro motivo, limpiar autenticación
        console.warn('Sesión expirada:', error)
        authService.clearAuth()
        isSessionValid.value = false
        validationError.value = error instanceof Error ? error.message : 'Error validando sesión'
      }
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
