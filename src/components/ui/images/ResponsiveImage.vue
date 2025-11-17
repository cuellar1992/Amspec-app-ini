<script setup>
import image01 from '@/assets/images/grid-image/image-01.png'
</script>

<template>
  <div class="relative">
    <div id="pane" class="overflow-hidden">
      <img
        :src="image01"
        alt="Cover"
        class="w-full border border-gray-200 rounded-xl dark:border-gray-800"
      />
    </div>
    <div id="ghostpane" class="absolute top-0 left-0 duration-300 ease-in-out"></div>
  </div>
</template>
