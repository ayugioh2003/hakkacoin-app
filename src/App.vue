<script setup lang="ts">
import { onMounted } from 'vue'
import { initializeStores } from '@/stores'
import { useBusinesses } from '@/composables/useBusinesses'
import MapContainer from '@/components/map/MapContainer.vue'
import MapControls from '@/components/map/MapControls.vue'

// 初始化 stores
onMounted(async () => {
  await initializeStores()
})

// 使用商家資料
const { businesses, isLoading, error, filteredBusinessCount } = useBusinesses()

// Map event handlers
function handleMapReady() {
  console.log('Map is ready!')
}

function handleMarkerClick(business: any) {
  console.log('Marker clicked:', business)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 class="text-2xl font-bold text-gray-900">客家小錢地圖</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p class="text-red-800">載入資料時發生錯誤：{{ error }}</p>
      </div>

      <!-- Map Section -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <div class="p-4 border-b bg-gray-50">
          <h2 class="text-lg font-semibold text-gray-800">
            商家地圖
            <span v-if="!isLoading" class="text-sm font-normal text-gray-600 ml-2">
              (共 {{ filteredBusinessCount }} 家商家)
            </span>
          </h2>
        </div>
        
        <div class="relative">
          <MapContainer 
            :businesses="businesses"
            height="500px"
            @map-ready="handleMapReady"
            @marker-click="handleMarkerClick"
          />
          <MapControls />
        </div>
      </div>

      <!-- Info Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-2">地圖功能</h3>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• 滑鼠滾輪或雙擊縮放</li>
            <li>• 拖曳移動地圖</li>
            <li>• 點擊標記查看詳情</li>
          </ul>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-2">資料狀態</h3>
          <div class="text-sm text-gray-600">
            <p>載入狀態：{{ isLoading ? '載入中...' : '已完成' }}</p>
            <p>商家總數：{{ businesses.length }}</p>
            <p>顯示數量：{{ filteredBusinessCount }}</p>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-2">開發進度</h3>
          <div class="text-sm text-gray-600">
            <p>✅ 環境建置完成</p>
            <p>✅ 資料模型完成</p>
            <p>✅ 基礎地圖完成</p>
            <p>⏳ 商家標記 (Day 4)</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>