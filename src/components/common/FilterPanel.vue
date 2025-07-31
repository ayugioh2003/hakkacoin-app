<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFilter } from '@/composables/useFilter'

// Props
interface Props {
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false
})

// Emits
const emit = defineEmits<{
  close: []
}>()

// Filter composable
const {
  availableCounties,
  availableTags,
  hasActiveFilters,
  filterCount,
  selectedCounties,
  selectedTags,
  isHakkaOnly,
  filterStats,
  countyStats,
  tagStats,
  hakkaStats,
  toggleCounty,
  toggleTag,
  toggleHakkaOnly,
  clearAllFilters,
  clearCountyFilters,
  clearTagFilters,
  isCountySelected,
  isTagSelected
} = useFilter()

// Local state
const activeSection = ref<string>('counties')

// Computed
const showFilterCount = computed(() => {
  return hasActiveFilters.value && filterCount.value > 0
})

// Methods
function handleClose() {
  emit('close')
}

function setActiveSection(section: string) {
  activeSection.value = section
}

function getTagColor(tag: string): string {
  const tagColors: Record<string, string> = {
    '食': 'bg-red-100 text-red-800 border-red-200',
    '購': 'bg-blue-100 text-blue-800 border-blue-200',
    '住': 'bg-green-100 text-green-800 border-green-200',
    '遊': 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
  
  return tagColors[tag] || 'bg-gray-100 text-gray-800 border-gray-200'
}
</script>

<template>
  <div>
    <!-- Mobile backdrop overlay -->
    <div 
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
      @click="handleClose"
    ></div>
    
    <!-- Fixed positioned panel that slides from right -->
    <div 
      class="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out"
      :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="flex h-full flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div class="flex items-center">
            <h2 class="text-lg font-semibold text-gray-900">篩選條件</h2>
            <span 
              v-if="showFilterCount"
              class="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
            >
              {{ filterCount }}
            </span>
          </div>
          <button
            @click="handleClose"
            class="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Filter Stats -->
        <div class="border-b border-gray-200 px-6 py-4">
          <div class="text-sm text-gray-600">
            顯示 <span class="font-semibold text-gray-900">{{ filterStats.filtered }}</span> 
            / <span class="text-gray-500">{{ filterStats.total }}</span> 家商家
            <span v-if="hasActiveFilters" class="text-blue-600">
              ({{ filterStats.percentage }}%)
            </span>
          </div>
          <button
            v-if="hasActiveFilters"
            @click="clearAllFilters"
            class="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            清除所有篩選條件
          </button>
        </div>

        <!-- Filter Sections -->
        <div class="flex-1 overflow-y-auto">
          <!-- Section Tabs -->
          <div class="border-b border-gray-200">
            <nav class="flex">
              <button
                @click="setActiveSection('counties')"
                class="flex-1 border-b-2 px-4 py-3 text-sm font-medium"
                :class="activeSection === 'counties' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              >
                縣市 ({{ countyStats.filter(c => c.selected).length }})
              </button>
              <button
                @click="setActiveSection('tags')"
                class="flex-1 border-b-2 px-4 py-3 text-sm font-medium"
                :class="activeSection === 'tags' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              >
                類型 ({{ tagStats.filter(t => t.selected).length }})
              </button>
              <button
                @click="setActiveSection('hakka')"
                class="flex-1 border-b-2 px-4 py-3 text-sm font-medium"
                :class="activeSection === 'hakka' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              >
                客家
              </button>
            </nav>
          </div>

          <!-- Counties Section -->
          <div v-if="activeSection === 'counties'" class="p-6">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-sm font-medium text-gray-900">縣市選擇</h3>
              <button
                v-if="selectedCounties.length > 0"
                @click="clearCountyFilters"
                class="text-sm text-blue-600 hover:text-blue-700"
              >
                清除
              </button>
            </div>
            <div class="space-y-2">
              <label
                v-for="county in countyStats"
                :key="county.name"
                class="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                :class="county.selected ? 'border-blue-200 bg-blue-50' : 'border-gray-200'"
              >
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    :checked="county.selected"
                    @change="toggleCounty(county.name)"
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-3 text-sm font-medium text-gray-900">
                    {{ county.name }}
                  </span>
                </div>
                <span class="text-sm text-gray-500">
                  {{ county.count }}
                </span>
              </label>
            </div>
          </div>

          <!-- Tags Section -->
          <div v-if="activeSection === 'tags'" class="p-6">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-sm font-medium text-gray-900">商家類型</h3>
              <button
                v-if="selectedTags.length > 0"
                @click="clearTagFilters"
                class="text-sm text-blue-600 hover:text-blue-700"
              >
                清除
              </button>
            </div>
            <div class="space-y-2">
              <label
                v-for="tag in tagStats"
                :key="tag.name"
                class="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                :class="tag.selected ? 'border-blue-200 bg-blue-50' : 'border-gray-200'"
              >
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    :checked="tag.selected"
                    @change="toggleTag(tag.name)"
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span 
                    class="ml-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                    :class="getTagColor(tag.name)"
                  >
                    {{ tag.name }}
                  </span>
                </div>
                <span class="text-sm text-gray-500">
                  {{ tag.count }}
                </span>
              </label>
            </div>
          </div>

          <!-- Hakka Section -->
          <div v-if="activeSection === 'hakka'" class="p-6">
            <div class="mb-4">
              <h3 class="text-sm font-medium text-gray-900">客家商家</h3>
              <p class="mt-1 text-sm text-gray-500">
                篩選由客家委員會認證的客家商家
              </p>
            </div>
            <div class="space-y-4">
              <label class="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                     :class="isHakkaOnly ? 'border-blue-200 bg-blue-50' : 'border-gray-200'">
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    :checked="isHakkaOnly"
                    @change="toggleHakkaOnly"
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div class="ml-3">
                    <span class="text-sm font-medium text-gray-900">
                      僅顯示客家商家
                    </span>
                    <p class="text-xs text-gray-500">
                      {{ hakkaStats.count }} 家 ({{ hakkaStats.percentage }}%)
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                    客家認證
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>