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
  highlightedBusinessIds?: Set<string>
}

const props = withDefaults(defineProps<Props>(), {
  businesses: () => [],
  height: '600px',
  highlightedBusinessIds: () => new Set<string>()
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
const mapError = ref<string | null>(null)
const isMapReady = ref(false)
const markersMap = ref<Map<string, L.Marker>>(new Map())

// Initialize map
function initializeMap() {
  if (!mapContainer.value) return

  try {
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
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 7,
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    })

    // Handle tile layer errors
    tileLayer.on('tileerror', (error) => {
      console.error('Tile loading error:', error)
      mapError.value = '地圖圖層載入失敗，請檢查網路連線'
    })

    tileLayer.addTo(map.value as L.Map)

    // Store map instance
    mapStore.setMap(map.value as L.Map)

    // Add map event listeners with debounce
    let moveTimeout: number | null = null
    map.value.on('moveend', () => {
      if (moveTimeout) clearTimeout(moveTimeout)
      moveTimeout = window.setTimeout(() => {
        const center = map.value!.getCenter()
        const zoom = map.value!.getZoom()
        mapStore.updateMapView([center.lat, center.lng], zoom)
      }, 300)
    })

    // Map is ready
    isMapReady.value = true
    emit('mapReady')

    console.log('✅ Map initialized')
  } catch (error) {
    console.error('Map initialization error:', error)
    mapError.value = '地圖初始化失敗，請重新整理頁面'
    isMapReady.value = false
  }
}

// Create markers for businesses
function createMarkers(businesses: Business[]) {
  if (!map.value || !markerClusterGroup.value) {
    console.warn('Map or cluster group not ready')
    return
  }

  // Clear existing markers
  markerClusterGroup.value.clearLayers()
  markersMap.value.clear()

  let markersAdded = 0
  let skippedNoCoordinates = 0

  // Add markers for each business
  businesses.forEach(business => {
    // Skip if no coordinates (will implement geocoding later)
    if (!business.coordinates) {
      skippedNoCoordinates++
      return
    }

    const isHighlighted = props.highlightedBusinessIds.has(business.id)
    const color = isHighlighted ? 'highlight' : getMarkerColorByTag(business.tag)
    const icon = createCustomIcon(color)
    
    const marker = L.marker(business.coordinates, { 
      icon,
      zIndexOffset: isHighlighted ? 1000 : 0 // 高亮的標記顯示在最上層
    })
    
    // Create popup content
    const popupContent = createPopupContent(business)
    marker.bindPopup(popupContent, {
      maxWidth: 350,
      className: 'custom-popup',
      autoPan: true,
      autoPanPadding: L.point(20, 20)
    })
    
    // Handle marker click
    marker.on('click', () => {
      mapStore.setSelectedBusiness(business)
      emit('markerClick', business)
      // On mobile, close the Leaflet popup — the bottom sheet handles it
      if (window.innerWidth < 768) {
        marker.closePopup()
      }
    })
    
    // Add to cluster group
    markerClusterGroup.value!.addLayer(marker)
    
    // Store marker reference
    markersMap.value.set(business.id, marker)
    
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
    chunkedLoading: true, // 分塊載入以提升效能
    chunkInterval: 200, // 載入間隔時間
    chunkDelay: 50, // 每塊之間的延遲
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

// Handle resize with debounce
let resizeTimeout: number | null = null
function handleResize() {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  
  resizeTimeout = window.setTimeout(() => {
    if (map.value) {
      map.value.invalidateSize()
      console.log('Map resized')
    }
  }, 300)
}

// Retry map load
function retryMapLoad() {
  mapError.value = null
  isMapReady.value = false
  
  // Clean up existing map
  if (map.value) {
    map.value.remove()
    map.value = null
  }
  
  // Retry initialization
  setTimeout(() => {
    initializeMap()
    initializeMarkerCluster()
  }, 100)
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

// Watch for highlighted businesses changes
watch(() => props.highlightedBusinessIds, (newHighlights) => {
  if (!markerClusterGroup.value) return
  
  // Update marker icons without recreating all markers
  markersMap.value.forEach((marker, businessId) => {
    const business = props.businesses.find(b => b.id === businessId)
    if (business) {
      const isHighlighted = newHighlights.has(businessId)
      const color = isHighlighted ? 'highlight' : getMarkerColorByTag(business.tag)
      const icon = createCustomIcon(color)
      marker.setIcon(icon)
      marker.setZIndexOffset(isHighlighted ? 1000 : 0)
    }
  })
}, { deep: true })

// Watch for selected business from search
watch(() => mapStore.selectedBusiness, (business) => {
  if (business && business.coordinates && map.value && markerClusterGroup.value) {
    const marker = markersMap.value.get(business.id)
    if (marker) {
      // First, we need to ensure the marker is visible (not in a cluster)
      // Zoom in enough to show individual markers
      map.value.setView(business.coordinates, 18, {
        animate: true,
        duration: 0.5
      })
      
      // Wait for zoom animation to complete and clusters to update
      setTimeout(() => {
        // Check if marker is still clustered
        const parent = markerClusterGroup.value!.getVisibleParent(marker)
        
        if (parent === marker) {
          // Marker is visible, open popup
          marker.openPopup()
        } else {
          // Marker is still in a cluster, zoom in more
          map.value!.setView(business.coordinates, 19, {
            animate: true,
            duration: 0.3
          })
          
          // Try again after zoom
          setTimeout(() => {
            marker.openPopup()
          }, 400)
        }
      }, 600)
    }
  }
})
</script>

<template>
  <div class="map-container relative w-full map-height">
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
    
    <!-- Error overlay -->
    <div v-if="mapError" 
         class="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10">
      <div class="text-center max-w-md px-4">
        <svg class="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">地圖載入錯誤</h3>
        <p class="text-gray-600 mb-4">{{ mapError }}</p>
        <button @click="retryMapLoad" 
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          重試載入
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  border-radius: 0.5rem;
  overflow: visible;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

:deep(.leaflet-container) {
  border-radius: 0.5rem;
  overflow: hidden;
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
  overflow: hidden;
}

:deep(.custom-popup .leaflet-popup-content) {
  margin: 0;
  padding: 0;
  max-width: min(350px, calc(100vw - 80px));
}

/* Custom close button styles */
:deep(.custom-popup .leaflet-popup-close-button) {
  width: 32px !important;
  height: 32px !important;
  font-size: 24px !important;
  line-height: 30px !important;
  color: #fff !important;
  background-color: rgba(0, 0, 0, 0.7) !important;
  border-radius: 50% !important;
  opacity: 1 !important;
  top: 8px !important;
  right: 8px !important;
  font-weight: normal !important;
  text-align: center !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}

:deep(.custom-popup .leaflet-popup-close-button:hover) {
  background-color: rgba(0, 0, 0, 0.9) !important;
  transform: scale(1.1) !important;
}

/* Highlight marker animation */
:deep(.highlight-marker) {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .7;
  }
}
</style>