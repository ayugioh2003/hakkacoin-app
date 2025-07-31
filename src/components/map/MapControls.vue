<script setup lang="ts">
import { useMapStore } from '@/stores/mapStore'

const mapStore = useMapStore()

// Emit events
const emit = defineEmits<{
  zoomIn: []
  zoomOut: []
  reset: []
  locate: []
}>()

function handleReset() {
  mapStore.resetMapView()
  emit('reset')
}
</script>

<template>
  <div class="map-controls absolute top-4 right-4 z-10 flex flex-col gap-2">
    <!-- Reset view button -->
    <button
      @click="handleReset"
      class="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
      title="重置地圖視角"
    >
      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z M12 7v5l3 3" />
      </svg>
    </button>

    <!-- My location button -->
    <button
      @click="emit('locate')"
      class="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
      title="定位到我的位置"
    >
      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.map-controls button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>