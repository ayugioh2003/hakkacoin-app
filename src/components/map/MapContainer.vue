<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import { useMapStore } from '@/stores/mapStore'
import { TAIWAN_CENTER, DEFAULT_ZOOM, createCustomIcon, getMarkerColorByTag, createPopupContent } from '@/utils/mapHelpers'
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
const markerClusterGroup = ref<L.MarkerClusterGroup | null>(null)

// Initialize map
function initializeMap() {
  if (!mapContainer.value) return

  // Create map instance
  map.value = L.map(mapContainer.value, {
    center: TAIWAN_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: true,
    attributionControl: true,
    preferCanvas: true,
    zoomAnimation: false, // 暫時禁用縮放動畫
    fadeAnimation: true,
    markerZoomAnimation: false // 暫時禁用標記縮放動畫
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

// Create markers for businesses
function createMarkers(businesses: Business[]) {
  if (!map.value || !markerClusterGroup.value) {
    console.warn('Map or cluster group not ready')
    return
  }

  // Clear existing markers
  markerClusterGroup.value.clearLayers()

  let markersAdded = 0
  let skippedNoCoordinates = 0

  // Add markers for each business
  businesses.forEach(business => {
    // Skip if no coordinates (will implement geocoding later)
    if (!business.coordinates) {
      skippedNoCoordinates++
      return
    }

    const color = getMarkerColorByTag(business.tag)
    const icon = createCustomIcon(color)
    
    const marker = L.marker(business.coordinates, { icon })
    
    // Create popup content
    const popupContent = createPopupContent(business)
    marker.bindPopup(popupContent, {
      maxWidth: 350,
      className: 'custom-popup'
    })
    
    // Handle marker click
    marker.on('click', () => {
      mapStore.setSelectedBusiness(business)
      emit('markerClick', business)
    })
    
    // Add to cluster group
    markerClusterGroup.value!.addLayer(marker)
    markersAdded++
  })

  console.log(`Markers created: ${markersAdded}, Skipped (no coordinates): ${skippedNoCoordinates}`)
}

// Initialize marker cluster group
function initializeMarkerCluster() {
  if (!map.value) return

  markerClusterGroup.value = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    removeOutsideVisibleBounds: true,
    animate: false, // 禁用動畫以避免錯誤
    animateAddingMarkers: false,
    disableClusteringAtZoom: 19,
    zoomToBoundsOnClick: true,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount()
      let size = 'small'
      let className = 'marker-cluster-small'
      
      if (count > 10) {
        size = 'medium'
        className = 'marker-cluster-medium'
      }
      if (count > 50) {
        size = 'large'
        className = 'marker-cluster-large'
      }
      
      return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className: `marker-cluster ${className}`,
        iconSize: L.point(40, 40)
      })
    }
  })

  map.value.addLayer(markerClusterGroup.value as L.MarkerClusterGroup)
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
  initializeMarkerCluster()
  window.addEventListener('resize', handleResize)
  
  // Try to create markers if businesses already loaded
  if (props.businesses && props.businesses.length > 0 && markerClusterGroup.value) {
    console.log('Creating markers on mount...')
    createMarkers(props.businesses)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (markerClusterGroup.value) {
    markerClusterGroup.value.clearLayers()
  }
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})

// Watch for business changes
watch(() => props.businesses, (newBusinesses) => {
  if (newBusinesses && newBusinesses.length > 0 && markerClusterGroup.value) {
    console.log(`Attempting to create markers for ${newBusinesses.length} businesses`)
    console.log('Sample business with coordinates:', newBusinesses.find(b => b.coordinates))
    createMarkers(newBusinesses)
  }
}, { immediate: true, deep: true })
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

/* Custom marker styles */
:deep(.custom-marker) {
  background: transparent;
  border: none;
}

/* Marker cluster styles */
:deep(.marker-cluster) {
  background-clip: padding-box;
  border-radius: 50%;
  text-align: center;
  font-weight: bold;
  color: white;
}

:deep(.marker-cluster-small) {
  background-color: rgba(110, 204, 57, 0.6);
}

:deep(.marker-cluster-small div) {
  background-color: rgba(110, 204, 57, 0.6);
  width: 30px;
  height: 30px;
  margin: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.marker-cluster-medium) {
  background-color: rgba(240, 194, 12, 0.6);
}

:deep(.marker-cluster-medium div) {
  background-color: rgba(240, 194, 12, 0.6);
  width: 35px;
  height: 35px;
  margin: 2.5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.marker-cluster-large) {
  background-color: rgba(241, 128, 23, 0.6);
}

:deep(.marker-cluster-large div) {
  background-color: rgba(241, 128, 23, 0.6);
  width: 40px;
  height: 40px;
  margin: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Custom popup styles */
:deep(.custom-popup .leaflet-popup-content-wrapper) {
  border-radius: 8px;
  padding: 0;
}

:deep(.custom-popup .leaflet-popup-content) {
  margin: 0;
  min-width: 250px;
}
</style>