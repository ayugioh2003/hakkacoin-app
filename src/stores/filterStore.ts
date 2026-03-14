import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Business, FilterOptions } from '@/types'

// 本地儲存鍵名
const STORAGE_KEY = 'hakkacoin-filter-state'

// 預設篩選狀態
interface FilterState {
  selectedCounties: string[]
  selectedTags: string[]
  isHakkaOnly: boolean
}

// 從 localStorage 載入狀態
function loadFilterState(): FilterState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        selectedCounties: Array.isArray(parsed.selectedCounties) ? parsed.selectedCounties : [],
        selectedTags: Array.isArray(parsed.selectedTags) ? parsed.selectedTags : [],
        isHakkaOnly: Boolean(parsed.isHakkaOnly)
      }
    }
  } catch (error) {
    console.warn('Failed to load filter state from localStorage:', error)
  }
  return {
    selectedCounties: [],
    selectedTags: [],
    isHakkaOnly: false
  }
}

// 儲存狀態到 localStorage
function saveFilterState(state: FilterState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to save filter state to localStorage:', error)
  }
}

export const useFilterStore = defineStore('filter', () => {
  // 載入儲存的狀態
  const savedState = loadFilterState()
  
  // State
  const selectedCounties = ref<string[]>(savedState.selectedCounties)
  const selectedTags = ref<string[]>(savedState.selectedTags)
  const isHakkaOnly = ref<boolean>(savedState.isHakkaOnly)
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
        const hasMatchingTag = business.tag.some(tag => selectedTags.value.includes(String(tag).trim()))
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
        const tagStr = String(tag).trim()
        if (tagStr) {
          tags.add(tagStr)
        }
      })
    })
    return Array.from(tags).sort()
  }

  function getFilteredCount(businesses: Business[]): number {
    return applyFilters(businesses).length
  }

  // 清除本地儲存
  function clearStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear filter state from localStorage:', error)
    }
  }

  // 監聽狀態變化並自動儲存
  watch(
    [selectedCounties, selectedTags, isHakkaOnly],
    () => {
      const currentState: FilterState = {
        selectedCounties: selectedCounties.value,
        selectedTags: selectedTags.value,
        isHakkaOnly: isHakkaOnly.value
      }
      saveFilterState(currentState)
    },
    { deep: true }
  )

  // 初始化時更新篩選狀態
  updateFilterState()

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
    getFilteredCount,
    clearStorage
  }
})