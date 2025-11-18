import { ref, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'

const socket = ref<Socket | null>(null)
const connected = ref(false)
const connecting = ref(false)

export function useSocket() {
  const connect = () => {
    if (socket.value?.connected) {
      console.log('Socket already connected')
      return
    }

    connecting.value = true

    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.error('No access token found')
      connecting.value = false
      return
    }

    const API_URL = import.meta.env.VITE_API_URL ||
      (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000')

    // Remove /api from URL if present
    const socketURL = API_URL.replace('/api', '')

    socket.value = io(socketURL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socket.value.on('connect', () => {
      console.log('✅ Socket connected')
      connected.value = true
      connecting.value = false
    })

    socket.value.on('disconnect', () => {
      console.log('❌ Socket disconnected')
      connected.value = false
    })

    socket.value.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
      connecting.value = false
    })

    socket.value.on('connected', (data) => {
      console.log('📡 Received welcome message:', data.message)
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      connected.value = false
    }
  }

  const on = (event: string, callback: (...args: any[]) => void) => {
    socket.value?.on(event, callback)
  }

  const off = (event: string, callback?: (...args: any[]) => void) => {
    socket.value?.off(event, callback)
  }

  const emit = (event: string, ...args: any[]) => {
    socket.value?.emit(event, ...args)
  }

  const joinRoom = (room: string) => {
    if (socket.value?.connected) {
      socket.value.emit(`join:${room}`)
    }
  }

  const leaveRoom = (room: string) => {
    if (socket.value?.connected) {
      socket.value.emit(`leave:${room}`)
    }
  }

  return {
    socket,
    connected,
    connecting,
    connect,
    disconnect,
    on,
    off,
    emit,
    joinRoom,
    leaveRoom
  }
}

// Global socket instance for app-wide usage
let globalSocket: ReturnType<typeof useSocket> | null = null

export function useGlobalSocket() {
  if (!globalSocket) {
    globalSocket = useSocket()
  }
  return globalSocket
}

// Auto-connect composable
export function useAutoSocket() {
  const socketInstance = useGlobalSocket()

  onMounted(() => {
    if (!socketInstance.connected.value && !socketInstance.connecting.value) {
      socketInstance.connect()
    }
  })

  onUnmounted(() => {
    // Don't disconnect on unmount, keep global connection alive
  })

  return socketInstance
}
