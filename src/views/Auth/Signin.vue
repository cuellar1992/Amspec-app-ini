<template>
  <FullScreenLayout>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div
        class="relative flex flex-col justify-center w-full h-screen dark:bg-gray-900"
      >
        <!-- Pantalla de 2FA -->
        <div v-if="requires2FA" class="flex flex-col flex-1 w-full items-center justify-center">
          <div class="w-full max-w-md mx-auto text-center">
            <h1 class="mb-3 text-2xl font-bold text-gray-800 dark:text-white/90">
              Enter your code
            </h1>
            <p class="mb-8 text-sm text-gray-600 dark:text-gray-400">
              Enter the 6-digit security code from your authenticator app.
            </p>

            <!-- 6 code input boxes -->
            <div class="flex gap-2 justify-center mb-8">
              <input
                v-for="(digit, index) in twoFactorDigits"
                :key="index"
                :ref="el => { if (el) twoFactorInputRefs[index] = el as HTMLInputElement }"
                v-model="twoFactorDigits[index]"
                type="text"
                inputmode="numeric"
                pattern="[0-9]"
                maxlength="1"
                @input="handleTwoFactorDigitInput(index, $event)"
                @keydown="handleTwoFactorKeyDown(index, $event)"
                @paste="handleTwoFactorPaste($event)"
                class="w-14 h-14 text-center text-xl font-semibold rounded-lg border-2 border-gray-300 bg-white text-gray-800 shadow-sm focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-500 transition-colors"
              />
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="mb-4 p-3 text-sm text-white bg-red-500 rounded-lg">
              {{ errorMessage }}
            </div>

            <!-- Success Message -->
            <div v-if="successMessage" class="mb-4 p-3 text-sm text-white bg-green-500 rounded-lg">
              {{ successMessage }}
            </div>

            <!-- Button -->
            <button
              @click="handleSubmit"
              :disabled="!isTwoFactorCodeComplete || isLoading"
              class="w-full px-6 py-3 text-base font-semibold text-white transition rounded-full bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading" class="mr-2 inline-block">
                <svg
                  class="animate-spin h-5 w-5 inline"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </span>
              Continue
            </button>

            <!-- Back button -->
            <button
              @click="goBackToLogin"
              class="mt-4 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back to login
            </button>
          </div>
        </div>

        <!-- Normal Login Form -->
        <div v-else class="flex flex-col flex-1 w-full">
          <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <div class="mb-5 sm:mb-8">
                <h1
                  class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md"
                >
                  Sign In
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Enter your email and password to sign in!
                </p>
              </div>
              <div>
                <form @submit.prevent="handleSubmit" autocomplete="on" data-form-type="login">
                  <div class="space-y-5">
                    <!-- Email -->
                    <div>
                      <label
                        for="email"
                        class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        Email<span class="text-error-500">*</span>
                      </label>
                      <input
                        v-model="email"
                        type="email"
                        id="email"
                        name="email"
                        autocomplete="email"
                        data-form-type="login"
                        placeholder="user@amspecgroup.com"
                        class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      />
                    </div>
                    <!-- Password -->
                    <div>
                      <label
                        for="password"
                        class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        Password<span class="text-error-500">*</span>
                      </label>
                      <div class="relative">
                        <input
                          v-model="password"
                          :type="showPassword ? 'text' : 'password'"
                          id="password"
                          name="password"
                          autocomplete="current-password"
                          data-form-type="login"
                          placeholder="Enter your password"
                          class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                        <span
                          @click="togglePasswordVisibility"
                          class="absolute z-30 text-gray-500 -translate-y-1/2 cursor-pointer right-4 top-1/2 dark:text-gray-400"
                        >
                          <svg
                            v-if="!showPassword"
                            class="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.41550 9.4593C2.36150 9.61687 2.36150 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.61690 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z"
                              fill="#98A2B3"
                            />
                          </svg>
                          <svg
                            v-else
                            class="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M4.63803 3.57709C4.34513 3.28420 3.87026 3.28420 3.57737 3.57709C3.28447 3.86999 3.28447 4.34486 3.57737 4.63775L4.85323 5.91362C3.74609 6.84199 2.89363 8.06395 2.41550 9.45936C2.36150 9.61694 2.36150 9.78801 2.41549 9.94558C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C11.2550 15.3619 12.4422 15.0737 13.4994 14.5598L15.3625 16.4229C15.6554 16.7158 16.1302 16.7158 16.4231 16.4229C16.7160 16.1300 16.7160 15.6551 16.4231 15.3622L4.63803 3.57709ZM12.3608 13.4212L10.4475 11.5079C10.3061 11.5423 10.1584 11.5606 10.0064 11.5606H9.99151C8.96527 11.5606 8.13333 10.7286 8.13333 9.70237C8.13333 9.54610 8.15262 9.39434 8.18895 9.24933L5.91885 6.97923C5.03505 7.69015 4.34057 8.62704 3.92328 9.70247C4.86803 12.1373 7.23361 13.8619 10.0002 13.8619C10.8326 13.8619 11.6287 13.7058 12.3608 13.4212ZM16.0771 9.70249C15.7843 10.4569 15.3552 11.1432 14.8199 11.7311L15.8813 12.7925C16.6329 11.9813 17.2187 11.0143 17.5849 9.94561C17.6389 9.78803 17.6389 9.61696 17.5849 9.45938C16.5055 6.30925 13.5184 4.04303 10.0002 4.04303C9.13525 4.04303 8.30244 4.17999 7.52218 4.43338L8.75139 5.66259C9.15560 5.58413 9.57311 5.54303 10.0002 5.54303C12.7667 5.54303 15.1323 7.26768 16.0771 9.70249Z"
                              fill="#98A2B3"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>
                    <!-- Checkbox -->
                    <div class="flex items-center justify-between">
                      <div>
                        <label
                          for="keepLoggedIn"
                          class="flex items-center text-sm font-normal text-gray-700 cursor-pointer select-none dark:text-gray-400"
                        >
                          <div class="relative">
                            <input
                              v-model="keepLoggedIn"
                              type="checkbox"
                              id="keepLoggedIn"
                              class="sr-only"
                            />
                            <div
                              :class="
                                keepLoggedIn
                                  ? 'border-brand-500 bg-brand-500'
                                  : 'bg-transparent border-gray-300 dark:border-gray-700'
                              "
                              class="mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px]"
                            >
                              <span :class="keepLoggedIn ? '' : 'opacity-0'">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 14 14"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                                    stroke="white"
                                    stroke-width="1.94437"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                              </span>
                            </div>
                          </div>
                          Keep me logged in
                        </label>
                      </div>
                      <router-link
                        to="/forgot-password"
                        class="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                        >Forgot password?</router-link
                      >
                    </div>

                    <!-- Error Message -->
                    <div v-if="errorMessage" class="p-3 text-sm text-white bg-red-500 rounded-lg">
                      {{ errorMessage }}
                    </div>

                    <!-- Success Message -->
                    <div v-if="successMessage" class="p-3 text-sm text-white bg-green-500 rounded-lg">
                      {{ successMessage }}
                    </div>

                    <!-- Button -->
                    <div>
                      <button
                        type="submit"
                        :disabled="isLoading"
                        class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span v-if="isLoading" class="mr-2">
                          <svg
                            class="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              class="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              stroke-width="4"
                            ></circle>
                            <path
                              class="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </span>
                        Sign In
                      </button>
                    </div>

                    <!-- Divider -->
                    <div v-if="isPasskeySupported" class="relative flex items-center justify-center">
                      <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      </div>
                      <div class="relative px-4 text-sm text-gray-500 bg-white dark:bg-gray-900 dark:text-gray-400">
                        Or
                      </div>
                    </div>

                    <!-- Passkey Button -->
                    <div v-if="isPasskeySupported">
                      <button
                        type="button"
                        @click="handlePasskeyLogin"
                        :disabled="isLoading"
                        class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 transition rounded-lg border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          class="w-5 h-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                          />
                        </svg>
                        Sign in with Passkey
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import authService, { type LoginResponseWithPasswordChange } from '@/services/authService'
import passkeyService from '@/services/passkeyService'

// Define multi-word component name
defineOptions({
  name: 'SignInView'
})

// Type for login response that may require 2FA
interface LoginResponseWith2FA {
  success: boolean
  message: string
  requires2FA: true
  tempToken: string
}

// Error type
interface AuthError extends Error {
  message: string
  status?: number
  response?: {
    status: number
    data?: {
      message?: string
    }
  }
}

const router = useRouter()

const email = ref('')
const password = ref('')
const twoFactorDigits = ref<string[]>(['', '', '', '', '', ''])
const twoFactorInputRefs = ref<(HTMLInputElement | null)[]>([])
const showPassword = ref(false)
const keepLoggedIn = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const requires2FA = ref(false)
const tempToken = ref('')
const isPasskeySupported = ref(false)

// Computed to check if 2FA code is complete
const isTwoFactorCodeComplete = computed(() => {
  return twoFactorDigits.value.every(digit => digit !== '') && twoFactorDigits.value.length === 6
})

// Computed to get the complete code
const twoFactorCode = computed(() => {
  return twoFactorDigits.value.join('')
})

onMounted(() => {
  isPasskeySupported.value = passkeyService.isSupported()
})

// Auto-submit 2FA code when all 6 digits are entered
watch(isTwoFactorCodeComplete, async (isComplete) => {
  if (isComplete && requires2FA.value && !isLoading.value) {
    // Small delay to allow the user to see the last digit and prevent double submit
    await new Promise(resolve => setTimeout(resolve, 100))
    if (!isLoading.value) {
      handleSubmit()
    }
  }
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// Functions to handle 2FA code inputs
const handleTwoFactorDigitInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/[^0-9]/g, '')
  
  // Only take the last character if there are more than one
  const digit = value.slice(-1)
  
  if (digit) {
    twoFactorDigits.value[index] = digit
    // Move to next field if available
    if (index < 5) {
      nextTick(() => {
        twoFactorInputRefs.value[index + 1]?.focus()
      })
    }
  } else {
    twoFactorDigits.value[index] = ''
  }
}

const handleTwoFactorKeyDown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !twoFactorDigits.value[index] && index > 0) {
    // If field is empty and backspace is pressed, go to previous field
    nextTick(() => {
      twoFactorInputRefs.value[index - 1]?.focus()
    })
  } else if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault()
    twoFactorInputRefs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowRight' && index < 5) {
    event.preventDefault()
    twoFactorInputRefs.value[index + 1]?.focus()
  }
}

const handleTwoFactorPaste = async (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''
  const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6).split('')
  
  // Fill fields with pasted digits
  for (let i = 0; i < 6; i++) {
    if (i < digits.length) {
      twoFactorDigits.value[i] = digits[i]
    } else {
      twoFactorDigits.value[i] = ''
    }
  }
  
  // Focus on the last filled field or the first empty one
  await nextTick()
  const nextIndex = Math.min(digits.length, 5)
  twoFactorInputRefs.value[nextIndex]?.focus()
}

const goBackToLogin = () => {
  requires2FA.value = false
  twoFactorDigits.value = ['', '', '', '', '', '']
  errorMessage.value = ''
  successMessage.value = ''
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    if (requires2FA.value) {
      const code = twoFactorCode.value
      if (code.length !== 6) {
        errorMessage.value = 'Please enter the complete 6-digit code'
        isLoading.value = false
        return
      }

      // Verify 2FA code
      const response = await authService.verify2FA(tempToken.value, code)

      if (response.success) {
        successMessage.value = 'Login successful'

        // Esperar un tick para que Vue actualice el estado reactivo
        await nextTick()

        // Sincronizar información completa del usuario después del login 2FA
        try {
          await authService.getMe()
          // Esperar otro tick después de obtener los datos del usuario
          await nextTick()
        } catch (error) {
          console.warn('No se pudo sincronizar la información del usuario después del 2FA:', error)
        }

        // Pequeño delay para asegurar que todo está sincronizado
        await new Promise(resolve => setTimeout(resolve, 300))

        // Redirect to dashboard
        router.push('/')
      }
    } else {
      // Normal login
      const response = await authService.login({
        email: email.value,
        password: password.value,
      })

      // Type guard to check if response requires 2FA
      const is2FAResponse = (res: typeof response): res is LoginResponseWith2FA => {
        return 'requires2FA' in res && res.requires2FA === true && 'tempToken' in res
      }

      // Type guard to check if response requires password change
      const isPasswordChangeResponse = (res: typeof response): res is LoginResponseWithPasswordChange => {
        return 'requirePasswordChange' in res && res.requirePasswordChange === true && 'tempToken' in res
      }

      // If password change is required
      if (isPasswordChangeResponse(response)) {
        // Redirect to first password change page with tempToken
        router.push({
          name: 'First Password Change',
          query: { tempToken: response.tempToken }
        })
        return
      }

      // If 2FA is required
      if (is2FAResponse(response)) {
        requires2FA.value = true
        tempToken.value = response.tempToken
        twoFactorDigits.value = ['', '', '', '', '', '']
        // Focus first field after screen is shown
        await nextTick()
        twoFactorInputRefs.value[0]?.focus()
      } else if ('success' in response && response.success) {
        successMessage.value = 'Login successful'

        // Sincronizar información completa del usuario después del login
        try {
          await authService.getMe()
        } catch (error) {
          console.warn('No se pudo sincronizar la información del usuario después del login:', error)
        }

        // Redirect to dashboard
        setTimeout(() => {
          router.push('/')
        }, 1000)
      }
    }
  } catch (error: unknown) {
    console.error('Login error:', error)
    const authError = error as AuthError
    errorMessage.value = authError.message || 'Login failed. Please try again.'
    // Clear fields on error
    if (requires2FA.value) {
      twoFactorDigits.value = ['', '', '', '', '', '']
      await nextTick()
      twoFactorInputRefs.value[0]?.focus()
    }
  } finally {
    isLoading.value = false
  }
}

const handlePasskeyLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    // Authenticate with passkey (optionally with email hint)
    const response = await passkeyService.authenticateWithPasskey(
      email.value || undefined
    )

    // Save tokens and user using the same methods as authService
    if (response.tokens && response.user) {
      // Save tokens in localStorage (using the same keys as authService)
      localStorage.setItem('accessToken', response.tokens.accessToken)
      localStorage.setItem('refreshToken', response.tokens.refreshToken)
      
      // Temporarily save user data, but will be replaced by getMe() call
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Sync with authService to get complete user information including avatar
      // This ensures the user state is consistent across the app
      await authService.getMe()
    }

    successMessage.value = 'Passkey authentication successful'

    // Redirect to dashboard
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch (error: unknown) {
    console.error('Error in passkey login:', error)
    const authError = error as AuthError
    
    // Handle specific passkey errors
    if ((authError as { name?: string }).name === 'NotAllowedError') {
      errorMessage.value = 'Passkey authentication was cancelled'
    } else if (authError.status === 400 || authError.message?.includes('not found') || authError.message?.includes('No passkeys')) {
      errorMessage.value = 'No passkeys found for this account. Please register a passkey first in Account Settings after logging in with your password.'
    } else if (authError.response?.status === 400) {
      errorMessage.value = 'No passkeys found. Please log in with your password first, then register a passkey in Account Settings.'
    } else {
      errorMessage.value = authError.message || 'Passkey authentication failed. Please try again or use password login.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>
