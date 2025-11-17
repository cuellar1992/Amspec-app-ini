<template>
  <div
    class="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] md:p-6 xl:col-span-6"
  >
    <div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h4 class="text-lg font-bold text-gray-800 dark:text-white/90">
          Top Clients
        </h4>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Top clients by ship nominations
        </p>
      </div>

      <div class="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
        <button
          v-for="option in periodOptions"
          :key="option.value"
          @click="handlePeriodChange(option.value)"
          :class="[
            selectedPeriod === option.value
              ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800'
              : 'text-gray-500 dark:text-gray-400',
            'px-3 py-2 font-medium rounded-md text-sm hover:text-gray-900 hover:shadow-theme-xs dark:hover:bg-gray-800 dark:hover:text-white transition-colors',
          ]"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-sm text-gray-500 dark:text-gray-400">Loading chart data...</div>
    </div>

    <div v-else-if="!hasData" class="flex items-center justify-center py-12">
      <div class="text-sm text-gray-500 dark:text-gray-400">No data available</div>
    </div>

    <div v-else>
      <apexchart
        type="bar"
        height="350"
        :options="chartOptions"
        :series="chartSeries"
      ></apexchart>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getTopClients, type TopClient } from '../../services/shipNominationService'

const periodOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
]

const topClients = ref<TopClient[]>([])
const loading = ref(true)
const selectedPeriod = ref<'monthly' | 'yearly' | 'all'>('all')

const hasData = computed(() => topClients.value.length > 0)

const chartSeries = computed(() => [
  {
    name: 'Nominations',
    data: topClients.value.map((item) => item.totalNominations),
    marker: {
      show: false,
    },
  },
])

const chartOptions = computed(() => ({
  chart: {
    type: 'bar' as const,
    height: 350,
    toolbar: {
      show: false,
    },
    fontFamily: 'Inter, sans-serif',
  },
  plotOptions: {
    bar: {
      borderRadius: 8,
      horizontal: true,
      distributed: false,
      barHeight: '40%',
      dataLabels: {
        position: 'top',
      },
    },
  },
  colors: ['#3b82f6'],
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 1,
    colors: ['transparent'],
  },
  xaxis: {
    categories: topClients.value.map((item) => item.clientName),
    labels: {
      style: {
        colors: '#9ca3af',
        fontSize: '12px',
      },
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: '#9ca3af',
        fontSize: '12px',
        fontWeight: 500,
      },
      maxWidth: 150,
    },
  },
  grid: {
    borderColor: '#e5e7eb',
    strokeDashArray: 5,
    xaxis: {
      lines: {
        show: true,
      },
    },
    yaxis: {
      lines: {
        show: false,
      },
    },
  },
  fill: {
    opacity: 1,
  },
  legend: {
    show: false,
  },
  responsive: [
    {
      breakpoint: 768,
      options: {
        plotOptions: {
          bar: {
            barHeight: '60%',
          },
        },
        yaxis: {
          labels: {
            maxWidth: 100,
          },
        },
      },
    },
  ],
}))

const fetchTopClients = async () => {
  try {
    loading.value = true
    const response = await getTopClients(10, selectedPeriod.value)

    if (response.success && response.data) {
      topClients.value = response.data
    }
  } catch (err: any) {
    console.error('Error fetching top clients:', err)
  } finally {
    loading.value = false
  }
}

const changePeriod = (period: 'monthly' | 'yearly' | 'all') => {
  selectedPeriod.value = period
  fetchTopClients()
}

// Type guard para validar el período
const isValidPeriod = (value: string): value is 'monthly' | 'yearly' | 'all' => {
  return ['monthly', 'yearly', 'all'].includes(value)
}

const handlePeriodChange = (value: string) => {
  if (isValidPeriod(value)) {
    changePeriod(value)
  }
}

onMounted(() => {
  fetchTopClients()
})
</script>
