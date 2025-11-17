<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-[99999]" @close="handleClose">
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
        <div class="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity" />
      </TransitionChild>

      <!-- Modal Container -->
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95 translate-y-4"
            enter-to="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100 translate-y-0"
            leave-to="opacity-0 scale-95 translate-y-4"
          >
            <DialogPanel
              class="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all"
            >
              <!-- Icon and Title -->
              <div class="px-6 pt-6 pb-4 text-center">
                <div
                  :class="[
                    'mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4',
                    variantClasses[variant].iconContainer,
                  ]"
                >
                  <component :is="icons[variant]" class="h-8 w-8" />
                </div>

                <DialogTitle :class="['text-2xl font-bold text-gray-900 dark:text-white mb-2']">
                  {{ title }}
                </DialogTitle>

                <p class="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                  {{ message }}
                </p>
              </div>

              <!-- Actions -->
              <div class="px-6 pb-6 flex gap-3">
                <button
                  @click="handleClose"
                  class="flex-1 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-3 text-base font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow"
                >
                  Cancel
                </button>
                <button
                  @click="handleConfirm"
                  :class="[
                    'flex-1 rounded-xl px-6 py-3 text-base font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl',
                    variantClasses[variant].confirmButton,
                  ]"
                >
                  {{ confirmText }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { WarningIcon, InfoCircleIcon } from '@/icons'

interface Props {
  isOpen: boolean
  title: string
  message: string
  variant?: 'warning' | 'danger' | 'info'
  confirmText?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'warning',
  confirmText: 'Confirm',
})

const emit = defineEmits<{
  confirm: []
  close: []
}>()

const variantClasses = {
  warning: {
    iconContainer: 'bg-yellow-100 dark:bg-yellow-900/30',
    confirmButton: 'bg-yellow-500 hover:bg-yellow-600',
  },
  danger: {
    iconContainer: 'bg-red-100 dark:bg-red-900/30',
    confirmButton: 'bg-red-600 hover:bg-red-700',
  },
  info: {
    iconContainer: 'bg-blue-100 dark:bg-blue-900/30',
    confirmButton: 'bg-blue-600 hover:bg-blue-700',
  },
}

const icons = {
  warning: WarningIcon,
  danger: WarningIcon,
  info: InfoCircleIcon,
}

const handleConfirm = () => {
  emit('confirm')
  handleClose()
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
/* Smooth transitions */
</style>
