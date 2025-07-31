import { ref, onMounted, onUnmounted, readonly } from 'vue'

// 觸控增強功能
export function useTouchEnhancement() {
  const isTouchDevice = ref(false)
  const touchStartTime = ref(0)
  const touchPosition = ref({ x: 0, y: 0 })
  const isLongPress = ref(false)

  // 檢測是否為觸控裝置
  function detectTouchDevice() {
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  // 觸控回饋效果
  function addTouchFeedback(element: HTMLElement, options: {
    scale?: number
    duration?: number
    ripple?: boolean
    haptic?: boolean
  } = {}) {
    const { scale = 0.95, duration = 150, ripple = false, haptic = false } = options

    function handleTouchStart(e: TouchEvent) {
      touchStartTime.value = Date.now()
      const touch = e.touches[0]
      touchPosition.value = { x: touch.clientX, y: touch.clientY }
      
      // 觸控縮放效果
      element.style.transform = `scale(${scale})`
      element.style.transition = `transform ${duration}ms ease-out`
      
      // 觸控回饋（震動）
      if (haptic && navigator.vibrate) {
        navigator.vibrate(10)
      }

      // 漣漪效果
      if (ripple) {
        createRippleEffect(element, touch.clientX, touch.clientY)
      }
    }

    function handleTouchEnd() {
      const touchDuration = Date.now() - touchStartTime.value
      isLongPress.value = touchDuration > 500

      // 恢復原始大小
      element.style.transform = 'scale(1)'
      
      // 長按效果處理
      if (isLongPress.value) {
        element.dispatchEvent(new CustomEvent('longpress', {
          detail: { duration: touchDuration, position: touchPosition.value }
        }))
      }
    }

    function handleTouchCancel() {
      element.style.transform = 'scale(1)'
    }

    // 添加事件監聽器
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    // 返回清理函數
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
    }
  }

  // 創建漣漪效果
  function createRippleEffect(element: HTMLElement, x: number, y: number) {
    const ripple = document.createElement('div')
    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = (x - rect.left - size / 2) + 'px'
    ripple.style.top = (y - rect.top - size / 2) + 'px'
    ripple.style.position = 'absolute'
    ripple.style.borderRadius = '50%'
    ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'
    ripple.style.transform = 'scale(0)'
    ripple.style.animation = 'ripple 0.6s ease-out'
    ripple.style.pointerEvents = 'none'
    ripple.style.zIndex = '1000'

    // 確保父元素有相對定位
    const originalPosition = element.style.position
    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative'
    }

    element.appendChild(ripple)

    // 清理漣漪效果
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple)
      }
      // 恢復原始 position
      if (originalPosition) {
        element.style.position = originalPosition
      }
    }, 600)
  }

  // 改善滾動體驗（慣性滾動）
  function enhanceScrolling(element: HTMLElement) {
    element.style.webkitOverflowScrolling = 'touch'
    element.style.overflowScrolling = 'touch'
    
    // 添加滾動緩衝區
    let isScrolling = false
    let scrollTimeout: number

    function handleScroll() {
      if (!isScrolling) {
        element.style.pointerEvents = 'none'
      }
      isScrolling = true

      clearTimeout(scrollTimeout)
      scrollTimeout = window.setTimeout(() => {
        isScrolling = false
        element.style.pointerEvents = 'auto'
      }, 150)
    }

    element.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      element.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }

  // 手勢識別
  function addGestureRecognition(element: HTMLElement, callbacks: {
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    onSwipeUp?: () => void
    onSwipeDown?: () => void
    onPinch?: (scale: number) => void
    onLongPress?: (position: { x: number, y: number }) => void
  } = {}) {
    let startX = 0, startY = 0
    let startDistance = 0
    let startTime = 0
    const minSwipeDistance = 50
    const maxSwipeTime = 300

    function handleTouchStart(e: TouchEvent) {
      startTime = Date.now()
      
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        startDistance = getDistance(e.touches[0], e.touches[1])
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      const endTime = Date.now()
      const timeDiff = endTime - startTime

      if (e.changedTouches.length === 1 && timeDiff < maxSwipeTime) {
        const endX = e.changedTouches[0].clientX
        const endY = e.changedTouches[0].clientY
        const deltaX = endX - startX
        const deltaY = endY - startY
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        if (distance > minSwipeDistance) {
          const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
          
          if (angle > -45 && angle <= 45) {
            callbacks.onSwipeRight?.()
          } else if (angle > 45 && angle <= 135) {
            callbacks.onSwipeDown?.()
          } else if (angle > 135 || angle <= -135) {
            callbacks.onSwipeLeft?.()
          } else if (angle > -135 && angle <= -45) {
            callbacks.onSwipeUp?.()
          }
        }
      }

      // 長按檢測
      if (timeDiff > 500 && e.changedTouches.length === 1) {
        callbacks.onLongPress?.({
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY
        })
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length === 2) {
        const currentDistance = getDistance(e.touches[0], e.touches[1])
        const scale = currentDistance / startDistance
        callbacks.onPinch?.(scale)
      }
    }

    function getDistance(touch1: Touch, touch2: Touch) {
      const dx = touch1.clientX - touch2.clientX
      const dy = touch1.clientY - touch2.clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchmove', handleTouchMove)
    }
  }

  // 針對按鈕的觸控優化
  function optimizeButtonTouch(button: HTMLElement) {
    // 增加觸控目標大小
    const minTouchSize = 44 // iOS/Android 建議的最小觸控目標
    const computedStyle = getComputedStyle(button)
    const currentHeight = parseInt(computedStyle.height)
    const currentWidth = parseInt(computedStyle.width)

    if (currentHeight < minTouchSize) {
      button.style.minHeight = `${minTouchSize}px`
      button.style.paddingTop = button.style.paddingBottom = 
        `${Math.max(0, (minTouchSize - currentHeight) / 2)}px`
    }

    if (currentWidth < minTouchSize) {
      button.style.minWidth = `${minTouchSize}px`
      button.style.paddingLeft = button.style.paddingRight = 
        `${Math.max(0, (minTouchSize - currentWidth) / 2)}px`
    }

    // 添加觸控回饋
    return addTouchFeedback(button, {
      scale: 0.96,
      duration: 120,
      ripple: true,
      haptic: true
    })
  }

  // 生命週期
  onMounted(() => {
    detectTouchDevice()

    // 添加全域 CSS for 觸控優化
    if (isTouchDevice.value) {
      const style = document.createElement('style')
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        
        /* 改善觸控滾動 */
        * {
          -webkit-overflow-scrolling: touch;
          overflow-scrolling: touch;
        }
        
        /* 防止觸控時的藍色高亮 */
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        /* 允許文字選擇的元素 */
        input, textarea, [contenteditable] {
          -webkit-user-select: auto;
          user-select: auto;
        }
      `
      document.head.appendChild(style)
    }
  })

  return {
    isTouchDevice: readonly(isTouchDevice),
    isLongPress: readonly(isLongPress),
    addTouchFeedback,
    createRippleEffect,
    enhanceScrolling,
    addGestureRecognition,
    optimizeButtonTouch
  }
}

// 全域觸控增強
export const globalTouchEnhancement = useTouchEnhancement()