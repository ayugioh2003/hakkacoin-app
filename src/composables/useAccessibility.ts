import { ref, onMounted, onUnmounted, nextTick, readonly } from 'vue'

// 無障礙功能增強
export function useAccessibility() {
  const announcements = ref<string[]>([])
  const isHighContrast = ref(false)
  const fontSize = ref<'small' | 'medium' | 'large'>('medium')
  const reducedMotion = ref(false)

  // 螢幕閱讀器通知
  function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    announcements.value.push(message)
    
    // 創建或更新 ARIA live region
    let liveRegion = document.getElementById(`aria-live-${priority}`)
    
    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = `aria-live-${priority}`
      liveRegion.setAttribute('aria-live', priority)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `
      document.body.appendChild(liveRegion)
    }

    // 清空然後設置新訊息（確保螢幕閱讀器會讀出）
    liveRegion.textContent = ''
    setTimeout(() => {
      liveRegion!.textContent = message
    }, 100)

    // 清理舊訊息
    setTimeout(() => {
      const index = announcements.value.indexOf(message)
      if (index > -1) {
        announcements.value.splice(index, 1)
      }
    }, 5000)
  }

  // 改善焦點管理
  function manageFocus(options: {
    container?: HTMLElement
    skipToContent?: boolean
    trapFocus?: boolean
    restoreFocus?: HTMLElement
  } = {}) {
    const { container, skipToContent, trapFocus, restoreFocus } = options

    // 跳到主要內容
    if (skipToContent) {
      const mainContent = document.querySelector('main, [role="main"], #main-content')
      if (mainContent instanceof HTMLElement) {
        mainContent.focus()
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    // 焦點陷阱
    if (trapFocus && container) {
      return createFocusTrap(container, restoreFocus)
    }

    return null
  }

  // 創建焦點陷阱
  function createFocusTrap(container: HTMLElement, restoreFocus?: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable?.focus()
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable?.focus()
          }
        }
      }

      if (e.key === 'Escape') {
        releaseFocusTrap()
      }
    }

    function releaseFocusTrap() {
      container.removeEventListener('keydown', handleKeyDown)
      if (restoreFocus) {
        restoreFocus.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstFocusable?.focus()

    return releaseFocusTrap
  }

  // 改善 ARIA 標籤
  function enhanceAriaLabels(container?: HTMLElement) {
    const root = container || document.body

    // 為沒有標籤的互動元素添加標籤
    const unlabeledButtons = root.querySelectorAll('button:not([aria-label]):not([aria-labelledby])')
    unlabeledButtons.forEach((button, index) => {
      const text = button.textContent?.trim()
      if (!text) {
        button.setAttribute('aria-label', `按鈕 ${index + 1}`)
      }
    })

    // 為表單元素添加必要的 ARIA 屬性
    const inputs = root.querySelectorAll('input, select, textarea')
    inputs.forEach(input => {
      const label = root.querySelector(`label[for="${input.id}"]`)
      if (!label && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        const placeholder = input.getAttribute('placeholder')
        if (placeholder) {
          input.setAttribute('aria-label', placeholder)
        }
      }

      // 為必填欄位添加 aria-required
      if (input.hasAttribute('required') && !input.getAttribute('aria-required')) {
        input.setAttribute('aria-required', 'true')
      }
    })

    // 為連結添加描述性標籤
    const links = root.querySelectorAll('a[href]:not([aria-label])')
    links.forEach(link => {
      const text = link.textContent?.trim()
      if (text === '了解更多' || text === '點擊這裡' || text === '查看') {
        const context = link.closest('[data-context]')?.getAttribute('data-context')
        if (context) {
          link.setAttribute('aria-label', `${text} - ${context}`)
        }
      }
    })
  }

  // 高對比模式
  function toggleHighContrast() {
    isHighContrast.value = !isHighContrast.value
    
    if (isHighContrast.value) {
      document.documentElement.classList.add('high-contrast')
      announceToScreenReader('已啟用高對比模式')
    } else {
      document.documentElement.classList.remove('high-contrast')
      announceToScreenReader('已停用高對比模式')
    }

    localStorage.setItem('high-contrast', isHighContrast.value.toString())
  }

  // 字體大小調整
  function setFontSize(size: 'small' | 'medium' | 'large') {
    fontSize.value = size
    
    // 移除舊的類別
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large')
    
    // 添加新的類別
    document.documentElement.classList.add(`font-${size}`)
    
    localStorage.setItem('font-size', size)
    announceToScreenReader(`字體大小已設為${size === 'small' ? '小' : size === 'large' ? '大' : '中'}`)
  }

  // 檢測使用者偏好
  function detectUserPreferences() {
    // 檢測高對比偏好
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      isHighContrast.value = true
      document.documentElement.classList.add('high-contrast')
    }

    // 檢測動畫偏好
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reducedMotion.value = true
      document.documentElement.classList.add('reduced-motion')
    }

    // 從本地存儲載入偏好
    const savedHighContrast = localStorage.getItem('high-contrast')
    if (savedHighContrast !== null) {
      isHighContrast.value = savedHighContrast === 'true'
      if (isHighContrast.value) {
        document.documentElement.classList.add('high-contrast')
      }
    }

    const savedFontSize = localStorage.getItem('font-size') as 'small' | 'medium' | 'large'
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }
  }

  // 創建無障礙工具欄
  function createAccessibilityToolbar() {
    const toolbar = document.createElement('div')
    toolbar.id = 'accessibility-toolbar'
    toolbar.setAttribute('role', 'toolbar')
    toolbar.setAttribute('aria-label', '無障礙工具')
    toolbar.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px;
      display: flex;
      gap: 8px;
      z-index: 10002;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      font-size: 14px;
    `

    // 跳到主要內容按鈕
    const skipButton = document.createElement('button')
    skipButton.textContent = '跳到主要內容'
    skipButton.setAttribute('aria-label', '跳到主要內容')
    skipButton.onclick = () => manageFocus({ skipToContent: true })

    // 高對比按鈕
    const contrastButton = document.createElement('button')
    contrastButton.textContent = '高對比'
    contrastButton.setAttribute('aria-label', '切換高對比模式')
    contrastButton.onclick = toggleHighContrast

    // 字體大小按鈕
    const fontSizeContainer = document.createElement('div')
    fontSizeContainer.innerHTML = `
      <label for="font-size-select" style="margin-right: 4px;">字體:</label>
      <select id="font-size-select" aria-label="選擇字體大小">
        <option value="small">小</option>
        <option value="medium" selected>中</option>
        <option value="large">大</option>
      </select>
    `
    
    const fontSelect = fontSizeContainer.querySelector('select') as HTMLSelectElement
    fontSelect.onchange = () => setFontSize(fontSelect.value as any)

    toolbar.appendChild(skipButton)
    toolbar.appendChild(contrastButton)
    toolbar.appendChild(fontSizeContainer)

    document.body.appendChild(toolbar)

    return toolbar
  }

  // 為圖片添加替代文字
  function enhanceImages(container?: HTMLElement) {
    const root = container || document.body
    const images = root.querySelectorAll('img:not([alt])')
    
    images.forEach((img, index) => {
      const src = img.getAttribute('src') || ''
      const filename = src.split('/').pop()?.split('.')[0] || `圖片${index + 1}`
      img.setAttribute('alt', `圖片：${filename}`)
    })
  }

  // 改善表格無障礙性
  function enhanceTables(container?: HTMLElement) {
    const root = container || document.body
    const tables = root.querySelectorAll('table')
    
    tables.forEach((table, index) => {
      if (!table.getAttribute('role')) {
        table.setAttribute('role', 'table')
      }
      
      if (!table.querySelector('caption') && !table.getAttribute('aria-label')) {
        table.setAttribute('aria-label', `資料表格 ${index + 1}`)
      }

      // 為表頭添加 scope 屬性
      const headers = table.querySelectorAll('th')
      headers.forEach(header => {
        if (!header.getAttribute('scope')) {
          const isInFirstRow = header.closest('tr') === table.querySelector('tr')
          header.setAttribute('scope', isInFirstRow ? 'col' : 'row')
        }
      })
    })
  }

  // 檢查無障礙問題
  function auditAccessibility(container?: HTMLElement) {
    const root = container || document.body
    const issues: string[] = []

    // 檢查缺少 alt 屬性的圖片
    const imagesWithoutAlt = root.querySelectorAll('img:not([alt])')
    if (imagesWithoutAlt.length > 0) {
      issues.push(`發現 ${imagesWithoutAlt.length} 張圖片缺少替代文字`)
    }

    // 檢查空的連結
    const emptyLinks = root.querySelectorAll('a[href]:empty, a[href]:not([aria-label]):not([aria-labelledby])')
    const emptyLinkCount = Array.from(emptyLinks).filter(link => !link.textContent?.trim()).length
    if (emptyLinkCount > 0) {
      issues.push(`發現 ${emptyLinkCount} 個空的或無標籤的連結`)
    }

    // 檢查缺少標籤的表單元素
    const unlabeledInputs = root.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')
    const unlabeledCount = Array.from(unlabeledInputs).filter(input => {
      const id = input.getAttribute('id')
      return !id || !root.querySelector(`label[for="${id}"]`)
    }).length
    if (unlabeledCount > 0) {
      issues.push(`發現 ${unlabeledCount} 個缺少標籤的表單元素`)
    }

    return issues
  }

  // 生命週期
  onMounted(() => {
    detectUserPreferences()
    enhanceAriaLabels()
    enhanceImages()
    enhanceTables()
    
    // 創建無障礙工具欄（開發模式）
    // 暫時隱藏無障礙工具欄
    // if (process.env.NODE_ENV === 'development') {
    //   createAccessibilityToolbar()
    // }

    // 添加無障礙 CSS
    const style = document.createElement('style')
    style.textContent = `
      /* 高對比模式 */
      .high-contrast {
        --bg-color: #000000;
        --text-color: #ffffff;
        --border-color: #ffffff;
        --link-color: #ffff00;
      }
      
      .high-contrast * {
        background-color: var(--bg-color) !important;
        color: var(--text-color) !important;
        border-color: var(--border-color) !important;
      }
      
      .high-contrast a {
        color: var(--link-color) !important;
      }
      
      /* 字體大小 */
      .font-small { font-size: 14px; }
      .font-medium { font-size: 16px; }
      .font-large { font-size: 18px; }
      
      /* 減少動畫 */
      .reduced-motion *,
      .reduced-motion *::before,
      .reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      
      /* 改善焦點樣式 */
      *:focus-visible {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
        box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.2);
      }
      
      /* 跳過連結 */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 0 0 4px 4px;
        z-index: 10003;
      }
      
      .skip-link:focus {
        top: 0;
      }
    `
    document.head.appendChild(style)

    // 添加跳過連結
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.className = 'skip-link'
    skipLink.textContent = '跳到主要內容'
    document.body.insertBefore(skipLink, document.body.firstChild)
  })

  return {
    announcements: readonly(announcements),
    isHighContrast: readonly(isHighContrast),
    fontSize: readonly(fontSize),
    reducedMotion: readonly(reducedMotion),
    announceToScreenReader,
    manageFocus,
    createFocusTrap,
    enhanceAriaLabels,
    toggleHighContrast,
    setFontSize,
    enhanceImages,
    enhanceTables,
    auditAccessibility
  }
}

// 全域無障礙功能
export const globalAccessibility = useAccessibility()