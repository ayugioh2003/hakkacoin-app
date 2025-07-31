import Fuse from 'fuse.js'
import type { Business, SearchOptions, SearchResult } from '@/types'

/**
 * 預設搜尋選項
 */
export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  keys: ['name', 'address', 'introduction', 'tag'],
  threshold: 0.3, // 模糊匹配閾值，0 表示完全匹配，1 表示完全不匹配
  includeScore: true,
}

/**
 * 建立搜尋引擎實例
 */
export function createSearchEngine(businesses: Business[], options: Partial<SearchOptions> = {}): Fuse<Business> {
  const searchOptions = { ...DEFAULT_SEARCH_OPTIONS, ...options }
  
  return new Fuse(businesses, {
    keys: searchOptions.keys,
    threshold: searchOptions.threshold,
    includeScore: searchOptions.includeScore,
    // 額外設定
    ignoreLocation: true, // 忽略字串位置，提升搜尋品質
    findAllMatches: true, // 尋找所有匹配項
    minMatchCharLength: 1, // 最小匹配字元長度
  })
}

/**
 * 執行搜尋
 */
export function performSearch(
  searchEngine: Fuse<Business>,
  query: string,
  limit = 50
): SearchResult[] {
  if (!query.trim()) return []
  
  const results = searchEngine.search(query, { limit })
  
  return results.map(result => ({
    item: result.item,
    score: result.score,
  }))
}

/**
 * 按名稱搜尋
 */
export function searchByName(businesses: Business[], query: string): Business[] {
  if (!query.trim()) return []
  
  const fuse = new Fuse(businesses, {
    keys: ['name'],
    threshold: 0.2,
    ignoreLocation: true,
  })
  
  return fuse.search(query).map(result => result.item)
}

/**
 * 按地址搜尋
 */
export function searchByAddress(businesses: Business[], query: string): Business[] {
  if (!query.trim()) return []
  
  const fuse = new Fuse(businesses, {
    keys: ['address', 'county'],
    threshold: 0.3,
    ignoreLocation: true,
  })
  
  return fuse.search(query).map(result => result.item)
}

/**
 * 按關鍵字搜尋 (綜合搜尋)
 */
export function searchByKeyword(businesses: Business[], query: string): Business[] {
  if (!query.trim()) return []
  
  const searchEngine = createSearchEngine(businesses)
  const results = performSearch(searchEngine, query)
  
  return results.map(result => result.item)
}

/**
 * 高亮搜尋結果
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * 建立搜尋建議
 */
export function createSearchSuggestions(businesses: Business[], query: string, limit = 5): string[] {
  if (!query.trim() || query.length < 2) return []
  
  const suggestions = new Set<string>()
  
  // 從商家名稱中提取建議
  businesses.forEach(business => {
    if (business.name.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(business.name)
    }
    
    // 從縣市中提取建議
    if (business.county && business.county.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(business.county)
    }
    
    // 從標籤中提取建議
    business.tag.forEach(tag => {
      if (tag.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(tag)
      }
    })
  })
  
  return Array.from(suggestions).slice(0, limit)
}