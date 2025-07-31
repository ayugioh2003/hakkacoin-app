<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSearchStore } from '@/stores/searchStore'
import { useBusinesses } from '@/composables/useBusinesses'
import type { Business } from '@/types'

// Props
interface Props {
  placeholder?: string
  autofocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜尋商家名稱或地址...',
  autofocus: false
})

// Emits
const emit = defineEmits<{
  search: [query: string]
  select: [business: Business]
  clear: []
}>()

const windowSetTimeout = window.setTimeout
const windowClearTimeout = window.clearTimeout

// Store and composables
const searchStore = useSearchStore()
const { businesses } = useBusinesses()

// Local state
const searchInput = ref('')
const isFocused = ref(false)
const selectedIndex = ref(-1)

// Computed
const showResults = computed(() => {
  return isFocused.value && searchInput.value.length > 0 && searchResults.value.length > 0
})

const showSuggestions = computed(() => {
  return isFocused.value && searchInput.value.length > 1 && searchStore.showSuggestions && searchStore.suggestions.length > 0
})

const showHistory = computed(() => {
  return isFocused.value && searchInput.value.length === 0 && searchStore.recentSearches.length > 0
})

const showDropdown = computed(() => {
  return showResults.value || showSuggestions.value || showHistory.value
})

const searchResults = computed(() => {
  if (!searchInput.value.trim()) return []
  return searchStore.searchResults
})

// Methods
function handleBlur() {
  windowSetTimeout(() => {
    isFocused.value = false
  }, 200)
}

function handleSearch() {
  const query = searchInput.value.trim()
  if (query) {
    searchStore.performSearch(query, businesses.value)
    emit('search', query)
  }
}

function handleClear() {
  searchInput.value = ''
  selectedIndex.value = -1
  searchStore.clearSearch()
  emit('clear')
}

function selectBusiness(business: Business) {
  searchInput.value = business.name
  searchStore.selectBusiness(business)
  emit('select', business)
  isFocused.value = false
}

function selectSuggestion(suggestion: string) {
  searchInput.value = suggestion
  searchStore.selectSuggestion(suggestion)
  handleSearch()
}

function selectFromHistory(historyItem: string) {
  searchInput.value = historyItem
  handleSearch()
}

function removeFromHistory(historyItem: string, event: Event) {
  event.stopPropagation()
  searchStore.removeFromHistory(historyItem)
}

function handleKeydown(event: KeyboardEvent) {
  if (!showResults.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0 && selectedIndex.value < searchResults.value.length) {
        selectBusiness(searchResults.value[selectedIndex.value].item)
      }
      break
    case 'Escape':
      event.preventDefault()
      isFocused.value = false
      break
  }
}

// Watch for input changes
let searchTimeout: number | null = null
watch(searchInput, (newValue) => {
  selectedIndex.value = -1
  
  if (searchTimeout) {
    windowClearTimeout(searchTimeout)
  }
  
  // Update query and generate suggestions immediately
  searchStore.updateQuery(newValue, businesses.value)
  
  // Debounce search
  searchTimeout = windowSetTimeout(() => {
    handleSearch()
  }, 300)
})

// Lifecycle
onMounted(() => {
  if (props.autofocus) {
    const input = document.querySelector('.search-input') as HTMLInputElement
    input?.focus()
  }
})
</script>

<template>
  <div class="search-box relative w-full">
    <div class="relative">
      <!-- Search Icon -->
      <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <!-- Search Input -->
      <input
        v-model="searchInput"
        type="text"
        class="search-input block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg 
               focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
               placeholder-gray-400 text-gray-900"
        :placeholder="placeholder"
        @focus="isFocused = true"
        @blur="handleBlur"
        @keydown="handleKeydown"
        :aria-label="placeholder"
        aria-autocomplete="list"
        :aria-expanded="showResults"
        role="combobox"
      />
      
      <!-- Clear Button -->
      <button
        v-if="searchInput"
        @click="handleClear"
        class="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-gray-700"
        title="清除搜尋"
        aria-label="清除搜尋"
      >
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <!-- Search Results and Suggestions Dropdown -->
    <div
      v-if="showDropdown"
      class="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 
             max-h-96 overflow-y-auto"
      role="listbox"
    >
      <div class="py-1">
        <!-- Search History -->
        <div v-if="showHistory" class="border-b border-gray-100">
          <div class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center justify-between">
            <span>最近搜尋</span>
            <button 
              @click="searchStore.clearHistory()"
              class="text-gray-400 hover:text-gray-600 text-xs"
              title="清除歷史"
            >
              清除
            </button>
          </div>
          <div
            v-for="historyItem in searchStore.recentSearches"
            :key="historyItem"
            @click="selectFromHistory(historyItem)"
            class="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 flex items-center justify-between group"
          >
            <div class="flex items-center flex-1">
              <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="flex-1">{{ historyItem }}</span>
            </div>
            <button
              @click="removeFromHistory(historyItem, $event)"
              class="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
              title="移除"
            >
              <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Search Suggestions -->
        <div v-if="showSuggestions && !showResults" class="border-b border-gray-100">
          <div class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            搜尋建議
          </div>
          <div
            v-for="suggestion in searchStore.suggestions"
            :key="suggestion"
            @click="selectSuggestion(suggestion)"
            class="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700"
          >
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {{ suggestion }}
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div
          v-for="(result, index) in searchResults"
          :key="result.item.id"
          @click="selectBusiness(result.item)"
          class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
          :class="{ 'bg-gray-50': index === selectedIndex }"
          role="option"
          :aria-selected="index === selectedIndex"
        >
          <div class="flex items-start">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">
                {{ result.item.name }}
              </h4>
              <p class="text-sm text-gray-500 mt-1">
                {{ result.item.address }}
              </p>
              <div v-if="result.item.tag.length > 0" class="flex gap-1 mt-1">
                <span
                  v-for="tag in result.item.tag"
                  :key="tag"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-red-100 text-red-800': tag === '食',
                    'bg-blue-100 text-blue-800': tag === '購',
                    'bg-green-100 text-green-800': tag === '住',
                    'bg-yellow-100 text-yellow-800': tag === '遊',
                    'bg-gray-100 text-gray-800': !['食', '購', '住', '遊'].includes(tag)
                  }"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            <div v-if="result.score !== undefined" class="ml-2 text-xs text-gray-400">
              {{ (100 - result.score * 100).toFixed(0) }}% 符合
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="searchResults.length === 0 && !showSuggestions && searchInput.length > 0" class="px-4 py-3 text-sm text-gray-500">
        找不到符合的商家
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>