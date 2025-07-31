<script setup lang="ts">
import { computed } from 'vue'
import { useMapStore } from '@/stores/mapStore'
import { useFilterStore } from '@/stores/filterStore'

const mapStore = useMapStore()
const filterStore = useFilterStore()

// Props
interface Props {
  isFilterPanelOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isFilterPanelOpen: false
})

// Computed
const controlsPosition = computed(() => {
  return props.isFilterPanelOpen ? 'left-4' : 'right-4'
})

// Emit events
const emit = defineEmits<{
  zoomIn: []
  zoomOut: []
  reset: []
  locate: []
}>()

function handleZoomIn() {
  if (mapStore.map) {
    mapStore.map.zoomIn()
  }
  emit('zoomIn')
}

function handleZoomOut() {
  if (mapStore.map) {
    mapStore.map.zoomOut()
  }
  emit('zoomOut')
}

function handleReset() {
  mapStore.resetMapView()
  emit('reset')
}

function handleLocate() {
  if (mapStore.map && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        mapStore.updateMapView([latitude, longitude], 15)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('無法取得您的位置，請確認已開啟定位權限')
      }
    )
  }
  emit('locate')
}
</script>

<template>
  <div 
    class="map-controls absolute top-4 z-10 flex flex-col gap-2 transition-all duration-300"
    :class="controlsPosition"
  >
    <!-- Zoom controls -->
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Zoom in -->
      <button
        @click="handleZoomIn"
        class="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors border-b border-gray-200"
        title="放大"
        aria-label="放大地圖"
      >
        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      
      <!-- Zoom out -->
      <button
        @click="handleZoomOut"
        class="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
        title="縮小"
        aria-label="縮小地圖"
      >
        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>
    </div>

    <!-- Reset view button -->
    <button
      @click="handleReset"
      class="bg-white rounded-lg shadow-md w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
      title="重置地圖視角"
      aria-label="重置地圖視角"
    >
      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>

    <!-- My location button -->
    <button
      @click="handleLocate"
      class="bg-white rounded-lg shadow-md w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
      title="定位到我的位置"
      aria-label="定位到我的位置"
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
/* Styles are now handled by Tailwind classes */
</style>