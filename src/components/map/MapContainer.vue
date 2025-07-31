<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMapStore } from '@/stores/mapStore'
import { TAIWAN_CENTER, DEFAULT_ZOOM } from '@/utils/mapHelpers'
import type { Business } from '@/types'

// Props
interface Props {
  businesses?: Business[]
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  businesses: () => [],
  height: '600px'
})

// Emits
const emit = defineEmits<{
  mapReady: []
  markerClick: [business: Business]
}>()

// Store
const mapStore = useMapStore()

// Refs
const mapContainer = ref<HTMLDivElement>()
const map = ref<L.Map | null>(null)
const markers = ref<L.Marker[]>([])

// Initialize map
function initializeMap() {
  if (!mapContainer.value) return

  // Create map instance
  map.value = L.map(mapContainer.value, {
    center: TAIWAN_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: true,
    attributionControl: true
  })

  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    minZoom: 7
  }).addTo(map.value as L.Map)

  // Store map instance
  mapStore.setMap(map.value as L.Map)

  // Emit ready event
  emit('mapReady')

  console.log('✅ Map initialized')
}

// Clean up markers
function clearMarkers() {
  markers.value.forEach(marker => {
    marker.remove()
  })
  markers.value = []
}

// Handle resize
function handleResize() {
  if (map.value) {
    map.value.invalidateSize()
  }
}

// Lifecycle
onMounted(() => {
  initializeMap()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearMarkers()
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})

// Watch for business changes (will implement in Day 4)
watch(() => props.businesses, (newBusinesses) => {
  // TODO: Update markers when businesses change
  console.log(`Business data updated: ${newBusinesses.length} items`)
})
</script>

<template>
  <div class="map-container relative w-full" :style="{ height }">
    <div ref="mapContainer" class="absolute inset-0 z-0"></div>
    
    <!-- Loading overlay -->
    <div v-if="mapStore.isLoading" 
         class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
      <div class="text-center">
        <div class="inline-flex items-center px-4 py-2 bg-white rounded-lg shadow">
          <svg class="animate-spin h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-gray-700">載入地圖中...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

/* Fix Leaflet icon paths */
:deep(.leaflet-default-icon-path) {
  background-image: url(https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png);
}
</style>