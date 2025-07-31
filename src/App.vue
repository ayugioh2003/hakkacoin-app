<script setup lang="ts">
import { onMounted } from 'vue'
import { initializeStores } from '@/stores'
import { useBusinesses } from '@/composables/useBusinesses'

// 初始化 stores
onMounted(async () => {
  await initializeStores()
})

// 使用商家資料
const { businesses, isLoading, error, filteredBusinessCount } = useBusinesses()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 class="text-2xl font-bold text-gray-900">客家小錢地圖</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-flex items-center">
          <svg class="animate-spin h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          載入中...
        </div>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">載入資料時發生錯誤：{{ error }}</p>
      </div>

      <div v-else class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">資料載入測試</h2>
        <div class="space-y-2">
          <p class="text-gray-600">
            成功載入 <span class="font-bold text-blue-600">{{ filteredBusinessCount }}</span> 家商家資料
          </p>
          <div v-if="businesses.length > 0" class="mt-4">
            <h3 class="font-medium mb-2">範例資料（前 5 筆）：</h3>
            <ul class="space-y-2">
              <li v-for="business in businesses.slice(0, 5)" :key="business.id" 
                  class="p-3 bg-gray-50 rounded border border-gray-200">
                <div class="font-medium">{{ business.name }}</div>
                <div class="text-sm text-gray-600">{{ business.address }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  標籤：{{ business.tag.join(', ') || '無' }}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>