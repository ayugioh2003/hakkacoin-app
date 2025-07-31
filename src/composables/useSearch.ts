import { ref, computed, watch } from 'vue'
import { useSearchStore } from '@/stores/searchStore'
import { useMapStore } from '@/stores/mapStore'
import { useBusinesses } from '@/composables/useBusinesses'
import type { Business, SearchResult } from '@/types'
import L from 'leaflet'

export function useSearch() {
  const searchStore = useSearchStore()
  const mapStore = useMapStore()
  const { businesses } = useBusinesses()
  
  // Local state
  const highlightedBusinessIds = ref<Set<string>>(new Set())
  
  // Computed
  const searchQuery = computed(() => searchStore.query)
  const searchResults = computed(() => searchStore.searchResults)
  const isSearching = computed(() => searchStore.isSearching)
  const hasResults = computed(() => searchStore.hasResults)
  const resultCount = computed(() => searchStore.resultCount)
  
  // Get businesses from search results
  const resultBusinesses = computed(() => {
    return searchStore.getBusinessesFromResults()
  })
  
  // Methods
  function performSearch(query: string) {
    searchStore.performSearch(query, businesses.value)
    updateHighlightedBusinesses()
  }
  
  function clearSearch() {
    searchStore.clearSearch()
    clearHighlights()
  }
  
  function selectBusiness(business: Business) {
    searchStore.selectBusiness(business)
    
    // Set the selected business - the map component will handle the rest
    if (business.coordinates) {
      mapStore.setSelectedBusiness(business)
    }
  }
  
  function highlightSearchResults(results: SearchResult[]) {
    // Clear previous highlights
    clearHighlights()
    
    // Add new highlights
    results.forEach(result => {
      highlightedBusinessIds.value.add(result.item.id)
    })
    
    // Update map markers
    updateMapMarkers()
  }
  
  function clearHighlights() {
    highlightedBusinessIds.value.clear()
    updateMapMarkers()
  }
  
  function updateHighlightedBusinesses() {
    if (searchResults.value.length > 0) {
      highlightSearchResults(searchResults.value)
    } else {
      clearHighlights()
    }
  }
  
  function updateMapMarkers() {
    // Map markers are now updated through reactive props
  }
  
  function focusOnResults() {
    if (resultBusinesses.value.length === 0) return
    
    const map = mapStore.map
    if (!map) return
    
    // Get all coordinates from results
    const coordinates = resultBusinesses.value
      .filter(b => b.coordinates)
      .map(b => b.coordinates!)
    
    if (coordinates.length === 0) return
    
    // Create bounds that include all results
    const bounds = L.latLngBounds(coordinates)
    
    // Fit map to bounds with padding
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 15
    })
  }
  
  // Watch for search results changes
  watch(searchResults, () => {
    updateHighlightedBusinesses()
  })
  
  // Initialize search engine when businesses are loaded
  watch(businesses, (newBusinesses) => {
    if (newBusinesses && newBusinesses.length > 0 && !searchStore.searchEngine) {
      searchStore.initializeSearchEngine(newBusinesses)
    }
  }, { immediate: true })
  
  return {
    // State
    searchQuery,
    searchResults,
    isSearching,
    hasResults,
    resultCount,
    resultBusinesses,
    highlightedBusinessIds,
    
    // Methods
    performSearch,
    clearSearch,
    selectBusiness,
    highlightSearchResults,
    clearHighlights,
    focusOnResults
  }
}