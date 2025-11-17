import { createRouter, createWebHistory } from 'vue-router'
import authService from '@/services/authService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/Graphics.vue'),
      meta: {
        title: 'Dashboard',
        requiresAuth: true,
      },
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: () => import('../views/Others/Calendar.vue'),
      meta: {
        title: 'Calendar',
      },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/Others/UserProfile.vue'),
      meta: {
        title: 'Profile',
        requiresAuth: true,
      },
    },
    {
      path: '/account-settings',
      name: 'Account Settings',
      component: () => import('../views/Settings/AccountSettings.vue'),
      meta: {
        title: 'Account Settings',
        requiresAuth: true,
      },
    },
    {
      path: '/reset-password',
      name: 'Reset Password',
      component: () => import('../views/Auth/ResetPassword.vue'),
      meta: {
        title: 'Reset Password',
      },
    },
    {
      path: '/form-elements',
      name: 'Form Elements',
      component: () => import('../views/Forms/FormElements.vue'),
      meta: {
        title: 'Form Elements',
      },
    },
    {
      path: '/basic-tables',
      name: 'Basic Tables',
      component: () => import('../views/Tables/BasicTables.vue'),
      meta: {
        title: 'Basic Tables',
      },
    },
    {
      path: '/ship-nomination',
      name: 'Ship Nomination',
      component: () => import('../views/Operations/ShipNomination.vue'),
      meta: {
        title: 'Ship Nomination',
        requiresAuth: true,
      },
    },
    {
      path: '/sampling-roster',
      name: 'Sampling Roster',
      component: () => import('../views/Operations/SamplingRoster.vue'),
      meta: {
        title: 'Sampling Roster',
        requiresAuth: true,
      },
    },
    {
      path: '/molekulis-loading',
      name: 'Molekulis Loading',
      component: () => import('../views/Operations/MolekulisLoading.vue'),
      meta: {
        title: 'Molekulis Loading',
        requiresAuth: true,
      },
    },
    {
      path: '/other-jobs',
      name: 'Other Jobs',
      component: () => import('../views/Operations/OtherJobs.vue'),
      meta: {
        title: 'Other Jobs',
        requiresAuth: true,
      },
    },
    {
      path: '/management-users',
      name: 'Management Users',
      component: () => import('../views/Users/ManagementUsers.vue'),
      meta: {
        title: 'Management Users',
        requiresAuth: true,
      },
    },
    {
      path: '/alerts',
      name: 'Alerts',
      component: () => import('../views/UiElements/Alerts.vue'),
      meta: {
        title: 'Alerts',
      },
    },
    {
      path: '/avatars',
      name: 'Avatars',
      component: () => import('../views/UiElements/Avatars.vue'),
      meta: {
        title: 'Avatars',
      },
    },
    {
      path: '/badge',
      name: 'Badge',
      component: () => import('../views/UiElements/Badges.vue'),
      meta: {
        title: 'Badge',
      },
    },

    {
      path: '/buttons',
      name: 'Buttons',
      component: () => import('../views/UiElements/Buttons.vue'),
      meta: {
        title: 'Buttons',
      },
    },

    {
      path: '/images',
      name: 'Images',
      component: () => import('../views/UiElements/Images.vue'),
      meta: {
        title: 'Images',
      },
    },
    {
      path: '/videos',
      name: 'Videos',
      component: () => import('../views/UiElements/Videos.vue'),
      meta: {
        title: 'Videos',
      },
    },
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: {
        title: 'Signin',
        requiresGuest: true,
      },
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/Auth/Signup.vue'),
      meta: {
        title: 'Signup',
        requiresGuest: true,
      },
    },
    {
      path: '/forgot-password',
      name: 'Forgot Password',
      component: () => import('../views/Auth/ForgotPassword.vue'),
      meta: {
        title: 'Forgot Password',
        requiresGuest: true,
      },
    },
    {
      path: '/first-password-change',
      name: 'First Password Change',
      component: () => import('../views/Auth/FirstPasswordChange.vue'),
      meta: {
        title: 'Change Password',
        requiresGuest: true,
      },
    },
  ],
})

export default router

router.beforeEach((to, from, next) => {
  // Establecer título solo si existe
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} | AmSpec Dashboard`
  } else {
    document.title = 'AmSpec Dashboard'
  }

  // ⭐ Como App.vue ya valida la sesión globalmente,
  // solo verificamos si la ruta requiere auth
  // y si el usuario tiene tokens (no necesitamos validar aquí)
  const requiresAuth = to.meta?.requiresAuth === true
  const requiresGuest = to.meta?.requiresGuest === true

  try {
    const isAuthenticated = authService.isAuthenticated()

    // Si la ruta requiere autenticación y NO hay token
    if (requiresAuth && !isAuthenticated) {
      // Redirigir a signin (aunque App.vue probablemente ya lo hizo)
      if (to.name !== 'Signin') {
        next({ name: 'Signin', query: { redirect: to.fullPath } })
      } else {
        next()
      }
      return
    }

    // Si la ruta requiere ser invitado (no autenticado) y el usuario tiene token
    if (requiresGuest && isAuthenticated) {
      // Redirigir al dashboard
      if (to.name !== 'Dashboard') {
        next({ name: 'Dashboard' })
      } else {
        next()
      }
      return
    }

    next()
  } catch (error) {
    console.error('Error en router guard:', error)
    // En caso de error, permitir navegación para evitar bloqueo total
    next()
  }
})
