<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFilter } from '@/composables/useFilter'
import TransitionWrapper from './TransitionWrapper.vue'
import { useTouchEnhancement } from '@/composables/useTouchEnhancement'

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
const isCollapsing = ref<boolean>(false)

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
    '食': 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
    '購': 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    '住': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    '遊': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
  }
  
  return tagColors[tag] || 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
}

function handleFilterChange(type: string, value: string | boolean) {
  // 添加微動畫回饋
  const button = event?.target as HTMLElement
  if (button) {
    button.style.transform = 'scale(0.95)'
    setTimeout(() => {
      button.style.transform = 'scale(1)'
    }, 100)
  }
  
  // 執行篩選邏輯
  if (type === 'county') {
    toggleCounty(value as string)
  } else if (type === 'tag') {
    toggleTag(value as string)
  } else if (type === 'hakka') {
    toggleHakkaOnly()
  }
}

function handleClearWithAnimation(clearFunction: () => void) {
  isCollapsing.value = true
  setTimeout(() => {
    clearFunction()
    isCollapsing.value = false
  }, 200)
}

// 觸控增強
const { addTouchFeedback, optimizeButtonTouch, addGestureRecognition } = useTouchEnhancement()

onMounted(() => {
  // 為所有按鈕添加觸控優化
  const buttons = document.querySelectorAll('.filter-option, .section-tab, .clear-button')
  buttons.forEach(button => {
    if (button instanceof HTMLElement) {
      optimizeButtonTouch(button)
    }
  })

  // 為面板添加手勢識別
  const panel = document.querySelector('.filter-panel')
  if (panel instanceof HTMLElement) {
    addGestureRecognition(panel, {
      onSwipeRight: handleClose,
      onSwipeLeft: () => {
        // 可以添加其他手勢邏輯
      }
    })
  }
})
</script>

<template>
  <div>
    <!-- Mobile backdrop overlay -->
    <TransitionWrapper name="fade" :appear="false">
      <div 
        v-if="isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 md:hidden z-[99998]"
        @click="handleClose"
      ></div>
    </TransitionWrapper>
    
    <!-- Fixed positioned panel that slides from right -->
    <TransitionWrapper name="slide" :appear="false">
      <div 
        v-if="isOpen"
        class="filter-panel fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-[99999]"
      >
      <div class="flex h-full flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div class="flex items-center">
            <h2 class="text-lg font-semibold text-gray-900">篩選條件</h2>
            <span 
              v-if="showFilterCount"
              class="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 count-badge"
            >
              {{ filterCount }}
            </span>
          </div>
          <button
            @click="handleClose"
            class="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 micro-bounce"
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
            @click="handleClearWithAnimation(clearAllFilters)"
            class="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
            :class="{ 'animate-pulse': isCollapsing }"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
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
          <div v-if="activeSection === 'counties'" class="p-6 filter-section">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-sm font-medium text-gray-900">縣市選擇</h3>
              <button
                v-if="selectedCounties.length > 0"
                @click="handleClearWithAnimation(clearCountyFilters)"
                class="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                :class="{ 'animate-pulse': isCollapsing }"
              >
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                清除
              </button>
            </div>
            <div class="space-y-2">
              <label
                v-for="county in countyStats"
                :key="county.name"
                class="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 cursor-pointer filter-option"
                :class="county.selected ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'"
              >
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    :checked="county.selected"
                    @change="handleFilterChange('county', county.name)"
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
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
          <div v-if="activeSection === 'tags'" class="p-6 filter-section">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-sm font-medium text-gray-900">商家類型</h3>
              <button
                v-if="selectedTags.length > 0"
                @click="handleClearWithAnimation(clearTagFilters)"
                class="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                :class="{ 'animate-pulse': isCollapsing }"
              >
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                清除
              </button>
            </div>
            <div class="space-y-2">
              <label
                v-for="tag in tagStats"
                :key="tag.name"
                class="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 cursor-pointer filter-option"
                :class="tag.selected ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'"
              >
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    :checked="tag.selected"
                    @change="handleFilterChange('tag', tag.name)"
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
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
          <div v-if="activeSection === 'hakka'" class="p-6 filter-section">
            <div class="mb-4">
              <h3 class="text-sm font-medium text-gray-900">客家商家</h3>
              <p class="mt-1 text-sm text-gray-500">
                篩選由客家委員會認證的客家商家
              </p>
            </div>
            <div class="space-y-4">
              <label class="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 cursor-pointer filter-option"
                     :class="isHakkaOnly ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'">
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    :checked="isHakkaOnly"
                    @change="handleFilterChange('hakka', true)"
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
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
    </TransitionWrapper>
  </div>
</template>

<style scoped>
/* Smooth hover effects */
.filter-option {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-option:hover {
  transform: translateY(-1px);
}

.filter-option:active {
  transform: translateY(0) scale(0.98);
}

/* Tab transition */
.tab-indicator {
  transition: all 0.3s ease;
}

/* Count badge animation */
.count-badge {
  animation: bounceIn 0.5s ease-out;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Filter section transition */
.filter-section {
  opacity: 0;
  transform: translateY(10px);
  animation: slideIn 0.3s ease-out forwards;
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Micro interactions */
.micro-bounce {
  transition: transform 0.1s ease;
}

.micro-bounce:active {
  transform: scale(0.95);
}
</style>