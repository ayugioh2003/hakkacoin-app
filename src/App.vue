<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { initializeStores } from '@/stores'
import { useBusinesses } from '@/composables/useBusinesses'
import { useSearch } from '@/composables/useSearch'
import { useFilter } from '@/composables/useFilter'
import MapContainer from '@/components/map/MapContainer.vue'
import FilterPanel from '@/components/common/FilterPanel.vue'
import Header from '@/components/layout/Header.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import TransitionWrapper from '@/components/common/TransitionWrapper.vue'
import UserGuide from '@/components/common/UserGuide.vue'
import { useTransitions } from '@/composables/useTransitions'
import { useKeyboardNavigation } from '@/composables/useKeyboardNavigation'
import { useAccessibility } from '@/composables/useAccessibility'

// 使用商家資料
const { businesses, filteredBusinesses, isLoading, error, filteredBusinessCount } = useBusinesses()

// 使用搜尋功能
const { performSearch, clearSearch, selectBusiness, focusOnResults, highlightedBusinessIds } = useSearch()

// 使用篩選功能
const { hasActiveFilters, filterCount } = useFilter()

// 使用過渡動畫
const { searchFilterTransition, loadingTransition, pageTransition } = useTransitions()

// 使用鍵盤導航
const { setupScopedNavigation } = useKeyboardNavigation()

// 使用無障礙功能
const { announceToScreenReader, enhanceAriaLabels } = useAccessibility()

// 手動追蹤初始化狀態
const isInitialized = ref(false)

// 篩選面板狀態
const isFilterPanelOpen = ref(false)

// 初始化 stores
onMounted(async () => {
  console.log('Starting initialization...')
  await initializeStores()
  isInitialized.value = true
  console.log('Initialization complete')
  console.log('Current businesses:', businesses.value?.length || 0)
})

// 監聽商家資料載入
watch(businesses, (newBusinesses) => {
  if (newBusinesses && newBusinesses.length > 0) {
    console.log(`Businesses loaded in App.vue: ${newBusinesses.length}`)
    const businessWithCoordinates = newBusinesses.filter(b => b.coordinates).length
    console.log(`Businesses with coordinates: ${businessWithCoordinates}`)
  }
}, { immediate: true })

// Map event handlers
function handleMapReady() {
  console.log('Map is ready!')
  if (businesses.value) {
    console.log('Businesses loaded:', businesses.value.length)
    if (businesses.value.length > 0) {
      console.log('Sample business:', businesses.value[0])
    }
  } else {
    console.log('Businesses not loaded yet')
  }
}

function handleMarkerClick(business: any) {
  console.log('Marker clicked:', business)
}

// Search event handlers
function handleSearch(query: string) {
  searchFilterTransition('search')
  focusOnResults()
  announceToScreenReader(`正在搜尋「${query}」`, 'polite')
}

function handleSelectBusiness(business: any) {
  selectBusiness(business)
}

function handleClearSearch() {
  searchFilterTransition('none')
  clearSearch()
}

// Filter event handlers
function openFilterPanel() {
  searchFilterTransition('filter')
  isFilterPanelOpen.value = true
  announceToScreenReader('篩選面板已開啟', 'polite')
}

function closeFilterPanel() {
  searchFilterTransition('none')
  isFilterPanelOpen.value = false
  announceToScreenReader('篩選面板已關閉', 'polite')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 safe-area-inset">
    <!-- Skip to content link for accessibility -->
    <a 
      href="#main-content" 
      class="absolute left-[-9999px] top-0 z-[999] px-4 py-2 bg-gray-900 text-white no-underline rounded-br-lg focus:left-0"
    >
      跳到主要內容
    </a>
    
    <Header 
      :is-loading="isLoading"
      @search="handleSearch"
      @select-business="handleSelectBusiness"
      @clear-search="handleClearSearch"
      @open-filter="openFilterPanel"
    />

    <main id="main-content" class="container-responsive py-4 md:py-8" role="main">
      <TransitionWrapper name="slide-down" :appear="true">
        <ErrorMessage 
          v-if="error"
          :message="`載入資料時發生錯誤：${error}`"
          type="error"
          class="mb-4"
        />
      </TransitionWrapper>

      <!-- Map Section -->
      <TransitionWrapper name="slide-up" :appear="true">
        <div class="card mb-4 md:mb-6 overflow-hidden">
        <div class="card-body !pb-3 border-b bg-gray-50">
          <h2 class="heading-responsive text-gray-800">
            商家地圖
            <span v-if="!isLoading" class="text-sm font-normal text-gray-600 ml-2">
              (共 {{ filteredBusinessCount }} 家商家)
            </span>
          </h2>
        </div>
        
        <div class="relative">
          <MapContainer 
            v-if="!isLoading && businesses.length > 0"
            id="map"
            :businesses="filteredBusinesses"
            :highlighted-business-ids="highlightedBusinessIds"
            @map-ready="handleMapReady"
            @marker-click="handleMarkerClick"
          />
          <div v-else class="map-height flex items-center justify-center bg-gray-100 rounded">
            <LoadingSpinner 
              size="lg"
              text="載入商家資料中..."
            />
          </div>
        </div>
        </div>
      </TransitionWrapper>

    </main>

    <!-- Filter Panel -->
    <FilterPanel 
      :is-open="isFilterPanelOpen"
      @close="closeFilterPanel"
    />

    <!-- User Guide -->
    <UserGuide 
      :show-on-first-visit="true"
      @complete="() => announceToScreenReader('使用指南已完成', 'polite')"
    />
  </div>
</template>