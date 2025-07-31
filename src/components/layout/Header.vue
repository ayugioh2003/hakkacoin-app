<script setup lang="ts">
import { computed } from 'vue'
import { useFilter } from '@/composables/useFilter'
import SearchBox from '@/components/common/SearchBox.vue'

// Props
interface Props {
  isLoading?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  title: '客家小錢地圖'
})

// Emits
const emit = defineEmits<{
  search: [query: string]
  selectBusiness: [business: any]
  clearSearch: []
  openFilter: []
}>()

// Filter state
const { hasActiveFilters, filterCount } = useFilter()

// Computed
const showFilterBadge = computed(() => {
  return hasActiveFilters.value && filterCount.value > 0
})

// Methods
function handleSearch(query: string) {
  emit('search', query)
}

function handleSelectBusiness(business: any) {
  emit('selectBusiness', business)
}

function handleClearSearch() {
  emit('clearSearch')
}

function handleOpenFilter() {
  emit('openFilter')
}
</script>

<template>
  <header class="bg-white shadow-sm border-b relative z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- Logo and Title -->
        <div class="flex items-center">
          <div class="flex-shrink-0 mr-4">
            <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
          <div>
            <h1 class="text-xl lg:text-2xl font-bold text-gray-900">{{ title }}</h1>
            <p class="text-sm text-gray-600 mt-1 hidden lg:block">探索台灣客家商家的最佳指南</p>
          </div>
        </div>

        <!-- Search and Filter Controls -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <!-- Search Box -->
          <div class="flex-1 sm:w-80 lg:w-96">
            <SearchBox 
              v-if="!isLoading"
              placeholder="搜尋商家名稱或地址..."
              @search="handleSearch"
              @select="handleSelectBusiness"
              @clear="handleClearSearch"
            />
            <div 
              v-else 
              class="h-10 bg-gray-100 rounded-md animate-pulse"
            ></div>
          </div>

          <!-- Filter Button -->
          <button
            v-if="!isLoading"
            @click="handleOpenFilter"
            class="relative inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            :class="hasActiveFilters ? 'border-blue-300 bg-blue-50 text-blue-700' : ''"
          >
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span class="hidden sm:inline">篩選</span>
            <span class="sm:hidden">篩選</span>
            
            <!-- Filter Badge -->
            <span 
              v-if="showFilterBadge"
              class="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full transform animate-pulse"
            >
              {{ filterCount }}
            </span>
          </button>
          
          <!-- Loading Filter Button -->
          <div 
            v-else 
            class="w-20 h-10 bg-gray-100 rounded-md animate-pulse"
          ></div>
        </div>
      </div>
    </div>

    <!-- Mobile subtitle -->
    <div class="lg:hidden px-4 sm:px-6 pb-4">
      <p class="text-sm text-gray-600">探索台灣客家商家的最佳指南</p>
    </div>
  </header>
</template>

<style scoped>
/* Additional header styles */
@media (max-width: 640px) {
  .flex-col {
    gap: 1rem;
  }
}
</style>