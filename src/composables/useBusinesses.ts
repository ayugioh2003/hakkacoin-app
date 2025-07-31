import { computed } from 'vue'
import { useMapStore } from '@/stores/mapStore'
import { useSearchStore } from '@/stores/searchStore'
import { useFilterStore } from '@/stores/filterStore'
import type { Business } from '@/types'

/**
 * 整合商家資料的 composable
 * 提供篩選和搜尋後的商家列表
 */
export function useBusinesses() {
  const mapStore = useMapStore()
  const searchStore = useSearchStore()
  const filterStore = useFilterStore()

  // 取得處理後的商家列表
  const filteredBusinesses = computed<Business[]>(() => {
    let businesses = mapStore.businesses

    // 如果有搜尋結果，使用搜尋結果
    if (searchStore.hasResults) {
      businesses = searchStore.getBusinessesFromResults()
    }

    // 套用篩選條件
    if (filterStore.hasActiveFilters) {
      businesses = filterStore.applyFilters(businesses)
    }

    return businesses
  })

  // 是否有符合條件的商家
  const hasFilteredBusinesses = computed(() => filteredBusinesses.value.length > 0)

  // 符合條件的商家數量
  const filteredBusinessCount = computed(() => filteredBusinesses.value.length)

  // 是否正在套用篩選或搜尋
  const isFiltering = computed(() => 
    searchStore.hasQuery || filterStore.hasActiveFilters
  )

  // 取得商家的縣市統計
  const businessCountByCounty = computed(() => {
    const countMap = new Map<string, number>()
    
    filteredBusinesses.value.forEach(business => {
      if (business.county) {
        countMap.set(business.county, (countMap.get(business.county) || 0) + 1)
      }
    })

    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([county, count]) => ({ county, count }))
  })

  // 取得商家的標籤統計
  const businessCountByTag = computed(() => {
    const tagMap = new Map<string, number>()
    
    filteredBusinesses.value.forEach(business => {
      business.tag.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      })
    })

    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }))
  })

  // 重置所有篩選和搜尋
  function resetAllFilters() {
    searchStore.clearSearch()
    filterStore.clearFilters()
  }

  return {
    // 商家資料
    businesses: computed(() => mapStore.businesses),
    filteredBusinesses,
    selectedBusiness: computed(() => mapStore.selectedBusiness),
    
    // 狀態
    isLoading: computed(() => mapStore.isLoading),
    error: computed(() => mapStore.error),
    hasFilteredBusinesses,
    filteredBusinessCount,
    isFiltering,
    
    // 統計資料
    businessCountByCounty,
    businessCountByTag,
    
    // 方法
    selectBusiness: mapStore.setSelectedBusiness,
    clearSelection: mapStore.clearSelection,
    resetAllFilters
  }
}