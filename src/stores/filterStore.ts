import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Business, FilterOptions } from '@/types'

export const useFilterStore = defineStore('filter', () => {
  // State
  const selectedCounties = ref<string[]>([])
  const selectedTags = ref<string[]>([])
  const isHakkaOnly = ref<boolean>(false)
  const isFilterActive = ref<boolean>(false)

  // Getters
  const hasActiveFilters = computed(() => {
    return selectedCounties.value.length > 0 || 
           selectedTags.value.length > 0 || 
           isHakkaOnly.value
  })

  const filterOptions = computed((): FilterOptions => ({
    counties: selectedCounties.value,
    tags: selectedTags.value,
    isHakka: isHakkaOnly.value
  }))

  const filterCount = computed(() => {
    let count = 0
    if (selectedCounties.value.length > 0) count += selectedCounties.value.length
    if (selectedTags.value.length > 0) count += selectedTags.value.length
    if (isHakkaOnly.value) count += 1
    return count
  })

  // Actions
  function toggleCounty(county: string) {
    const index = selectedCounties.value.indexOf(county)
    if (index > -1) {
      selectedCounties.value.splice(index, 1)
    } else {
      selectedCounties.value.push(county)
    }
    updateFilterState()
  }

  function toggleTag(tag: string) {
    const index = selectedTags.value.indexOf(tag)
    if (index > -1) {
      selectedTags.value.splice(index, 1)
    } else {
      selectedTags.value.push(tag)
    }
    updateFilterState()
  }

  function toggleHakkaOnly() {
    isHakkaOnly.value = !isHakkaOnly.value
    updateFilterState()
  }

  function setCounties(counties: string[]) {
    selectedCounties.value = [...counties]
    updateFilterState()
  }

  function setTags(tags: string[]) {
    selectedTags.value = [...tags]
    updateFilterState()
  }

  function setHakkaOnly(hakkaOnly: boolean) {
    isHakkaOnly.value = hakkaOnly
    updateFilterState()
  }

  function clearAllFilters() {
    selectedCounties.value = []
    selectedTags.value = []
    isHakkaOnly.value = false
    updateFilterState()
  }

  function clearCountyFilters() {
    selectedCounties.value = []
    updateFilterState()
  }

  function clearTagFilters() {
    selectedTags.value = []
    updateFilterState()
  }

  function updateFilterState() {
    isFilterActive.value = hasActiveFilters.value
  }

  function applyFilters(businesses: Business[]): Business[] {
    if (!hasActiveFilters.value) {
      return businesses
    }

    return businesses.filter(business => {
      // 縣市篩選
      if (selectedCounties.value.length > 0) {
        if (!business.county || !selectedCounties.value.includes(business.county)) {
          return false
        }
      }

      // 標籤篩選
      if (selectedTags.value.length > 0) {
        const hasMatchingTag = business.tag.some(tag => selectedTags.value.includes(tag))
        if (!hasMatchingTag) {
          return false
        }
      }

      // 客家商家篩選
      if (isHakkaOnly.value && !business.is_hakka) {
        return false
      }

      return true
    })
  }

  function getAvailableCounties(businesses: Business[]): string[] {
    const counties = new Set<string>()
    businesses.forEach(business => {
      if (business.county) {
        counties.add(business.county)
      }
    })
    return Array.from(counties).sort()
  }

  function getAvailableTags(businesses: Business[]): string[] {
    const tags = new Set<string>()
    businesses.forEach(business => {
      business.tag.forEach(tag => {
        if (tag.trim()) {
          tags.add(tag)
        }
      })
    })
    return Array.from(tags).sort()
  }

  function getFilteredCount(businesses: Business[]): number {
    return applyFilters(businesses).length
  }

  return {
    // State
    selectedCounties,
    selectedTags,
    isHakkaOnly,
    isFilterActive,

    // Getters
    hasActiveFilters,
    filterOptions,
    filterCount,

    // Actions
    toggleCounty,
    toggleTag,
    toggleHakkaOnly,
    setCounties,
    setTags,
    setHakkaOnly,
    clearAllFilters,
    clearCountyFilters,
    clearTagFilters,
    applyFilters,
    getAvailableCounties,
    getAvailableTags,
    getFilteredCount
  }
})