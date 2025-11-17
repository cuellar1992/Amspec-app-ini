<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="handleClose">
      <!-- Backdrop -->
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
      </TransitionChild>

      <!-- Modal Container -->
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-md overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl transform transition-all"
            >
              <!-- Modal Header -->
              <div
                class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gradient-to-r from-brand-50 to-white dark:from-gray-800 dark:to-gray-800"
              >
                <DialogTitle class="text-xl font-semibold text-gray-900 dark:text-white">
                  Add New User
                </DialogTitle>
                <button
                  @click="handleClose"
                  class="rounded-lg p-2 text-gray-400 hover:bg-white/50 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white transition-all duration-200"
                >
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <!-- Form -->
              <form @submit.prevent="handleSubmit" class="px-6 py-4">
                <div class="space-y-4">
                  <!-- Username -->
                  <div>
                    <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Username <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="formData.username"
                      type="text"
                      placeholder="Enter username"
                      required
                      class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-brand-800 transition-all duration-200"
                    />
                  </div>

                  <!-- Password -->
                  <div>
                    <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Password <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <input
                        v-model="formData.password"
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="Enter password (min 8 characters)"
                        required
                        minlength="8"
                        class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-gray-900 placeholder-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-brand-800 transition-all duration-200"
                      />
                      <button
                        type="button"
                        @click="showPassword = !showPassword"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg
                          v-if="showPassword"
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                        <svg
                          v-else
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </div>
                    <!-- Password Strength Bar -->
                    <div v-if="formData.password" class="mt-2">
                      <div class="flex items-center gap-2 mb-1">
                        <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                          <div
                            class="h-full transition-all duration-300 rounded-full"
                            :class="passwordStrength.color"
                            :style="{ width: passwordStrength.percentage + '%' }"
                          ></div>
                        </div>
                        <span
                          class="text-xs font-medium"
                          :class="passwordStrength.textColor"
                        >
                          {{ passwordStrength.label }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        Minimum 8 characters
                      </p>
                    </div>
                    <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Minimum 8 characters
                    </p>
                  </div>

                  <!-- Name (Optional) -->
                  <div>
                    <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Name (Optional)
                    </label>
                    <input
                      v-model="formData.name"
                      type="text"
                      placeholder="Enter full name"
                      class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-brand-800 transition-all duration-200"
                    />
                  </div>

                  <!-- Require Password Change -->
                  <div class="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <input
                      id="requirePasswordChange"
                      v-model="formData.requirePasswordChange"
                      type="checkbox"
                      class="mt-0.5 w-4 h-4 text-brand-500 bg-white border-gray-300 rounded focus:ring-brand-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-brand-600 transition-all cursor-pointer"
                    />
                    <div class="flex-1">
                      <label
                        for="requirePasswordChange"
                        class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                      >
                        Require password change on first login
                      </label>
                      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        User will be prompted to change their password when they first sign in
                      </p>
                    </div>
                  </div>

                  <!-- Error Message -->
                  <div v-if="errorMessage" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                    <p class="text-sm text-red-800 dark:text-red-300">{{ errorMessage }}</p>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    @click="handleClose"
                    class="rounded-lg bg-gray-200 px-5 py-2.5 text-gray-900 font-medium hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="isSubmitting || !formData.username.trim() || !formData.password.trim() || formData.password.length < 8"
                    class="rounded-lg bg-brand-500 px-5 py-2.5 text-white font-medium hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <span v-if="isSubmitting" class="flex items-center gap-2">
                      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                    <span v-else>Create User</span>
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from '@headlessui/vue'
import userService from '@/services/userService'
import { useToast } from 'vue-toastification'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const toast = useToast()

const formData = ref({
  username: '',
  password: '',
  name: '',
  requirePasswordChange: true, // Por defecto habilitado
})

const isSubmitting = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

// Reset form when modal closes
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      formData.value = {
        username: '',
        password: '',
        name: '',
        requirePasswordChange: true,
      }
      errorMessage.value = ''
      showPassword.value = false
    }
  }
)

// Password strength calculator
const calculatePasswordStrength = (password: string) => {
  if (!password) {
    return {
      score: 0,
      percentage: 0,
      label: '',
      color: '',
      textColor: '',
    }
  }

  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  }

  // Calculate score
  if (checks.length) score += 1
  if (checks.lowercase) score += 1
  if (checks.uppercase) score += 1
  if (checks.numbers) score += 1
  if (checks.special) score += 1

  // Bonus for longer passwords
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Determine strength level
  let label = ''
  let color = ''
  let textColor = ''
  let percentage = 0

  if (score <= 2) {
    label = 'Weak'
    color = 'bg-red-500'
    textColor = 'text-red-600 dark:text-red-400'
    percentage = 33
  } else if (score <= 4) {
    label = 'Fair'
    color = 'bg-yellow-500'
    textColor = 'text-yellow-600 dark:text-yellow-400'
    percentage = 66
  } else if (score <= 6) {
    label = 'Good'
    color = 'bg-blue-500'
    textColor = 'text-blue-600 dark:text-blue-400'
    percentage = 85
  } else {
    label = 'Strong'
    color = 'bg-green-500'
    textColor = 'text-green-600 dark:text-green-400'
    percentage = 100
  }

  return {
    score,
    percentage,
    label,
    color,
    textColor,
  }
}

const passwordStrength = computed(() => {
  return calculatePasswordStrength(formData.value.password)
})

const handleClose = () => {
  emit('close')
}

const handleSubmit = async () => {
  if (!formData.value.username.trim() || !formData.value.password.trim()) {
    errorMessage.value = 'Username and password are required'
    return
  }

  if (formData.value.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await userService.createUser({
      username: formData.value.username.trim(),
      password: formData.value.password,
      name: formData.value.name.trim() || undefined,
      requirePasswordChange: formData.value.requirePasswordChange,
    })

    toast.success('User created successfully')
    emit('created')
    handleClose()
  } catch (error: any) {
    console.error('Error creating user:', error)
    errorMessage.value = error.message || 'Failed to create user'
    toast.error(error.message || 'Failed to create user')
  } finally {
    isSubmitting.value = false
  }
}
</script>

