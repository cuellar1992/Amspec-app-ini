import { ref } from 'vue'

/**
 * Creates a debounced version of a function
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns A debounced version of the function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Creates a debounced ref that updates after a delay
 * @param initialValue - Initial value
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Object with value and debouncedValue refs
 */
export function useDebouncedRef<T>(initialValue: T, delay: number = 300) {
  const value = ref<T>(initialValue)
  const debouncedValue = ref<T>(initialValue)
  let timeoutId: NodeJS.Timeout | null = null

  const updateDebouncedValue = (newValue: T) => {
    value.value = newValue
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue
      timeoutId = null
    }, delay)
  }

  return {
    value,
    debouncedValue,
    updateValue: updateDebouncedValue,
  }
}

/**
 * Creates a throttled version of a function
 * @param fn - The function to throttle
 * @param limit - The minimum time between calls in milliseconds
 * @returns A throttled version of the function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}
