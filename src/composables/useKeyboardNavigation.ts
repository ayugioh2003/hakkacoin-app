import { ref, onMounted, onUnmounted, readonly } from 'vue'

// 鍵盤導航增強
export function useKeyboardNavigation() {
  const currentFocusIndex = ref(-1)
  const focusableElements = ref<HTMLElement[]>([])
  const isNavigating = ref(false)

  // 可聚焦元素的選擇器
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')

  // 更新可聚焦元素列表
  function updateFocusableElements(container?: HTMLElement) {
    const root = container || document.body
    const elements = Array.from(root.querySelectorAll(focusableSelectors)) as HTMLElement[]
    
    // 過濾掉不可見的元素
    focusableElements.value = elements.filter(element => {
      const style = getComputedStyle(element)
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             element.offsetParent !== null
    })
  }

  // 設置焦點
  function setFocus(index: number) {
    if (index >= 0 && index < focusableElements.value.length) {
      currentFocusIndex.value = index
      const element = focusableElements.value[index]
      element.focus()
      
      // 確保元素在視窗中可見
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })

      // 添加視覺焦點指示器
      addFocusIndicator(element)
    }
  }

  // 移動焦點
  function moveFocus(direction: 'next' | 'prev') {
    updateFocusableElements()
    
    if (focusableElements.value.length === 0) return

    let newIndex = currentFocusIndex.value

    if (direction === 'next') {
      newIndex = (newIndex + 1) % focusableElements.value.length
    } else {
      newIndex = newIndex <= 0 ? focusableElements.value.length - 1 : newIndex - 1
    }

    setFocus(newIndex)
  }

  // 跳到第一個/最後一個元素
  function jumpToEnd(position: 'first' | 'last') {
    updateFocusableElements()
    
    if (focusableElements.value.length === 0) return

    const index = position === 'first' ? 0 : focusableElements.value.length - 1
    setFocus(index)
  }

  // 按類型尋找下一個元素
  function findNextByType(type: string) {
    updateFocusableElements()
    
    const currentIndex = currentFocusIndex.value
    const startIndex = (currentIndex + 1) % focusableElements.value.length
    
    for (let i = 0; i < focusableElements.value.length; i++) {
      const index = (startIndex + i) % focusableElements.value.length
      const element = focusableElements.value[index]
      
      if (element.tagName.toLowerCase() === type.toLowerCase() ||
          element.classList.contains(type) ||
          element.dataset.type === type) {
        setFocus(index)
        return
      }
    }
  }

  // 添加視覺焦點指示器
  function addFocusIndicator(element: HTMLElement) {
    // 移除舊的指示器
    const oldIndicators = document.querySelectorAll('.keyboard-focus-indicator')
    oldIndicators.forEach(indicator => indicator.remove())

    // 創建新的指示器
    const indicator = document.createElement('div')
    indicator.className = 'keyboard-focus-indicator'
    indicator.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid #3B82F6;
      border-radius: 4px;
      z-index: 10000;
      animation: focusPulse 0.3s ease-out;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    `

    // 定位指示器
    const rect = element.getBoundingClientRect()
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    indicator.style.left = (rect.left + scrollLeft - 2) + 'px'
    indicator.style.top = (rect.top + scrollTop - 2) + 'px'
    indicator.style.width = (rect.width + 4) + 'px'
    indicator.style.height = (rect.height + 4) + 'px'

    document.body.appendChild(indicator)

    // 自動移除指示器
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator)
      }
    }, 2000)
  }

  // 鍵盤事件處理
  function handleKeyDown(event: KeyboardEvent) {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event
    const modifierPressed = ctrlKey || metaKey || shiftKey || altKey

    // 更新導航狀態
    if (key === 'Tab' || key === 'ArrowUp' || key === 'ArrowDown' || 
        key === 'ArrowLeft' || key === 'ArrowRight') {
      isNavigating.value = true
    }

    // Tab 導航
    if (key === 'Tab' && !modifierPressed) {
      event.preventDefault()
      moveFocus(shiftKey ? 'prev' : 'next')
      return
    }

    // 箭頭鍵導航
    if (key.startsWith('Arrow') && !modifierPressed) {
      event.preventDefault()
      
      switch (key) {
        case 'ArrowDown':
        case 'ArrowRight':
          moveFocus('next')
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          moveFocus('prev')
          break
      }
      return
    }

    // Home/End 鍵
    if ((key === 'Home' || key === 'End') && !modifierPressed) {
      event.preventDefault()
      jumpToEnd(key === 'Home' ? 'first' : 'last')
      return
    }

    // 快捷鍵
    if (ctrlKey || metaKey) {
      switch (key) {
        case 'f':
        case 'F':
          event.preventDefault()
          findNextByType('input')
          break
        case 'b':
        case 'B':
          event.preventDefault()
          findNextByType('button')
          break
      }
    }

    // Escape 鍵 - 清除焦點
    if (key === 'Escape') {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && activeElement !== document.body) {
        activeElement.blur()
        currentFocusIndex.value = -1
      }
    }

    // Enter/Space 鍵 - 激活元素
    if ((key === 'Enter' || key === ' ') && !modifierPressed) {
      const currentElement = focusableElements.value[currentFocusIndex.value]
      if (currentElement) {
        if (currentElement.tagName === 'BUTTON' || 
            currentElement.tagName === 'A' ||
            currentElement.hasAttribute('role')) {
          event.preventDefault()
          currentElement.click()
        }
      }
    }
  }

  // 創建鍵盤導航輔助面板
  function createNavigationHelper() {
    const helper = document.createElement('div')
    helper.id = 'keyboard-navigation-helper'
    helper.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.4;
      z-index: 10001;
      max-width: 300px;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
      pointer-events: none;
    `

    helper.innerHTML = `
      <div><strong>鍵盤導航快捷鍵</strong></div>
      <div>Tab/Shift+Tab: 切換焦點</div>
      <div>箭頭鍵: 方向導航</div>
      <div>Home/End: 跳到開始/結束</div>
      <div>Ctrl+F: 尋找輸入框</div>
      <div>Ctrl+B: 尋找按鈕</div>
      <div>Esc: 清除焦點</div>
    `

    document.body.appendChild(helper)

    // 顯示/隱藏邏輯
    let hideTimeout: number
    
    function showHelper() {
      clearTimeout(hideTimeout)
      helper.style.opacity = '1'
      helper.style.transform = 'translateY(0)'
    }

    function hideHelper() {
      hideTimeout = window.setTimeout(() => {
        helper.style.opacity = '0'
        helper.style.transform = 'translateY(20px)'
      }, 3000)
    }

    // 鍵盤導航時顯示助手
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
        showHelper()
        hideHelper()
      }
    })

    return helper
  }

  // 為特定區域設置鍵盤導航
  function setupScopedNavigation(container: HTMLElement, options: {
    circular?: boolean
    skipDisabled?: boolean
    autoFocus?: boolean
  } = {}) {
    const { circular = true, skipDisabled = true, autoFocus = false } = options

    function handleScopedKeyDown(event: KeyboardEvent) {
      const { key, shiftKey } = event
      
      if (key === 'Tab') {
        event.preventDefault()
        event.stopPropagation()
        
        updateFocusableElements(container)
        
        if (focusableElements.value.length === 0) return

        const activeElement = document.activeElement as HTMLElement
        const currentIndex = focusableElements.value.indexOf(activeElement)
        
        let nextIndex = currentIndex
        
        if (shiftKey) {
          nextIndex = currentIndex <= 0 
            ? (circular ? focusableElements.value.length - 1 : 0)
            : currentIndex - 1
        } else {
          nextIndex = currentIndex >= focusableElements.value.length - 1
            ? (circular ? 0 : focusableElements.value.length - 1)
            : currentIndex + 1
        }

        setFocus(nextIndex)
      }
    }

    container.addEventListener('keydown', handleScopedKeyDown)

    if (autoFocus) {
      updateFocusableElements(container)
      if (focusableElements.value.length > 0) {
        setFocus(0)
      }
    }

    return () => {
      container.removeEventListener('keydown', handleScopedKeyDown)
    }
  }

  // 生命週期
  onMounted(() => {
    updateFocusableElements()
    document.addEventListener('keydown', handleKeyDown)
    
    // 創建導航助手
    createNavigationHelper()

    // 添加 CSS 動畫
    const style = document.createElement('style')
    style.textContent = `
      @keyframes focusPulse {
        0% {
          transform: scale(1);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          transform: scale(1.02);
          opacity: 1;
        }
      }
      
      /* 改善原生焦點樣式 */
      *:focus {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }
      
      /* 隱藏瀏覽器預設焦點樣式（當使用自訂指示器時） */
      .keyboard-focus-indicator ~ *:focus {
        outline: none;
      }
    `
    document.head.appendChild(style)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    
    // 清理指示器和助手
    const indicators = document.querySelectorAll('.keyboard-focus-indicator')
    indicators.forEach(indicator => indicator.remove())
    
    const helper = document.getElementById('keyboard-navigation-helper')
    if (helper) {
      helper.remove()
    }
  })

  return {
    currentFocusIndex: readonly(currentFocusIndex),
    focusableElements: readonly(focusableElements),
    isNavigating: readonly(isNavigating),
    updateFocusableElements,
    setFocus,
    moveFocus,
    jumpToEnd,
    findNextByType,
    setupScopedNavigation
  }
}

// 全域鍵盤導航
export const globalKeyboardNavigation = useKeyboardNavigation()