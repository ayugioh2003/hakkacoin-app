import { computed, watch } from 'vue'
import { useFilterStore } from '@/stores/filterStore'
import { useBusinesses } from '@/composables/useBusinesses'
import type { Business } from '@/types'

export function useFilter() {
  const filterStore = useFilterStore()
  const { businesses } = useBusinesses()

  // Computed properties
  const filteredBusinesses = computed(() => {
    return filterStore.applyFilters(businesses.value)
  })

  const availableCounties = computed(() => {
    return filterStore.getAvailableCounties(businesses.value)
  })

  const availableTags = computed(() => {
    return filterStore.getAvailableTags(businesses.value)
  })

  const filteredCount = computed(() => {
    return filteredBusinesses.value.length
  })

  const totalCount = computed(() => {
    return businesses.value.length
  })

  const hasActiveFilters = computed(() => {
    return filterStore.hasActiveFilters
  })

  const filterCount = computed(() => {
    return filterStore.filterCount
  })

  const selectedCounties = computed(() => {
    return filterStore.selectedCounties
  })

  const selectedTags = computed(() => {
    return filterStore.selectedTags
  })

  const isHakkaOnly = computed(() => {
    return filterStore.isHakkaOnly
  })

  // Methods
  function toggleCounty(county: string) {
    filterStore.toggleCounty(county)
  }

  function toggleTag(tag: string) {
    filterStore.toggleTag(tag)
  }

  function toggleHakkaOnly() {
    filterStore.toggleHakkaOnly()
  }

  function clearAllFilters() {
    filterStore.clearAllFilters()
  }

  function clearCountyFilters() {
    filterStore.clearCountyFilters()
  }

  function clearTagFilters() {
    filterStore.clearTagFilters()
  }

  function setCounties(counties: string[]) {
    filterStore.setCounties(counties)
  }

  function setTags(tags: string[]) {
    filterStore.setTags(tags)
  }

  function setHakkaOnly(hakkaOnly: boolean) {
    filterStore.setHakkaOnly(hakkaOnly)
  }

  function isCountySelected(county: string): boolean {
    return filterStore.selectedCounties.includes(county)
  }

  function isTagSelected(tag: string): boolean {
    return filterStore.selectedTags.includes(tag)
  }

  function getCountyCount(county: string): number {
    return businesses.value.filter(business => business.county === county).length
  }

  function getTagCount(tag: string): number {
    return businesses.value.filter(business => business.tag.some(t => String(t).trim() === tag)).length
  }

  function getHakkaCount(): number {
    return businesses.value.filter(business => business.is_hakka).length
  }

  // Statistics
  const filterStats = computed(() => {
    const stats = {
      total: totalCount.value,
      filtered: filteredCount.value,
      hidden: totalCount.value - filteredCount.value,
      percentage: totalCount.value > 0 ? Math.round((filteredCount.value / totalCount.value) * 100) : 0
    }
    return stats
  })

  const countyStats = computed(() => {
    return availableCounties.value.map(county => ({
      name: county,
      count: getCountyCount(county),
      selected: isCountySelected(county)
    }))
  })

  const tagStats = computed(() => {
    return availableTags.value.map(tag => ({
      name: tag,
      count: getTagCount(tag),
      selected: isTagSelected(tag)
    }))
  })

  const hakkaStats = computed(() => ({
    count: getHakkaCount(),
    selected: isHakkaOnly.value,
    percentage: totalCount.value > 0 ? Math.round((getHakkaCount() / totalCount.value) * 100) : 0
  }))

  return {
    // Computed data
    filteredBusinesses,
    availableCounties,
    availableTags,
    filteredCount,
    totalCount,
    hasActiveFilters,
    filterCount,
    selectedCounties,
    selectedTags,
    isHakkaOnly,

    // Statistics
    filterStats,
    countyStats,
    tagStats,
    hakkaStats,

    // Methods
    toggleCounty,
    toggleTag,
    toggleHakkaOnly,
    clearAllFilters,
    clearCountyFilters,
    clearTagFilters,
    setCounties,
    setTags,
    setHakkaOnly,
    isCountySelected,
    isTagSelected,
    getCountyCount,
    getTagCount,
    getHakkaCount
  }
}