import { ref, onMounted, onUnmounted, nextTick, readonly } from 'vue'

// 效能優化功能
export function usePerformanceOptimization() {
  const performanceMetrics = ref({
    loadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0
  })

  const isOptimizationEnabled = ref(true)
  const memoryUsage = ref(0)
  const renderCount = ref(0)

  // 節流函數
  function throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number | null = null
    let lastExecTime = 0
    
    return (...args: Parameters<T>) => {
      const currentTime = Date.now()
      
      if (currentTime - lastExecTime > delay) {
        func(...args)
        lastExecTime = currentTime
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        timeoutId = window.setTimeout(() => {
          func(...args)
          lastExecTime = Date.now()
        }, delay - (currentTime - lastExecTime))
      }
    }
  }

  // 防抖函數
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number | null = null
    
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = window.setTimeout(() => func(...args), delay)
    }
  }

  // 圖片懶載入
  function lazyLoadImages(container?: HTMLElement) {
    const root = container || document.body
    const images = root.querySelectorAll('img[data-src]')
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.getAttribute('data-src')
            
            if (src) {
              img.src = src
              img.removeAttribute('data-src')
              img.classList.add('loaded')
              observer.unobserve(img)
            }
          }
        })
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      })

      images.forEach(img => imageObserver.observe(img))
      
      return () => {
        images.forEach(img => imageObserver.unobserve(img))
      }
    } else {
      // 降級處理：直接載入所有圖片
      images.forEach(img => {
        const src = img.getAttribute('data-src')
        if (src) {
          (img as HTMLImageElement).src = src
          img.removeAttribute('data-src')
        }
      })
    }
  }

  // 虛擬滾動
  function createVirtualScroller(options: {
    container: HTMLElement
    items: any[]
    itemHeight: number
    renderItem: (item: any, index: number) => HTMLElement
    overscan?: number
  }) {
    const { container, items, itemHeight, renderItem, overscan = 5 } = options
    
    const scrollContainer = document.createElement('div')
    scrollContainer.style.cssText = `
      height: ${items.length * itemHeight}px;
      position: relative;
    `
    
    const viewport = document.createElement('div')
    viewport.style.cssText = `
      height: 100%;
      overflow-y: auto;
    `
    
    const contentContainer = document.createElement('div')
    contentContainer.style.position = 'absolute'
    
    let startIndex = 0
    let endIndex = 0
    let renderedItems: HTMLElement[] = []

    function updateVisibleItems() {
      const scrollTop = viewport.scrollTop
      const viewportHeight = viewport.clientHeight
      
      startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
      endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
      )

      // 清除舊的項目
      renderedItems.forEach(item => item.remove())
      renderedItems = []

      // 渲染新的項目
      for (let i = startIndex; i <= endIndex; i++) {
        const item = renderItem(items[i], i)
        item.style.cssText = `
          position: absolute;
          top: ${i * itemHeight}px;
          width: 100%;
          height: ${itemHeight}px;
        `
        contentContainer.appendChild(item)
        renderedItems.push(item)
      }
    }

    const throttledUpdate = throttle(updateVisibleItems, 16) // ~60fps
    viewport.addEventListener('scroll', throttledUpdate, { passive: true })

    scrollContainer.appendChild(contentContainer)
    viewport.appendChild(scrollContainer)
    container.appendChild(viewport)

    // 初始渲染
    updateVisibleItems()

    return {
      updateItems: (newItems: any[]) => {
        items.splice(0, items.length, ...newItems)
        scrollContainer.style.height = `${items.length * itemHeight}px`
        updateVisibleItems()
      },
      scrollToIndex: (index: number) => {
        viewport.scrollTop = index * itemHeight
      },
      destroy: () => {
        viewport.removeEventListener('scroll', throttledUpdate)
        container.removeChild(viewport)
      }
    }
  }

  // 記憶化快取
  function memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ) {
    const cache = new Map()
    
    return (...args: Parameters<T>): ReturnType<T> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      
      if (cache.has(key)) {
        return cache.get(key)
      }
      
      const result = fn(...args)
      cache.set(key, result)
      
      // 限制快取大小
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value
        cache.delete(firstKey)
      }
      
      return result
    }
  }

  // 批次 DOM 更新
  function batchDOMUpdates(updates: (() => void)[]) {
    return new Promise<void>(resolve => {
      nextTick(() => {
        updates.forEach(update => update())
        resolve()
      })
    })
  }

  // 監控記憶體使用
  function monitorMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      memoryUsage.value = memory.usedJSHeapSize / 1024 / 1024 // MB
    }
  }

  // 預載入資源
  function preloadResources(resources: Array<{
    url: string
    type: 'image' | 'script' | 'style' | 'fetch'
  }>) {
    resources.forEach(resource => {
      switch (resource.type) {
        case 'image':
          const img = new Image()
          img.src = resource.url
          break
          
        case 'script':
          const link = document.createElement('link')
          link.rel = 'preload'
          link.as = 'script'
          link.href = resource.url
          document.head.appendChild(link)
          break
          
        case 'style':
          const styleLink = document.createElement('link')
          styleLink.rel = 'preload'
          styleLink.as = 'style'
          styleLink.href = resource.url
          document.head.appendChild(styleLink)
          break
          
        case 'fetch':
          fetch(resource.url, { method: 'GET' }).catch(() => {
            // 靜默處理預載入錯誤
          })
          break
      }
    })
  }

  // 優化圖片
  function optimizeImages(container?: HTMLElement) {
    const root = container || document.body
    const images = root.querySelectorAll('img') as NodeListOf<HTMLImageElement>
    
    images.forEach(img => {
      // 添加載入和錯誤處理
      if (!img.complete) {
        img.style.backgroundColor = '#f0f0f0'
        img.style.minHeight = '100px'
        
        img.onload = () => {
          img.style.backgroundColor = ''
          img.style.minHeight = ''
        }
        
        img.onerror = () => {
          img.style.backgroundColor = '#ffebee'
          img.style.color = '#c62828'
          img.textContent = '圖片載入失敗'
        }
      }

      // 添加 loading 屬性
      if ('loading' in HTMLImageElement.prototype) {
        img.loading = 'lazy'
      }

      // 添加合適的尺寸
      if (!img.width && !img.height) {
        img.style.maxWidth = '100%'
        img.style.height = 'auto'
      }
    })
  }

  // 收集 Web Vitals 指標
  function collectWebVitals() {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            performanceMetrics.value.firstContentfulPaint = entry.startTime
          }
        })
      })
      observer.observe({ entryTypes: ['paint'] })

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        performanceMetrics.value.largestContentfulPaint = lastEntry.startTime
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          performanceMetrics.value.firstInputDelay = entry.processingStart - entry.startTime
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
    }

    // Page Load Time
    window.addEventListener('load', () => {
      performanceMetrics.value.loadTime = performance.now()
    })
  }

  // 創建效能監控面板
  function createPerformanceMonitor() {
    const monitor = document.createElement('div')
    monitor.id = 'performance-monitor'
    monitor.style.cssText = `
      position: fixed;
      top: 60px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px;
      border-radius: 4px;
      font-size: 11px;
      font-family: monospace;
      z-index: 10003;
      min-width: 200px;
    `

    function updateMonitor() {
      monitorMemoryUsage()
      monitor.innerHTML = `
        <div>載入時間: ${Math.round(performanceMetrics.value.loadTime)}ms</div>
        <div>FCP: ${Math.round(performanceMetrics.value.firstContentfulPaint)}ms</div>
        <div>LCP: ${Math.round(performanceMetrics.value.largestContentfulPaint)}ms</div>
        <div>FID: ${Math.round(performanceMetrics.value.firstInputDelay)}ms</div>
        <div>記憶體: ${memoryUsage.value.toFixed(1)}MB</div>
        <div>渲染次數: ${renderCount.value}</div>
      `
    }

    setInterval(updateMonitor, 1000)
    document.body.appendChild(monitor)

    return monitor
  }

  // 生命週期
  onMounted(() => {
    collectWebVitals()
    lazyLoadImages()
    optimizeImages()
    
    // 開發模式顯示效能監控
    if (process.env.NODE_ENV === 'development') {
      createPerformanceMonitor()
    }

    // 定期監控記憶體
    const memoryInterval = setInterval(monitorMemoryUsage, 5000)
    
    onUnmounted(() => {
      clearInterval(memoryInterval)
    })
  })

  return {
    performanceMetrics: readonly(performanceMetrics),
    memoryUsage: readonly(memoryUsage),
    renderCount: readonly(renderCount),
    throttle,
    debounce,
    lazyLoadImages,
    createVirtualScroller,
    memoize,
    batchDOMUpdates,
    preloadResources,
    optimizeImages,
    monitorMemoryUsage
  }
}

// 全域效能優化
export const globalPerformanceOptimization = usePerformanceOptimization()