import { ref, computed, readonly } from 'vue'

// 過渡狀態管理
const transitionStates = ref({
  mapLoading: false,
  searchActive: false,
  filterActive: false,
  dataLoading: false
})

// 過渡配置
const transitionConfig = {
  map: {
    enterDelay: 100,
    leaveDelay: 0,
    duration: 400
  },
  search: {
    enterDelay: 200,
    leaveDelay: 0,
    duration: 300
  },
  filter: {
    enterDelay: 0,
    leaveDelay: 100,
    duration: 350
  },
  content: {
    enterDelay: 150,
    leaveDelay: 50,
    duration: 250
  }
}

export function useTransitions() {
  // 設定過渡狀態
  function setTransitionState(key: keyof typeof transitionStates.value, value: boolean) {
    transitionStates.value[key] = value
  }

  // 獲取過渡狀態
  function getTransitionState(key: keyof typeof transitionStates.value) {
    return transitionStates.value[key]
  }

  // 計算動態過渡名稱
  const dynamicTransitionName = computed(() => {
    if (transitionStates.value.dataLoading) return 'bounce'
    if (transitionStates.value.filterActive) return 'slide'
    if (transitionStates.value.searchActive) return 'fade'
    return 'scale'
  })

  // 序列化過渡動畫
  async function sequenceTransitions(transitions: Array<{
    element: string
    delay: number
    callback?: () => void
  }>) {
    for (const transition of transitions) {
      await new Promise(resolve => {
        setTimeout(() => {
          transition.callback?.()
          resolve(void 0)
        }, transition.delay)
      })
    }
  }

  // 協調多個元件的過渡
  async function coordinatedTransition(
    exitElements: string[],
    enterElements: string[],
    options: {
      exitDelay?: number
      enterDelay?: number
      stagger?: number
    } = {}
  ) {
    const { exitDelay = 0, enterDelay = 100, stagger = 50 } = options

    // 先退出現有元件
    if (exitElements.length > 0) {
      await sequenceTransitions(
        exitElements.map((element, index) => ({
          element,
          delay: exitDelay + (index * stagger),
          callback: () => setTransitionState(element as any, false)
        }))
      )
    }

    // 再進入新元件
    if (enterElements.length > 0) {
      await sequenceTransitions(
        enterElements.map((element, index) => ({
          element,
          delay: enterDelay + (index * stagger),
          callback: () => setTransitionState(element as any, true)
        }))
      )
    }
  }

  // 預設的頁面過渡
  function pageTransition(direction: 'enter' | 'leave' = 'enter') {
    const elements = ['mapLoading', 'searchActive']
    
    if (direction === 'enter') {
      return coordinatedTransition([], elements, {
        enterDelay: 200,
        stagger: 100
      })
    } else {
      return coordinatedTransition(elements, [], {
        exitDelay: 0,
        stagger: 50
      })
    }
  }

  // 搜尋與篩選的協調過渡
  function searchFilterTransition(activeMode: 'search' | 'filter' | 'none') {
    switch (activeMode) {
      case 'search':
        setTransitionState('searchActive', true)
        setTransitionState('filterActive', false)
        break
      case 'filter':
        setTransitionState('searchActive', false)
        setTransitionState('filterActive', true)
        break
      case 'none':
        setTransitionState('searchActive', false)
        setTransitionState('filterActive', false)
        break
    }
  }

  // 載入狀態過渡
  function loadingTransition(isLoading: boolean) {
    if (isLoading) {
      return coordinatedTransition(
        ['searchActive', 'filterActive'], 
        ['dataLoading'],
        { exitDelay: 0, enterDelay: 100 }
      )
    } else {
      return coordinatedTransition(
        ['dataLoading'], 
        ['mapLoading'],
        { exitDelay: 200, enterDelay: 300 }
      )
    }
  }

  // React 式的過渡效果（用於交互回饋）
  function reactiveTransition(element: HTMLElement, type: 'click' | 'hover' | 'focus') {
    const animations = {
      click: [
        { transform: 'scale(0.95)', duration: 100 },
        { transform: 'scale(1)', duration: 150 }
      ],
      hover: [
        { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', duration: 200 }
      ],
      focus: [
        { outline: '2px solid #3B82F6', outlineOffset: '2px', duration: 150 }
      ]
    }

    const keyframes = animations[type]
    if (keyframes.length === 1) {
      element.animate(keyframes, { duration: keyframes[0].duration, fill: 'forwards' })
    } else {
      keyframes.forEach((keyframe, index) => {
        setTimeout(() => {
          element.animate([keyframe], { duration: keyframe.duration, fill: 'forwards' })
        }, index * 100)
      })
    }
  }

  // 重置所有過渡狀態
  function resetTransitions() {
    Object.keys(transitionStates.value).forEach(key => {
      transitionStates.value[key as keyof typeof transitionStates.value] = false
    })
  }

  return {
    // 狀態
    transitionStates: readonly(transitionStates),
    dynamicTransitionName,
    transitionConfig,

    // 方法
    setTransitionState,
    getTransitionState,
    sequenceTransitions,
    coordinatedTransition,
    pageTransition,
    searchFilterTransition,
    loadingTransition,
    reactiveTransition,
    resetTransitions
  }
}

// 全域過渡工具
export const globalTransitions = useTransitions()