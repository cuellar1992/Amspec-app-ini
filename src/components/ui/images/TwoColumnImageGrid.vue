<script setup>
import image02 from '@/assets/images/grid-image/image-02.png'
import image03 from '@/assets/images/grid-image/image-03.png'
</script>

<template>
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
    <div>
      <img
        :src="image02"
        alt="grid"
        class="w-full border border-gray-200 rounded-xl dark:border-gray-800"
      />
    </div>

    <div>
      <img
        :src="image03"
        alt="grid"
        class="w-full border border-gray-200 rounded-xl dark:border-gray-800"
      />
    </div>
  </div>
</template>
