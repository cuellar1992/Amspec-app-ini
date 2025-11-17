import './assets/main.css'
// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'jsvectormap/dist/jsvectormap.css'
import 'flatpickr/dist/flatpickr.css'
// Import Toast Notification styles
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueApexCharts from 'vue3-apexcharts'

const app = createApp(App)

// Configure Toast options
const toastOptions = {
  transition: 'Vue-Toastification__bounce',
  maxToasts: 5,
  newestOnTop: true,
  position: 'top-right' as const,
  timeout: 4000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button' as const,
  icon: true,
  rtl: false,
  shareAppContext: true,
  toastClassName: 'high-z-toast',
  bodyClassName: 'high-z-toast-body',
}

app.use(router)
app.use(VueApexCharts)
app.use(Toast, toastOptions)

app.mount('#app')
