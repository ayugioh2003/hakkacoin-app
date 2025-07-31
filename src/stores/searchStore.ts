import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Business, SearchResult } from '@/types'
import { createSearchEngine, performSearch, createSearchSuggestions } from '@/utils/searchHelpers'
import type Fuse from 'fuse.js'

export const useSearchStore = defineStore('search', () => {
  // State
  const query = ref('')
  const searchResults = ref<SearchResult[]>([])
  const searchHistory = ref<string[]>([])
  const isSearching = ref(false)
  const searchEngine = ref<Fuse<Business> | null>(null)
  const showSuggestions = ref(false)
  const suggestions = ref<string[]>([])

  // Constants
  const MAX_HISTORY_ITEMS = 10
  const MAX_SUGGESTIONS = 5

  // Getters
  const hasResults = computed(() => searchResults.value.length > 0)
  
  const resultCount = computed(() => searchResults.value.length)
  
  const hasQuery = computed(() => query.value.trim().length > 0)
  
  const recentSearches = computed(() => searchHistory.value.slice(0, 5))

  // Actions
  function initializeSearchEngine(businesses: Business[]) {
    searchEngine.value = createSearchEngine(businesses)
  }

  function search(searchQuery?: string) {
    const finalQuery = searchQuery ?? query.value
    
    if (!finalQuery.trim() || !searchEngine.value) {
      clearResults()
      return
    }

    isSearching.value = true
    
    try {
      const results = performSearch(searchEngine.value, finalQuery)
      searchResults.value = results
      
      // Add to history if not already present
      if (!searchHistory.value.includes(finalQuery)) {
        searchHistory.value.unshift(finalQuery)
        if (searchHistory.value.length > MAX_HISTORY_ITEMS) {
          searchHistory.value.pop()
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  function updateQuery(newQuery: string, businesses: Business[]) {
    query.value = newQuery
    
    // Generate suggestions
    if (newQuery.length >= 2 && businesses.length > 0) {
      suggestions.value = createSearchSuggestions(businesses, newQuery, MAX_SUGGESTIONS)
      showSuggestions.value = suggestions.value.length > 0
    } else {
      clearSuggestions()
    }
  }

  function clearSearch() {
    query.value = ''
    clearResults()
    clearSuggestions()
  }

  function clearResults() {
    searchResults.value = []
  }

  function clearSuggestions() {
    suggestions.value = []
    showSuggestions.value = false
  }

  function clearHistory() {
    searchHistory.value = []
  }

  function removeFromHistory(searchTerm: string) {
    const index = searchHistory.value.indexOf(searchTerm)
    if (index > -1) {
      searchHistory.value.splice(index, 1)
    }
  }

  function selectSuggestion(suggestion: string) {
    query.value = suggestion
    clearSuggestions()
    search()
  }

  function getBusinessesFromResults(): Business[] {
    return searchResults.value.map(result => result.item)
  }

  return {
    // State
    query,
    searchResults,
    searchHistory,
    isSearching,
    showSuggestions,
    suggestions,
    
    // Getters
    hasResults,
    resultCount,
    hasQuery,
    recentSearches,
    
    // Actions
    initializeSearchEngine,
    search,
    updateQuery,
    clearSearch,
    clearResults,
    clearSuggestions,
    clearHistory,
    removeFromHistory,
    selectSuggestion,
    getBusinessesFromResults
  }
})