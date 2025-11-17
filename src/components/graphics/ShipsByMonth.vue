<template>
  <div
    class="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
        Vessels by Month
      </h3>

      <div class="flex items-center gap-3">
        <!-- Year Selector -->
        <select
          v-model="selectedYear"
          @change="fetchData"
          class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 focus:border-brand-500 focus:outline-none"
        >
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <div id="chartOne" class="-ml-5 min-w-[650px] xl:min-w-full pl-2">
        <VueApexCharts type="bar" height="180" :options="chartOptions" :series="series" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import {
  getShipsByMonthAndTerminal,
  getAvailableYears,
  type ShipsByMonth
} from '../../services/shipNominationService'

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const monthsData = ref<ShipsByMonth[]>([])
const availableYears = ref<number[]>([])
const loading = ref(true)
const loadingYears = ref(true)

const series = computed(() => [
  {
    name: 'Vessels',
    data: monthsData.value.map((month) => month.count),
  },
])

const chartOptions = ref({
  colors: ['#465fff'],
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'bar' as const,
    toolbar: {
      show: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '39%',
      borderRadius: 5,
      borderRadiusApplication: 'end' as const,
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 4,
    colors: ['transparent'],
  },
  xaxis: {
    categories: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  legend: {
    show: true,
    position: 'top' as const,
    horizontalAlign: 'left' as const,
    fontFamily: 'Outfit',
    markers: {
      size: 5,
    },
  },
  yaxis: {
    title: {
      text: undefined,
    },
  },
  grid: {
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  fill: {
    opacity: 1,
  },
  tooltip: {
    x: {
      show: true,
    },
    y: {
      formatter: function (val: number) {
        return String(val)
      },
    },
  },
})

const fetchYears = async () => {
  try {
    loadingYears.value = true
    const response = await getAvailableYears()

    if (response.success && response.data) {
      availableYears.value = response.data

      // If current year is not in the list, add it
      if (!availableYears.value.includes(currentYear)) {
        availableYears.value.unshift(currentYear)
      }
    }
  } catch (error) {
    console.error('Error fetching available years:', error)
    // Fallback to current year if fetch fails
    availableYears.value = [currentYear]
  } finally {
    loadingYears.value = false
  }
}

const fetchData = async () => {
  try {
    loading.value = true
    const response = await getShipsByMonthAndTerminal(selectedYear.value)

    if (response.success && response.data) {
      monthsData.value = response.data
    }
  } catch (error) {
    console.error('Error fetching ships by month:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchYears()
  fetchData()
})
</script>
