import { useMapStore } from './mapStore'
import { useSearchStore } from './searchStore'
import { useFilterStore } from './filterStore'

export { useMapStore, useSearchStore, useFilterStore }

/**
 * 初始化所有 stores 的資料
 */
export async function initializeStores() {
  const mapStore = useMapStore()
  const searchStore = useSearchStore()
  const filterStore = useFilterStore()

  // 載入商家資料
  await mapStore.loadBusinessData()

  if (mapStore.hasBusinesses) {
    // 初始化搜尋引擎
    searchStore.initializeSearchEngine(mapStore.businesses)

    console.log('✅ Stores initialized successfully')
    console.log(`📊 Loaded ${mapStore.businessCount} businesses`)
    console.log(`🏙️ Available counties: ${filterStore.getAvailableCounties(mapStore.businesses).length}`)
    console.log(`🏷️ Available tags: ${filterStore.getAvailableTags(mapStore.businesses).length}`)
  } else {
    console.error('❌ Failed to initialize stores: No businesses loaded')
  }
}