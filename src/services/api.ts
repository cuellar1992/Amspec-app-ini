import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import router from '@/router'

// Base URL for API
// En producción, usar ruta relativa (mismo servidor)
// En desarrollo, usar localhost
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')

// Log API URL for debugging (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL)
  console.log('🌍 Environment:', import.meta.env.MODE)
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: import.meta.env.PROD ? 30000 : 10000, // 30s en producción, 10s en desarrollo
  withCredentials: true, // Para cookies si se usan
})

// Flag para evitar loops infinitos de refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: string | null) => void
  reject: (reason?: Error | unknown) => void
}> = []

const processQueue = (error: Error | unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request interceptor (for adding auth tokens)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor (for handling errors and token refresh)
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Si el error es 401 y es por token expirado
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const errorData = error.response.data as { code?: string; message?: string }

      // Si es error de token expirado, intentar refresh
      if (errorData?.code === 'TOKEN_EXPIRED' || error.response.status === 401) {
        if (isRefreshing) {
          // Si ya está refrescando, poner en cola
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              if (originalRequest.headers && token) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              return api(originalRequest)
            })
            .catch((err) => {
              return Promise.reject(err)
            })
        }

        originalRequest._retry = true
        isRefreshing = true

        const refreshToken = localStorage.getItem('refreshToken')

        if (!refreshToken) {
          // No hay refresh token, limpiar y redirigir a login
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          processQueue(new Error('No refresh token'), null)
          isRefreshing = false
          // Evitar redirección si ya estamos en signin
          if (window.location.pathname !== '/signin') {
            router.push('/signin')
          }
          return Promise.reject(error)
        }

        try {
          // Intentar refrescar el token
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )

          const { accessToken } = response.data.data

          if (accessToken) {
            localStorage.setItem('accessToken', accessToken)

            // Actualizar el header del request original
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
            }

            // Procesar cola de requests pendientes
            processQueue(null, accessToken)
            isRefreshing = false

            // Reintentar el request original
            return api(originalRequest)
          }
        } catch (refreshError) {
          // Verificar si es un error de red
          const isNetworkError = refreshError && typeof refreshError === 'object' && (
            ('code' in refreshError && (
              (refreshError as { code?: string }).code === 'ERR_NETWORK' ||
              (refreshError as { code?: string }).code === 'ERR_CONNECTION_REFUSED' ||
              (refreshError as { code?: string }).code === 'ECONNREFUSED'
            )) ||
            ('request' in refreshError && !('response' in refreshError)) ||
            (refreshError instanceof Error && (
              refreshError.message.includes('Network Error') ||
              refreshError.message.includes('ERR_CONNECTION_REFUSED') ||
              refreshError.message.includes('ERR_NETWORK') ||
              refreshError.message.includes('ECONNREFUSED') ||
              refreshError.message.includes('timeout')
            ))
          )

          if (isNetworkError) {
            // Error de red - NO limpiar autenticación, solo rechazar el request
            console.warn('⚠️ Network error during token refresh - server may be unavailable')
            processQueue(refreshError as Error, null)
            isRefreshing = false
            return Promise.reject(refreshError)
          }

          // Error al refrescar (token inválido/expirado), limpiar y redirigir
          processQueue(refreshError as Error, null)
          isRefreshing = false
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          // Evitar redirección si ya estamos en signin
          if (window.location.pathname !== '/signin') {
            router.push('/signin')
          }
          return Promise.reject(refreshError)
        }
      }
    }

    // Manejar otros errores
    if (error.response) {
      // Server responded with error
      const errorData = error.response.data as { code?: string; message?: string }
      
      // Solo loguear en desarrollo
      if (import.meta.env.DEV) {
        console.error('API Error:', errorData)
      }

      // Si es error 403 (forbidden), podría ser que necesite 2FA
      if (error.response.status === 403 && errorData?.code === '2FA_REQUIRED') {
        // Esto se manejará en el componente
        return Promise.reject(error)
      }
    } else if (error.request) {
      // Request made but no response
      if (import.meta.env.DEV) {
        console.error('Network Error:', error.message)
      }
    } else {
      // Something else happened
      if (import.meta.env.DEV) {
        console.error('Error:', error.message)
      }
    }

    return Promise.reject(error)
  }
)

export default api
