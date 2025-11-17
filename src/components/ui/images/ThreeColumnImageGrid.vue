<template>
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
    <div v-for="(image, index) in images" :key="index">
      <img
        :src="image.src"
        :alt="image.alt"
        class="w-full border border-gray-200 rounded-xl dark:border-gray-800"
      />
    </div>
  </div>
</template>

<script setup>
const images = [
  { src: '/images/grid-image/image-01.png', alt: 'Grid image 1' },
  { src: '/images/grid-image/image-02.png', alt: 'Grid image 2' },
  { src: '/images/grid-image/image-03.png', alt: 'Grid image 3' },
]
</script>
