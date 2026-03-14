<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import type { Business } from '@/types'
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

// 底部面板狀態（手機版商家詳情）
const selectedBusiness = ref<Business | null>(null)
const showBottomSheet = ref(false)

function closeBottomSheet() {
  showBottomSheet.value = false
  selectedBusiness.value = null
}

// 標籤顏色對照
const tagColorMap: Record<string, string> = {
  食: 'bg-red-500',
  購: 'bg-blue-500',
  住: 'bg-green-500',
  遊: 'bg-amber-500',
}

function getTagColor(tag: string): string {
  return tagColorMap[tag] || 'bg-gray-500'
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

function openGoogleMaps(business: Business) {
  let url: string
  if (business.map_url) {
    // 優先使用 API 提供的 Google Maps 連結（最精確）
    url = business.map_url
  } else if (business.coordinates) {
    // 其次使用座標定位
    const [lat, lng] = business.coordinates
    url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  } else {
    // 最後用店名+地址搜尋
    const query = `${business.name} ${business.address}`
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }
  window.open(url, '_blank')
}

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
  // 手機版使用底部面板顯示商家詳情
  if (window.innerWidth < 768) {
    selectedBusiness.value = business
    showBottomSheet.value = true
  }
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
        <div class="card mb-4 md:mb-6 overflow-visible">
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

    <!-- Mobile Bottom Sheet for Business Details -->
    <Teleport to="body">
      <div v-if="showBottomSheet && selectedBusiness" class="fixed inset-0 z-[1000]">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/40 transition-opacity duration-300"
          :class="showBottomSheet ? 'opacity-100' : 'opacity-0'"
          @click="closeBottomSheet"
        ></div>
        <!-- Sheet -->
        <div
          class="bottom-sheet absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto"
        >
          <!-- Drag handle -->
          <div class="flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>
          <!-- Close button -->
          <button
            @click="closeBottomSheet"
            class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
            aria-label="關閉"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <!-- Content -->
          <div class="px-5 pb-6 pt-1">
            <!-- Name -->
            <h3 class="text-lg font-bold text-gray-900 pr-8">{{ selectedBusiness.name }}</h3>
            <!-- Tags -->
            <div class="flex flex-wrap gap-1.5 mt-2" v-if="selectedBusiness.tag && selectedBusiness.tag.length">
              <span
                v-for="tag in selectedBusiness.tag"
                :key="tag"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                :class="getTagColor(tag)"
              >
                {{ tag }}
              </span>
              <span
                v-if="selectedBusiness.is_hakka"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-hakka-primary text-white"
              >
                客家認證
              </span>
            </div>
            <!-- Introduction -->
            <p v-if="selectedBusiness.introduction" class="text-sm text-gray-600 mt-3 leading-relaxed">
              {{ truncateText(selectedBusiness.introduction, 120) }}
            </p>
            <!-- Details -->
            <div class="mt-4 space-y-2.5">
              <div v-if="selectedBusiness.address" class="flex items-start gap-2 text-sm">
                <svg class="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="text-gray-700">{{ selectedBusiness.address }}</span>
              </div>
              <div v-if="selectedBusiness.contact" class="flex items-start gap-2 text-sm">
                <svg class="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <a :href="`tel:${selectedBusiness.contact}`" class="text-blue-600 hover:underline">{{ selectedBusiness.contact }}</a>
              </div>
              <div v-if="selectedBusiness.business_hours" class="flex items-start gap-2 text-sm">
                <svg class="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-gray-700">{{ selectedBusiness.business_hours }}</span>
              </div>
            </div>
            <!-- Google Maps button -->
            <button
              v-if="selectedBusiness.address"
              @click="openGoogleMaps(selectedBusiness)"
              class="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              在 Google Maps 中開啟
            </button>
          </div>
        </div>
      </div>
    </Teleport>

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

<style scoped>
.bottom-sheet {
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>