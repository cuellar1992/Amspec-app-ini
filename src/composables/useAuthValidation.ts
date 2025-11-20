import { ref } from 'vue'
import authService from '@/services/authService'

export function useAuthValidation() {
  const isValidating = ref(false)
  const isSessionValid = ref(false)
  const validationError = ref<string | null>(null)
  const isNetworkError = ref(false) // Indica si el último error fue de red

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
    isNetworkError.value = false // Resetear flag de error de red

    try {
      // Intentar refrescar el token
      await authService.refreshAccessToken()
      isSessionValid.value = true
      return true
    } catch (error) {
      // Verificar si es un error de red (servidor no disponible)
      const isNetworkErr = error && typeof error === 'object' && (
        ('code' in error && (
          (error as { code?: string }).code === 'ERR_NETWORK' ||
          (error as { code?: string }).code === 'ERR_CONNECTION_REFUSED' ||
          (error as { code?: string }).code === 'ECONNREFUSED'
        )) ||
        ('request' in error && !('response' in error)) ||
        (error instanceof Error && (
          error.message.includes('Network Error') ||
          error.message.includes('ERR_CONNECTION_REFUSED') ||
          error.message.includes('ERR_NETWORK') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('timeout') ||
          error.message.includes('No response received from server')
        ))
      )

      if (isNetworkErr) {
        // Server is down, but don't clear auth - keep trying
        console.warn('⚠️ Server unavailable, will retry on next navigation')
        isSessionValid.value = false
        validationError.value = 'Server unavailable'
        isNetworkError.value = true // Marcar como error de red
        // NO limpiar autenticación - el usuario puede seguir trabajando cuando el servidor vuelva
      } else {
        // Refresh falló por otro motivo (token inválido/expirado), limpiar autenticación
        console.warn('Sesión expirada:', error)
        authService.clearAuth()
        isSessionValid.value = false
        validationError.value = error instanceof Error ? error.message : 'Error validando sesión'
        isNetworkError.value = false // No es error de red
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
    isNetworkError: isNetworkError,
    validateSession,
    isValidatingSession
  }
}
