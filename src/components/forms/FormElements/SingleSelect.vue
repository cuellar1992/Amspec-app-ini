<template>
  <div class="relative" ref="selectRef">
    <div
      @click="!props.disabled && toggleDropdown()"
      class="h-11 flex items-center w-full appearance-none rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
      :class="{ 
        'text-gray-800 dark:text-white/90': isOpen,
        'opacity-50 cursor-not-allowed': props.disabled,
        'cursor-pointer': !props.disabled,
        'border-brand-300 ring-3 ring-brand-500/10 dark:border-brand-800': isOpen && !props.disabled,
        'border-gray-300 dark:border-gray-700': !isOpen || props.disabled
      }"
    >
      <span v-if="!selectedItem" class="text-gray-400 dark:text-gray-500">{{ props.placeholder }}</span>
      <span v-else class="text-gray-900 dark:text-white">{{ selectedItem.label }}</span>
      <svg
        class="ml-auto"
        :class="{ 'transform rotate-180': isOpen }"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen && !props.disabled"
        class="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-sm dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
      >
        <ul
          class="overflow-y-auto divide-y divide-gray-200 custom-scrollbar max-h-60 dark:divide-gray-800"
          role="listbox"
        >
          <li
            v-for="item in props.options"
            :key="item.value"
            @click="selectItem(item)"
            class="relative flex items-center w-full px-3 py-2 border-transparent cursor-pointer first:rounded-t-lg last:rounded-b-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            :class="{ 'bg-gray-50 dark:bg-white/[0.03]': isSelected(item) }"
            role="option"
            :aria-selected="isSelected(item)"
          >
            <span class="grow">{{ item.label }}</span>
            <svg
              v-if="isSelected(item)"
              class="w-5 h-5 text-gray-400 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  options: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Select option...',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const selectRef = ref(null)

const selectedItem = computed(() => {
  if (!props.modelValue) return null
  return props.options.find((item) => item.value === props.modelValue) || null
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectItem = (item) => {
  emit('update:modelValue', item.value)
  emit('change', item.value)
  isOpen.value = false
}

const isSelected = (item) => {
  return props.modelValue === item.value
}

const handleClickOutside = (event) => {
  if (selectRef.value && !selectRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

