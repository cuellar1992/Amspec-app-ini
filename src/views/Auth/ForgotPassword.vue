<template>
  <FullScreenLayout>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div class="relative flex flex-col justify-center w-full h-screen dark:bg-gray-900">
        <div class="flex flex-col flex-1 w-full">
          <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <div class="mb-5 sm:mb-8">
                <h1
                  class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md"
                >
                  Reset Password
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>
              <div>
                <form @submit.prevent="handleSubmit">
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
                        placeholder="user@amspecgroup.com"
                        required
                        class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      />
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
                        {{ isLoading ? 'Sending...' : 'Send recovery link' }}
                      </button>
                    </div>

                    <!-- Back to login -->
                    <div class="text-center">
                      <router-link
                        to="/signin"
                        class="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                      >
                        Back to sign in
                      </router-link>
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
import { ref } from 'vue'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import api from '@/services/api'

// Error type
interface ApiError extends Error {
  response?: {
    data?: {
      message?: string
    }
  }
}

const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    const response = await api.post('/password/forgot', { email: email.value })

    if (response.data.success) {
      successMessage.value =
        'If the email exists, a recovery link will be sent. Please check your email.'
      // In development, show the link if available
      if (response.data.resetLink) {
        console.log('🔗 Reset Link:', response.data.resetLink)
        successMessage.value += ` (Development: ${response.data.resetLink})`
      }
    }
  } catch (error: unknown) {
    console.error('Error:', error)
    const apiError = error as ApiError
    errorMessage.value = apiError.response?.data?.message || 'Failed to send recovery request'
  } finally {
    isLoading.value = false
  }
}
</script>

