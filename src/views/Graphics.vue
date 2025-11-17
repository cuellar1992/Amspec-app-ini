<template>
  <AdminLayout>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 space-y-6 xl:col-span-6">
        <ships-by-year />
        <ships-by-month />
      </div>

      <div class="col-span-12 xl:col-span-6">
        <samplers-hours />
      </div>

      <div class="col-span-12 xl:col-span-6">
        <ships-by-terminal />
      </div>

      <div class="col-span-12 xl:col-span-6">
        <top-clients />
      </div>

    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from '../components/layout/AdminLayout.vue'
import ShipsByYear from '../components/graphics/ShipsByYear.vue'
import ShipsByMonth from '../components/graphics/ShipsByMonth.vue'
import ShipsByTerminal from '../components/graphics/ShipsByTerminal.vue'
import TopClients from '../components/graphics/TopClients.vue'
import SamplersHours from '../components/graphics/SamplersHours.vue'

// Define component name for ESLint compliance
defineOptions({
  name: 'GraphicsDashboard'
})
</script>
