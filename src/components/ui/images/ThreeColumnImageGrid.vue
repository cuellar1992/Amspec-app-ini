<script setup>
import image01 from '@/assets/images/grid-image/image-01.png'
import image02 from '@/assets/images/grid-image/image-02.png'
import image03 from '@/assets/images/grid-image/image-03.png'

const images = [
  { src: image01, alt: 'Grid image 1' },
  { src: image02, alt: 'Grid image 2' },
  { src: image03, alt: 'Grid image 3' },
]
</script>

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
