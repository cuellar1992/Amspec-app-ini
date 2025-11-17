<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-[100001]" @close="handleCancel">
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
              class="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transform transition-all border border-gray-200 dark:border-gray-700"
            >
              <!-- Icon -->
              <div class="px-6 pt-6 pb-4">
                <div
                  :class="[
                    'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
                    variant === 'danger'
                      ? 'bg-red-100 dark:bg-red-900/20'
                      : variant === 'warning'
                      ? 'bg-orange-100 dark:bg-orange-900/20'
                      : 'bg-blue-100 dark:bg-blue-900/20',
                  ]"
                >
                  <component
                    :is="iconComponent"
                    :class="[
                      'h-6 w-6',
                      variant === 'danger'
                        ? 'text-red-600 dark:text-red-400'
                        : variant === 'warning'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-blue-600 dark:text-blue-400',
                    ]"
                  />
                </div>
              </div>

              <!-- Content -->
              <div class="px-6 pb-4 text-center">
                <DialogTitle
                  class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                >
                  {{ title }}
                </DialogTitle>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ message }}
                </p>
              </div>

              <!-- Actions -->
              <div class="px-6 pb-6 flex gap-3">
                <button
                  @click="handleCancel"
                  type="button"
                  class="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-gray-900 font-medium hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                >
                  {{ cancelText }}
                </button>
                <button
                  @click="handleConfirm"
                  type="button"
                  :disabled="isLoading"
                  :class="[
                    'flex-1 rounded-lg px-4 py-2.5 text-white font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed',
                    variant === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : variant === 'warning'
                      ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
                  ]"
                >
                  <span v-if="isLoading" class="flex items-center justify-center gap-2">
                    <svg
                      class="animate-spin h-4 w-4"
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
                    {{ loadingText }}
                  </span>
                  <span v-else>{{ confirmText }}</span>
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
import { computed } from 'vue';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from '@headlessui/vue';
import { AlertTriangle, Trash2, AlertCircle } from 'lucide-vue-next';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loadingText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  loadingText: 'Processing...',
  variant: 'danger',
  isLoading: false,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const iconComponent = computed(() => {
  switch (props.variant) {
    case 'danger':
      return Trash2;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return AlertCircle;
    default:
      return AlertCircle;
  }
});

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>
