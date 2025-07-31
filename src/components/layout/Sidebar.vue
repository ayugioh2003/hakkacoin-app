<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFilter } from '@/composables/useFilter'
import { useSearch } from '@/composables/useSearch'

// Props
interface Props {
  isOpen?: boolean
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  collapsed: false
})

// Emits
const emit = defineEmits<{
  close: []
  toggleCollapse: []
}>()

// Composables
const { hasActiveFilters, filterCount, filteredCount, totalCount } = useFilter()
const { searchQuery, hasResults } = useSearch()

// Local state
const activeTab = ref<'search' | 'filter' | 'info'>('search')

// Computed
const showContent = computed(() => props.isOpen && !props.collapsed)

// Methods
function handleClose() {
  emit('close')
}

function handleToggleCollapse() {
  emit('toggleCollapse')
}

function setActiveTab(tab: 'search' | 'filter' | 'info') {
  activeTab.value = tab
}
</script>

<template>
  <!-- Sidebar for future use - currently using panel design -->
  <aside 
    v-if="isOpen"
    class="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out"
    :class="collapsed ? 'w-16' : 'w-80'"
  >
    <!-- Sidebar Header -->
    <div class="flex items-center justify-between p-4 border-b">
      <h2 v-if="!collapsed" class="text-lg font-semibold text-gray-900">
        控制面板
      </h2>
      <div class="flex items-center gap-2">
        <button
          @click="handleToggleCollapse"
          class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              :d="collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'" 
            />
          </svg>
        </button>
        <button
          @click="handleClose"
          class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Sidebar Content -->
    <div v-if="showContent" class="flex-1 overflow-y-auto">
      <!-- Tab Navigation -->
      <div class="border-b">
        <nav class="flex">
          <button
            @click="setActiveTab('search')"
            class="flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'search' 
              ? 'border-blue-500 text-blue-600 bg-blue-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            搜尋
          </button>
          <button
            @click="setActiveTab('filter')"
            class="flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'filter' 
              ? 'border-blue-500 text-blue-600 bg-blue-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            篩選
          </button>
          <button
            @click="setActiveTab('info')"
            class="flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'info' 
              ? 'border-blue-500 text-blue-600 bg-blue-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            資訊
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-4">
        <!-- Search Tab -->
        <div v-if="activeTab === 'search'" class="space-y-4">
          <div class="text-sm text-gray-600">
            <p v-if="searchQuery">
              搜尋「<span class="font-medium text-gray-900">{{ searchQuery }}</span>」
            </p>
            <p v-else class="italic">目前沒有進行搜尋</p>
          </div>
          
          <div v-if="hasResults" class="text-sm">
            <p class="text-green-600 font-medium">找到相關結果</p>
          </div>
        </div>

        <!-- Filter Tab -->
        <div v-if="activeTab === 'filter'" class="space-y-4">
          <div class="text-sm text-gray-600">
            <p v-if="hasActiveFilters">
              已套用 <span class="font-medium text-blue-600">{{ filterCount }}</span> 個篩選條件
            </p>
            <p v-else class="italic">目前沒有套用篩選條件</p>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-3 text-sm">
            <p class="text-gray-600">
              顯示 <span class="font-semibold text-gray-900">{{ filteredCount }}</span> 家商家
              <span class="text-gray-500">/ 共 {{ totalCount }} 家</span>
            </p>
          </div>
        </div>

        <!-- Info Tab -->
        <div v-if="activeTab === 'info'" class="space-y-4">
          <div class="text-sm text-gray-600 space-y-2">
            <h3 class="font-medium text-gray-900">關於客家小錢地圖</h3>
            <p>這是一個展示台灣客家商家的互動式地圖應用程式。</p>
            
            <h4 class="font-medium text-gray-900 mt-4">功能特色</h4>
            <ul class="list-disc list-inside space-y-1 text-xs">
              <li>搜尋商家名稱和地址</li>
              <li>按縣市和類型篩選</li>
              <li>客家商家認證標示</li>
              <li>互動式地圖瀏覽</li>
              <li>商家詳細資訊</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Collapsed State -->
    <div v-else-if="collapsed" class="p-4 space-y-4">
      <button class="w-full p-2 rounded-md hover:bg-gray-100" title="搜尋">
        <svg class="w-5 h-5 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
      <button class="w-full p-2 rounded-md hover:bg-gray-100" title="篩選">
        <svg class="w-5 h-5 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>
      <button class="w-full p-2 rounded-md hover:bg-gray-100" title="資訊">
        <svg class="w-5 h-5 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* Sidebar specific styles */
.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>