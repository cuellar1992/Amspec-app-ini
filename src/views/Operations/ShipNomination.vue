<template>
  <AdminLayout>
    <PageBreadcrumb pageTitle="Ship Nomination" />

    <div class="mt-4">
      <ComponentCard
        title="New Ship Nomination"
        description="Create a new ship nomination request"
      >
        <div class="p-6">
          <ShipNominationForm />
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import ShipNominationForm from '@/components/operations/ShipNominationForm.vue'
</script>
