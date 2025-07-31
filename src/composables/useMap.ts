import { ref, computed, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import L from 'leaflet'
import { useMapStore } from '@/stores/mapStore'
import type { Business } from '@/types'

export interface UseMapOptions {
  center?: [number, number]
  zoom?: number
  minZoom?: number
  maxZoom?: number
}

export function useMap(
  container: Ref<HTMLElement | undefined>,
  options: UseMapOptions = {}
) {
  const mapStore = useMapStore()
  
  // Local state
  const map = ref<L.Map | null>(null)
  const isReady = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const currentCenter = computed(() => {
    if (!map.value) return null
    const center = map.value.getCenter()
    return [center.lat, center.lng] as [number, number]
  })

  const currentZoom = computed(() => {
    return map.value?.getZoom() ?? null
  })

  const currentBounds = computed(() => {
    if (!map.value) return null
    const bounds = map.value.getBounds()
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    }
  })

  // Methods
  function initialize() {
    if (!container.value) {
      error.value = 'Map container not found'
      return
    }

    try {
      // Create map
      map.value = L.map(container.value, {
        center: options.center ?? mapStore.mapCenter,
        zoom: options.zoom ?? mapStore.mapZoom,
        minZoom: options.minZoom ?? 7,
        maxZoom: options.maxZoom ?? 19,
        zoomControl: false // We'll add custom controls
      })

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map.value as L.Map)

      // Add zoom control to top-right
      L.control.zoom({
        position: 'topright'
      }).addTo(map.value as L.Map)

      // Add scale control
      L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: false
      }).addTo(map.value as L.Map)

      // Store in global store
      mapStore.setMap(map.value as L.Map)

      // Update store on map events
      map.value.on('moveend', () => {
        if (!map.value) return
        const center = map.value.getCenter()
        const zoom = map.value.getZoom()
        mapStore.updateMapView([center.lat, center.lng], zoom)
      })

      isReady.value = true
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize map'
      console.error('Map initialization error:', err)
    }
  }

  function destroy() {
    if (map.value) {
      map.value.remove()
      map.value = null
      isReady.value = false
    }
  }

  function setView(center: [number, number], zoom?: number) {
    if (!map.value) return
    map.value.setView(center, zoom ?? map.value.getZoom())
  }

  function fitBounds(bounds: L.LatLngBoundsExpression, options?: L.FitBoundsOptions) {
    if (!map.value) return
    map.value.fitBounds(bounds, options)
  }

  function panTo(center: [number, number]) {
    if (!map.value) return
    map.value.panTo(center)
  }

  function zoomIn() {
    if (!map.value) return
    map.value.zoomIn()
  }

  function zoomOut() {
    if (!map.value) return
    map.value.zoomOut()
  }

  function invalidateSize() {
    if (!map.value) return
    map.value.invalidateSize()
  }

  function addMarker(
    position: [number, number],
    options?: L.MarkerOptions
  ): L.Marker | null {
    if (!map.value) return null
    return L.marker(position, options).addTo(map.value as L.Map)
  }

  function removeMarker(marker: L.Marker) {
    if (!map.value) return
    marker.remove()
  }

  function addPopup(
    position: [number, number],
    content: string,
    options?: L.PopupOptions
  ): L.Popup | null {
    if (!map.value) return null
    return L.popup(options)
      .setLatLng(position)
      .setContent(content)
      .openOn(map.value as L.Map)
  }

  // Cleanup
  onUnmounted(() => {
    destroy()
  })

  return {
    // State
    map: computed(() => map.value),
    isReady,
    error,
    
    // Computed
    currentCenter,
    currentZoom,
    currentBounds,
    
    // Methods
    initialize,
    destroy,
    setView,
    fitBounds,
    panTo,
    zoomIn,
    zoomOut,
    invalidateSize,
    addMarker,
    removeMarker,
    addPopup
  }
}