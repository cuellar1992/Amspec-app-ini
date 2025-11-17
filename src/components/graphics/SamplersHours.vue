<template>
  <div
    class="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
  >
    <div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h4 class="text-lg font-bold text-gray-800 dark:text-white/90">
          Samplers Hours
        </h4>
      </div>

      <div class="flex items-center gap-3">
        <!-- Mode Toggle -->
        <div class="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
          <button
            @click="handleWeekChange"
            :class="[
              viewMode === 'week'
                ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800'
                : 'text-gray-500 dark:text-gray-400',
              'px-3 py-2 font-medium rounded-md text-sm hover:text-gray-900 hover:shadow-theme-xs dark:hover:bg-gray-800 dark:hover:text-white transition-colors',
            ]"
          >
            Week
          </button>
          <button
            @click="handleMonthChange"
            :class="[
              viewMode === 'month'
                ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800'
                : 'text-gray-500 dark:text-gray-400',
              'px-3 py-2 font-medium rounded-md text-sm hover:text-gray-900 hover:shadow-theme-xs dark:hover:bg-gray-800 dark:hover:text-white transition-colors',
            ]"
          >
            Month
          </button>
        </div>

        <!-- Selector -->
        <select
          v-if="viewMode === 'week'"
          v-model="selectedWeek"
          @change="fetchData"
          class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 focus:border-brand-500 focus:outline-none"
        >
          <option v-for="week in availableWeeks" :key="week.value" :value="week.value">
            Week {{ week.label }}
          </option>
        </select>

        <select
          v-else
          v-model="selectedMonth"
          @change="fetchData"
          class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 focus:border-brand-500 focus:outline-none"
        >
          <option v-for="month in availableMonths" :key="month.value" :value="month.value">
            {{ month.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Period Context Header -->
    <div class="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
      <span v-if="viewMode === 'week'">
        Viewing Week {{ selectedWeek }} ({{ formatWeekRange(selectedWeek, currentYear) }})
      </span>
      <span v-else>
        Viewing {{ getMonthName(selectedMonth) }} ({{ formatMonthRange(selectedMonth, currentYear) }})
      </span>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-sm text-gray-500 dark:text-gray-400">Loading chart data...</div>
    </div>

    <div v-else-if="!hasData" class="flex items-center justify-center py-12">
      <div class="text-sm text-gray-500 dark:text-gray-400">No data available</div>
    </div>

    <div v-else>
      <!-- Progress Bars Layout - Text Inside Bars -->
      <div class="space-y-2.5">
        <div
          v-for="sampler in samplersHours"
          :key="sampler.samplerName"
          class="flex flex-col gap-1"
        >
          <!-- Progress Bar with Text Inside -->
          <div class="relative h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            <!-- Progress Fill -->
            <div
              class="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
              :class="sampler.status === 'on-track'
                ? 'bg-green-500'
                : sampler.status === 'under-target'
                ? 'bg-blue-500'
                : 'bg-red-500'"
              :style="{ width: Math.min(sampler.percentage, 100) + '%' }"
            ></div>
            <!-- Overtime indicator (if > 100%) -->
            <div
              v-if="sampler.percentage > 100"
              class="absolute top-0 right-0 h-full bg-red-600 opacity-30 animate-pulse"
              :style="{ width: Math.min((sampler.percentage - 100), 100) + '%' }"
            ></div>

            <!-- Text Content - Adaptive colors for light/dark mode -->
            <div class="absolute inset-0 flex items-center justify-between px-3">
              <!-- Left side: Name and Badge -->
              <div class="flex items-center gap-2">
                <span
                  class="font-semibold text-xs"
                  :class="sampler.percentage > 50 || sampler.status === 'overtime'
                    ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]'
                    : 'text-gray-800 dark:text-gray-200'"
                >
                  {{ sampler.samplerName }}
                </span>
                <span
                  class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  :class="sampler.has24HourRestriction
                    ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-blue-200 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300'"
                >
                  {{ sampler.has24HourRestriction ? '24h' : 'Std' }}
                </span>
              </div>

              <!-- Right side: Hours and Percentage -->
              <div class="flex items-center gap-2">
                <span
                  class="text-xs font-semibold"
                  :class="sampler.percentage > 50 || sampler.status === 'overtime'
                    ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]'
                    : 'text-gray-800 dark:text-gray-200'"
                >
                  {{ sampler.totalHours.toFixed(1) }}h
                </span>
                <span
                  class="text-[10px]"
                  :class="sampler.percentage > 50 || sampler.status === 'overtime'
                    ? 'text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]'
                    : 'text-gray-600 dark:text-gray-300'"
                >
                  / {{ sampler.targetHours }}h
                </span>
                <span
                  class="text-xs font-bold px-2 py-0.5 rounded"
                  :class="sampler.percentage > 50 || sampler.status === 'overtime'
                    ? 'bg-white/20 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]'
                    : sampler.status === 'on-track'
                    ? 'text-green-700 dark:text-green-400'
                    : sampler.status === 'under-target'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-red-700 dark:text-red-400'"
                >
                  {{ sampler.percentage }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Breakdown - Only show if there's actual breakdown -->
          <div
            v-if="sampler.breakdown.officeSampling > 0 || sampler.breakdown.lineSampling > 0 || sampler.breakdown.molekulisLoading > 0 || sampler.breakdown.otherJobs > 0"
            class="flex flex-wrap gap-2 text-[10px] text-gray-600 dark:text-gray-400 ml-1"
          >
            <div v-if="sampler.breakdown.officeSampling > 0">
              <span class="font-medium">Ofc:</span> {{ sampler.breakdown.officeSampling.toFixed(1) }}h
            </div>
            <div v-if="sampler.breakdown.lineSampling > 0">
              <span class="font-medium">Line:</span> {{ sampler.breakdown.lineSampling.toFixed(1) }}h
            </div>
            <div v-if="sampler.breakdown.molekulisLoading > 0">
              <span class="font-medium">Mol:</span> {{ sampler.breakdown.molekulisLoading.toFixed(1) }}h
            </div>
            <div v-if="sampler.breakdown.otherJobs > 0">
              <span class="font-medium">Oth:</span> {{ sampler.breakdown.otherJobs.toFixed(1) }}h
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="pt-2 mt-3 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Total: {{ samplersHours.length }} | Avg: {{
              (samplersHours.reduce((sum, s) => sum + s.percentage, 0) / samplersHours.length).toFixed(1)
            }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getSamplersHoursSummary, getSamplersMonthSummary, type SamplerHours } from '../../services/shipNominationService'

const samplersHours = ref<SamplerHours[]>([])
const loading = ref(true)
const isFetching = ref(false)
const selectedWeek = ref<number>(0)
const selectedMonth = ref<number>(new Date().getMonth() + 1)
const targetHours = ref<number>(38)
const viewMode = ref<'week' | 'month'>('week')

const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentWeek = getWeekNumber(currentDate)
const currentMonth = currentDate.getMonth() + 1

// Available weeks (1-53)
const availableWeeks = Array.from({ length: 53 }, (_, i) => ({
  value: i + 1,
  label: i + 1
}))

// Available months
const availableMonths = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const hasData = computed(() => samplersHours.value.length > 0)

const fetchData = async () => {
  // Prevent concurrent requests
  if (isFetching.value) return

  try {
    isFetching.value = true
    loading.value = true
    let response

    if (viewMode.value === 'week') {
      response = await getSamplersHoursSummary(
        selectedWeek.value || undefined,
        undefined,
        targetHours.value
      )
    } else {
      response = await getSamplersMonthSummary(
        selectedMonth.value,
        undefined,
        targetHours.value
      )
    }

    if (response.success && response.data) {
      samplersHours.value = response.data
    }
  } catch (err: any) {
    console.error('Error fetching samplers hours:', err)
  } finally {
    loading.value = false
    isFetching.value = false
  }
}

const handleWeekChange = () => {
  viewMode.value = 'week'
  fetchData()
}

const handleMonthChange = () => {
  viewMode.value = 'month'
  fetchData()
}

const getMonthName = (monthNumber: number) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[monthNumber - 1] || ''
}

const formatWeekRange = (weekNumber: number, year: number) => {
  const startDate = getStartOfWeek(year, weekNumber)
  const endDate = getEndOfWeek(year, weekNumber)

  const startDay = getDayShortName(startDate)
  const endDay = getDayShortName(endDate)
  const startMonth = getMonthShortName(startDate)
  const endMonth = getMonthShortName(endDate)
  const startDayNum = startDate.getDate()
  const endDayNum = endDate.getDate()

  // If same month, show: Mon, Nov 10 - Sun, Nov 16
  // If different months, show: Mon, Nov 30 - Sun, Dec 6
  return `${startDay}, ${startMonth} ${startDayNum} - ${endDay}, ${endMonth} ${endDayNum}`
}

const formatMonthRange = (monthNumber: number, year: number) => {
  const startDate = new Date(year, monthNumber - 1, 1)
  const endDate = new Date(year, monthNumber, 0) // Last day of month

  const startMonth = getMonthShortName(startDate)
  const endMonth = getMonthShortName(endDate)
  const startDayNum = startDate.getDate()
  const endDayNum = endDate.getDate()

  // If same month, show: Dec 1 - Dec 31
  return `${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}`
}

const getDayShortName = (date: Date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getDay()]
}

const getMonthShortName = (date: Date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[date.getMonth()]
}

// Helper function from backend - get start of week
const getStartOfWeek = (year: number, week: number) => {
  const jan1 = new Date(year, 0, 1)
  const jan1Day = jan1.getDay()
  const jan1Monday = jan1Day === 0 ? -6 : 1 - jan1Day
  const firstMonday = new Date(year, 0, 1 + jan1Monday)

  const monday = new Date(firstMonday)
  monday.setDate(firstMonday.getDate() + (week - 1) * 7)
  monday.setHours(0, 0, 0, 0)

  return monday
}

// Helper function from backend - get end of week
const getEndOfWeek = (year: number, week: number) => {
  const startOfWeek = getStartOfWeek(year, week)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  return endOfWeek
}

function getWeekNumber(date: Date): number {
  const d = new Date(date)

  // Get the Monday of the week containing this date
  const day = d.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  const monday = new Date(d)
  monday.setDate(d.getDate() - daysFromMonday)
  monday.setHours(0, 0, 0, 0)

  // Get the first Monday of the year
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const jan1Day = jan1.getDay()
  const jan1Monday = new Date(jan1)
  if (jan1Day === 0) {
    // Jan 1 is Sunday, first Monday is Jan 8
    jan1Monday.setDate(jan1.getDate() + 6)
  } else {
    // Jan 1 is Mon-Sat, first Monday is before Jan 1
    jan1Monday.setDate(1 - (jan1Day - 1))
  }
  jan1Monday.setHours(0, 0, 0, 0)

  // Calculate the week number
  const diffTime = monday.getTime() - jan1Monday.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7) + 1
}

onMounted(() => {
  selectedWeek.value = currentWeek
  selectedMonth.value = currentMonth
  fetchData()
})
</script>
