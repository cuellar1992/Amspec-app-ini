import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  plugins: [
    vue(),
    vueJsx(),
    // Solo habilitar DevTools en desarrollo
    ...(process.env.NODE_ENV === 'development' ? [vueDevTools()] : []),
  ],
  server: {
    host: '0.0.0.0', // Permite conexiones desde cualquier IP de la red
    port: 5173, // Puerto del frontend
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // Mejor configuración para contenedores
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      external: [
        // Externalizar imágenes que causan problemas en el build
        // Usar string literals para evitar errores de TypeScript
        './src/assets/images/grid-image/image-01.png',
        './src/assets/images/grid-image/image-02.png'
      ],
      output: {
        manualChunks: undefined,
      },
    },
    // Optimizaciones para producción
    minify: 'terser',
    sourcemap: false,
    // Aumentar el límite de advertencia de tamaño de chunk
    chunkSizeWarningLimit: 1000,
    // Optimización para contenedores
    assetsInlineLimit: 4096,
  },
  // Optimizaciones para contenedores Docker
  optimizeDeps: {
    include: ['vue', 'vue-router', 'axios'],
  },
})
