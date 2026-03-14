import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Map } from 'leaflet'
import type { Business, BusinessData, MapState } from '@/types'
import { parseBusinessData, validateBusinessData } from '@/utils/dataParser'
import { TAIWAN_CENTER, DEFAULT_ZOOM } from '@/utils/mapHelpers'
import businessDataWithCoords from '@/assets/hakkacoin-maps-with-coordinates.json'

export const useMapStore = defineStore('map', () => {
  // State
  const map = ref<Map | null>(null)
  const businesses = ref<Business[]>([])
  const selectedBusiness = ref<Business | null>(null)
  const mapCenter = ref<[number, number]>(TAIWAN_CENTER)
  const mapZoom = ref(DEFAULT_ZOOM)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasBusinesses = computed(() => businesses.value.length > 0)
  
  const businessCount = computed(() => businesses.value.length)
  
  const selectedBusinessId = computed(() => selectedBusiness.value?.id ?? null)

  // Actions
  async function loadBusinessData() {
    isLoading.value = true
    error.value = null
    
    try {
      const data = businessDataWithCoords

      if (!validateBusinessData(data)) {
        throw new Error('Invalid business data format')
      }

      businesses.value = parseBusinessData(data as unknown as BusinessData)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error loading business data:', err)
    } finally {
      isLoading.value = false
    }
  }

  function setMap(mapInstance: Map) {
    map.value = mapInstance
  }

  function setSelectedBusiness(business: Business | null) {
    selectedBusiness.value = business
  }

  function selectBusinessById(id: number) {
    const business = businesses.value.find(b => b.id === id)
    if (business) {
      setSelectedBusiness(business)
    }
  }

  function updateMapView(center: [number, number], zoom: number) {
    mapCenter.value = center
    mapZoom.value = zoom
    
    if (map.value) {
      map.value.setView(center, zoom)
    }
  }

  function resetMapView() {
    updateMapView(TAIWAN_CENTER, DEFAULT_ZOOM)
  }

  function clearSelection() {
    selectedBusiness.value = null
  }

  return {
    // State
    map,
    businesses,
    selectedBusiness,
    mapCenter,
    mapZoom,
    isLoading,
    error,
    
    // Getters
    hasBusinesses,
    businessCount,
    selectedBusinessId,
    
    // Actions
    loadBusinessData,
    setMap,
    setSelectedBusiness,
    selectBusinessById,
    updateMapView,
    resetMapView,
    clearSelection
  }
})