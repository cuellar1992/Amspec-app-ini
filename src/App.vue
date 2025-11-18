<template>
  <ThemeProvider>
    <SidebarProvider>
      <!-- ⭐ Loader global mientras valida sesión -->
      <div v-if="isValidating" class="flex items-center justify-center min-h-screen bg-gray-50">
        <div class="text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <h2 class="mt-6 text-xl font-semibold text-gray-700">Validating session...</h2>
          <p class="mt-2 text-sm text-gray-500">Please wait a moment</p>
        </div>
      </div>

      <!-- ⭐ Solo renderizar RouterView cuando la validación esté completa -->
      <RouterView v-else />
    </SidebarProvider>
  </ThemeProvider>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import ThemeProvider from './components/layout/ThemeProvider.vue'
import SidebarProvider from './components/layout/SidebarProvider.vue'
import { useAuthValidation } from './composables/useAuthValidation'
import { useSocketNotifications } from './composables/useSocketNotifications'
import { useGlobalSocket } from './composables/useSocket'

const router = useRouter()
const socket = useGlobalSocket()

// ⭐ Usar el composable de validación de sesión
const { isValidating, isSessionValid, validateSession } = useAuthValidation()

// ⭐ Configurar listeners de notificaciones de WebSocket centralizados
// Esto previene notificaciones duplicadas al manejarlas en un solo lugar
useSocketNotifications()

// ⭐ Validar sesión al montar la aplicación
onMounted(async () => {
  await validateSession()
})

// ⭐ Conectar WebSocket solo después de validar sesión exitosamente
watch(isSessionValid, (isValid) => {
  if (isValid && !socket.connected.value && !socket.connecting.value) {
    socket.connect()
  }
})

// ⭐ Redirigir automáticamente cuando cambie el estado de validación
watch(isValidating, (newVal) => {
  // Cuando termine de validar (isValidating = false)
  if (!newVal && isSessionValid.value) {
    // Si ya estamos en signin, redirigir al dashboard
    if (router.currentRoute.value.name === 'Signin') {
      router.push('/')
    }
    // Si estamos en una ruta que requiere auth, continuar
  } else if (!newVal && !isSessionValid.value) {
    // Si la sesión no es válida y NO estamos en signin, redirigir
    if (router.currentRoute.value.name !== 'Signin') {
      router.push({ name: 'Signin', query: { redirect: router.currentRoute.value.fullPath } })
    }
  }
})
</script>
