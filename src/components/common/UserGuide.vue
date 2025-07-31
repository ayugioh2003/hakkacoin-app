<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TransitionWrapper from './TransitionWrapper.vue'

// Props
interface Props {
  autoShow?: boolean
  showOnFirstVisit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoShow: false,
  showOnFirstVisit: true
})

// Emits
const emit = defineEmits<{
  close: []
  complete: []
}>()

// State
const isVisible = ref(false)
const currentStep = ref(0)
const isCompleted = ref(false)

// 引導步驟
const guideSteps = [
  {
    id: 'welcome',
    title: '歡迎使用客家幣地圖',
    content: '探索台灣各地的客家商家，發現美食、購物、住宿和旅遊景點。',
    target: '#main-content',
    position: 'center'
  },
  {
    id: 'search',
    title: '搜尋商家',
    content: '使用搜尋欄位尋找特定商家或地址。支援模糊搜尋和智慧建議。',
    target: '.search-input',
    position: 'bottom'
  },
  {
    id: 'filter',
    title: '篩選條件',
    content: '點擊篩選按鈕，依縣市、類型或客家認證來縮小搜尋範圍。',
    target: '[aria-label*="篩選"]',
    position: 'bottom'
  },
  {
    id: 'map',
    title: '互動地圖',
    content: '在地圖上瀏覽商家位置，點擊標記查看詳細資訊。支援縮放和拖拽操作。',
    target: '#map',
    position: 'top'
  },
  {
    id: 'accessibility',
    title: '無障礙功能',
    content: '支援鍵盤導航（Tab 鍵）、螢幕閱讀器，以及高對比和大字體模式。',
    target: '#accessibility-toolbar',
    position: 'left'
  },
  {
    id: 'complete',
    title: '開始探索',
    content: '現在您已經了解基本功能，開始探索客家商家吧！隨時可以再次查看此指南。',
    target: '#main-content',
    position: 'center'
  }
]

// Methods
function showGuide() {
  isVisible.value = true
  currentStep.value = 0
}

function hideGuide() {
  isVisible.value = false
  emit('close')
}

function nextStep() {
  if (currentStep.value < guideSteps.length - 1) {
    currentStep.value++
    highlightTarget()
  } else {
    completeGuide()
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
    highlightTarget()
  }
}

function goToStep(stepIndex: number) {
  if (stepIndex >= 0 && stepIndex < guideSteps.length) {
    currentStep.value = stepIndex
    highlightTarget()
  }
}

function completeGuide() {
  isCompleted.value = true
  localStorage.setItem('guide-completed', 'true')
  hideGuide()
  emit('complete')
}

function skipGuide() {
  localStorage.setItem('guide-skipped', 'true')
  hideGuide()
}

function highlightTarget() {
  // 移除舊的高亮
  const oldHighlights = document.querySelectorAll('.guide-highlight')
  oldHighlights.forEach(highlight => highlight.remove())

  const step = guideSteps[currentStep.value]
  const target = document.querySelector(step.target)
  
  if (target && step.position !== 'center') {
    const rect = target.getBoundingClientRect()
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    // 創建高亮遮罩
    const highlight = document.createElement('div')
    highlight.className = 'guide-highlight'
    highlight.style.cssText = `
      position: absolute;
      left: ${rect.left + scrollLeft - 8}px;
      top: ${rect.top + scrollTop - 8}px;
      width: ${rect.width + 16}px;
      height: ${rect.height + 16}px;
      border: 3px solid #3b82f6;
      border-radius: 8px;
      z-index: 10004;
      pointer-events: none;
      animation: guidePulse 2s infinite;
    `

    document.body.appendChild(highlight)

    // 滾動到目標元素
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    })
  }
}

function getTooltipPosition() {
  const step = guideSteps[currentStep.value]
  const target = document.querySelector(step.target)
  
  if (!target) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

  const rect = target.getBoundingClientRect()
  const tooltipWidth = 320
  const tooltipHeight = 200
  const padding = 20
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  let top = '50%'
  let left = '50%'
  let transform = 'translate(-50%, -50%)'

  switch (step.position) {
    case 'top':
      top = `${Math.max(padding, rect.top - tooltipHeight - padding)}px`
      left = `${rect.left + rect.width / 2}px`
      transform = 'translateX(-50%)'
      // 確保不超出左右邊界
      if (rect.left + rect.width / 2 - tooltipWidth / 2 < padding) {
        left = `${tooltipWidth / 2 + padding}px`
        transform = 'translateX(0)'
      } else if (rect.left + rect.width / 2 + tooltipWidth / 2 > windowWidth - padding) {
        left = `${windowWidth - tooltipWidth / 2 - padding}px`
        transform = 'translateX(-100%)'
      }
      break
    case 'bottom':
      top = `${Math.min(windowHeight - tooltipHeight - padding, rect.bottom + padding)}px`
      left = `${rect.left + rect.width / 2}px`
      transform = 'translateX(-50%)'
      // 確保不超出左右邊界
      if (rect.left + rect.width / 2 - tooltipWidth / 2 < padding) {
        left = `${tooltipWidth / 2 + padding}px`
        transform = 'translateX(0)'
      } else if (rect.left + rect.width / 2 + tooltipWidth / 2 > windowWidth - padding) {
        left = `${windowWidth - tooltipWidth / 2 - padding}px`
        transform = 'translateX(-100%)'
      }
      break
    case 'left':
      top = `${rect.top + rect.height / 2}px`
      left = `${Math.max(padding, rect.left - tooltipWidth - padding)}px`
      transform = 'translateY(-50%)'
      // 如果左邊空間不夠，改為顯示在右邊
      if (rect.left - tooltipWidth - padding < padding) {
        left = `${rect.right + padding}px`
      }
      // 確保不超出上下邊界
      if (rect.top + rect.height / 2 - tooltipHeight / 2 < padding) {
        top = `${padding}px`
        transform = 'translateY(0)'
      } else if (rect.top + rect.height / 2 + tooltipHeight / 2 > windowHeight - padding) {
        top = `${windowHeight - tooltipHeight - padding}px`
        transform = 'translateY(0)'
      }
      break
    case 'right':
      top = `${rect.top + rect.height / 2}px`
      left = `${Math.min(windowWidth - tooltipWidth - padding, rect.right + padding)}px`
      transform = 'translateY(-50%)'
      // 確保不超出上下邊界
      if (rect.top + rect.height / 2 - tooltipHeight / 2 < padding) {
        top = `${padding}px`
        transform = 'translateY(0)'
      } else if (rect.top + rect.height / 2 + tooltipHeight / 2 > windowHeight - padding) {
        top = `${windowHeight - tooltipHeight - padding}px`
        transform = 'translateY(0)'
      }
      break
    default: // center
      top = '50%'
      left = '50%'
      transform = 'translate(-50%, -50%)'
  }

  return { top, left, transform }
}

// Lifecycle
onMounted(() => {
  const isFirstVisit = !localStorage.getItem('guide-completed') && !localStorage.getItem('guide-skipped')
  
  if (props.autoShow || (props.showOnFirstVisit && isFirstVisit)) {
    setTimeout(() => {
      showGuide()
    }, 1000)
  }
})

// Expose methods
defineExpose({
  showGuide,
  hideGuide,
  nextStep,
  prevStep,
  goToStep
})
</script>

<template>
  <div>
    <!-- 引導工具提示 -->
    <TransitionWrapper name="scale" :appear="false">
      <div 
        v-if="isVisible"
        class="fixed z-[10005] bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4"
        :style="getTooltipPosition()"
      >
        <div class="p-6">
          <!-- 步驟指示器 -->
          <div class="flex justify-center mb-4">
            <div class="flex space-x-2">
              <div
                v-for="(step, index) in guideSteps"
                :key="step.id"
                class="w-2 h-2 rounded-full transition-colors duration-200"
                :class="index === currentStep ? 'bg-blue-600' : 'bg-gray-300'"
              ></div>
            </div>
          </div>

          <!-- 內容 -->
          <div class="text-center mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              {{ guideSteps[currentStep].title }}
            </h3>
            <p class="text-gray-600 text-sm leading-relaxed">
              {{ guideSteps[currentStep].content }}
            </p>
          </div>

          <!-- 控制按鈕 -->
          <div class="flex justify-between items-center">
            <button
              v-if="currentStep > 0"
              @click="prevStep"
              class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              上一步
            </button>
            <div v-else></div>

            <div class="flex space-x-3">
              <button
                @click="skipGuide"
                class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                跳過
              </button>
              <button
                @click="nextStep"
                class="px-6 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                {{ currentStep === guideSteps.length - 1 ? '完成' : '下一步' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 步驟計數 -->
        <div class="absolute top-4 right-4 text-xs text-gray-400">
          {{ currentStep + 1 }} / {{ guideSteps.length }}
        </div>
      </div>
    </TransitionWrapper>

    <!-- 重新開啟引導的浮動按鈕 -->
    <TransitionWrapper name="scale" :appear="false">
      <button
        v-if="!isVisible && isCompleted"
        @click="showGuide"
        class="fixed bottom-6 left-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 z-50"
        title="重新開啟使用指南"
        aria-label="重新開啟使用指南"
      >
        <svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </TransitionWrapper>
  </div>
</template>

<style scoped>
@keyframes guidePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
}

/* 確保引導提示在最前面 */
.guide-highlight {
  pointer-events: none;
}
</style>