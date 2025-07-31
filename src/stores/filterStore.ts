import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Business, FilterOptions } from '@/types'
import { getCounties, getTags } from '@/utils/dataParser'

export const useFilterStore = defineStore('filter', () => {
  // State
  const selectedCounties = ref<string[]>([])
  const selectedTags = ref<string[]>([])
  const availableCounties = ref<string[]>([])
  const availableTags = ref<string[]>([])
  const isHakkaOnly = ref(false)

  // Getters
  const hasActiveFilters = computed(() => 
    selectedCounties.value.length > 0 || 
    selectedTags.value.length > 0 || 
    isHakkaOnly.value
  )

  const activeFilterCount = computed(() => 
    selectedCounties.value.length + 
    selectedTags.value.length + 
    (isHakkaOnly.value ? 1 : 0)
  )

  const currentFilters = computed<FilterOptions>(() => ({
    counties: selectedCounties.value,
    tags: selectedTags.value,
    isHakka: isHakkaOnly.value || undefined
  }))

  // Actions
  function initializeFilters(businesses: Business[]) {
    availableCounties.value = getCounties(businesses)
    availableTags.value = getTags(businesses)
  }

  function setCountyFilter(counties: string[]) {
    selectedCounties.value = counties
  }

  function toggleCounty(county: string) {
    const index = selectedCounties.value.indexOf(county)
    if (index > -1) {
      selectedCounties.value.splice(index, 1)
    } else {
      selectedCounties.value.push(county)
    }
  }

  function setTagFilter(tags: string[]) {
    selectedTags.value = tags
  }

  function toggleTag(tag: string) {
    const index = selectedTags.value.indexOf(tag)
    if (index > -1) {
      selectedTags.value.splice(index, 1)
    } else {
      selectedTags.value.push(tag)
    }
  }

  function setHakkaOnly(value: boolean) {
    isHakkaOnly.value = value
  }

  function clearFilters() {
    selectedCounties.value = []
    selectedTags.value = []
    isHakkaOnly.value = false
  }

  function clearCountyFilters() {
    selectedCounties.value = []
  }

  function clearTagFilters() {
    selectedTags.value = []
  }

  function applyFilters(businesses: Business[]): Business[] {
    let filtered = businesses

    // Filter by counties
    if (selectedCounties.value.length > 0) {
      filtered = filtered.filter(business => 
        business.county && selectedCounties.value.includes(business.county)
      )
    }

    // Filter by tags
    if (selectedTags.value.length > 0) {
      filtered = filtered.filter(business =>
        business.tag.some(tag => selectedTags.value.includes(tag))
      )
    }

    // Filter by hakka status
    if (isHakkaOnly.value) {
      filtered = filtered.filter(business => business.is_hakka)
    }

    return filtered
  }

  function isCountySelected(county: string): boolean {
    return selectedCounties.value.includes(county)
  }

  function isTagSelected(tag: string): boolean {
    return selectedTags.value.includes(tag)
  }

  function selectAllCounties() {
    selectedCounties.value = [...availableCounties.value]
  }

  function selectAllTags() {
    selectedTags.value = [...availableTags.value]
  }

  return {
    // State
    selectedCounties,
    selectedTags,
    availableCounties,
    availableTags,
    isHakkaOnly,
    
    // Getters
    hasActiveFilters,
    activeFilterCount,
    currentFilters,
    
    // Actions
    initializeFilters,
    setCountyFilter,
    toggleCounty,
    setTagFilter,
    toggleTag,
    setHakkaOnly,
    clearFilters,
    clearCountyFilters,
    clearTagFilters,
    applyFilters,
    isCountySelected,
    isTagSelected,
    selectAllCounties,
    selectAllTags
  }
})