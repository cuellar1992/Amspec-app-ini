<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
    <!-- Ships This Year Card -->
    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
    >
      <div
        class="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800"
      >
        <Ship :size="24" class="text-gray-800 dark:text-white/90" />
      </div>

      <div class="flex items-end justify-between mt-5">
        <div>
          <span class="text-sm text-gray-500 dark:text-gray-400">Ships This Year</span>
          <h4
            v-if="loading"
            class="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90"
          >
            ...
          </h4>
          <h4
            v-else
            class="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90"
          >
            {{ currentYearShips }}
          </h4>
        </div>

        <span
          v-if="!loading && yearGrowthPercentage !== null"
          :class="[
            'flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium',
            yearGrowthPercentage >= 0
              ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
              : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
          ]"
        >
          <svg
            class="fill-current"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              v-if="yearGrowthPercentage >= 0"
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M5.56462 1.62393C5.70193 1.47072 5.90135 1.37432 6.12329 1.37432C6.1236 1.37432 6.12391 1.37432 6.12422 1.37432C6.31631 1.37415 6.50845 1.44731 6.65505 1.59381L9.65514 4.5918C9.94814 4.88459 9.94831 5.35947 9.65552 5.65246C9.36273 5.94546 8.88785 5.94562 8.59486 5.65283L6.87329 3.93247L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93578L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65248C2.3017 5.35949 2.30185 4.88462 2.59484 4.59182L5.56462 1.62393Z"
              fill=""
            />
            <path
              v-else
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C5.8736 10.6257 5.8739 10.6257 5.87421 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753L6.62329 1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875L5.12329 8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z"
              fill=""
            />
          </svg>

          {{ Math.abs(yearGrowthPercentage).toFixed(2) }}%
        </span>
      </div>
    </div>

    <!-- Total Ships Card -->
    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
    >
      <div
        class="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800"
      >
        <Anchor :size="24" class="text-gray-800 dark:text-white/90" />
      </div>

      <div class="flex items-end justify-between mt-5">
        <div>
          <span class="text-sm text-gray-500 dark:text-gray-400">Total Ships</span>
          <h4
            v-if="loading"
            class="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90"
          >
            ...
          </h4>
          <h4
            v-else
            class="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90"
          >
            {{ totalShips }}
          </h4>
        </div>

        <span
          v-if="!loading && totalYears > 0"
          class="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg"
        >
          {{ totalYears }} {{ totalYears === 1 ? 'Year' : 'Years' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { Ship, Anchor } from 'lucide-vue-next'
import { getShipsByYear, type ShipsByYear } from '../../services/shipNominationService'

const shipsByYear = ref<ShipsByYear[]>([])
const loading = ref(true)
const currentYear = new Date().getFullYear()

const currentYearShips = computed(() => {
  const yearData = shipsByYear.value.find((item: ShipsByYear) => item.year === currentYear)
  return yearData?.count || 0
})

const previousYearShips = computed(() => {
  const yearData = shipsByYear.value.find((item: ShipsByYear) => item.year === currentYear - 1)
  return yearData?.count || 0
})

const yearGrowthPercentage = computed(() => {
  if (previousYearShips.value === 0) return null
  const growth = ((currentYearShips.value - previousYearShips.value) / previousYearShips.value) * 100
  return growth
})

const totalShips = computed(() => {
  return shipsByYear.value.reduce((sum: number, yearData: ShipsByYear) => sum + yearData.count, 0)
})

const totalYears = computed(() => {
  return shipsByYear.value.length
})

const fetchShipsData = async () => {
  try {
    loading.value = true
    const response = await getShipsByYear()

    if (response.success && response.data) {
      shipsByYear.value = response.data
    }
  } catch (err: any) {
    console.error('Error fetching ships by year:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchShipsData()
})
</script>
