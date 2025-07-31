import Fuse from 'fuse.js'
import type { Business, SearchOptions, SearchResult } from '@/types'

/**
 * 預設搜尋選項
 */
export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  keys: [
    { name: 'name', weight: 0.4 },      // 商家名稱權重最高
    { name: 'address', weight: 0.3 },   // 地址權重次之
    { name: 'tag', weight: 0.2 },       // 標籤權重適中
    { name: 'introduction', weight: 0.1 } // 介紹權重最低
  ],
  threshold: 0.4, // 稍微寬鬆的匹配閾值
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
    shouldSort: true, // 根據相關性排序
    fieldNormWeight: 1, // 欄位長度正規化權重
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
  
  const lowerQuery = query.toLowerCase()
  const suggestions = new Map<string, number>() // 建議項目和其權重
  
  businesses.forEach(business => {
    // 商家名稱建議（權重最高）
    if (business.name.toLowerCase().includes(lowerQuery)) {
      const weight = business.name.toLowerCase().startsWith(lowerQuery) ? 10 : 5
      suggestions.set(business.name, (suggestions.get(business.name) || 0) + weight)
    }
    
    // 縣市建議
    if (business.county && business.county.toLowerCase().includes(lowerQuery)) {
      const weight = business.county.toLowerCase().startsWith(lowerQuery) ? 8 : 4
      suggestions.set(business.county, (suggestions.get(business.county) || 0) + weight)
    }
    
    // 標籤建議
    business.tag.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) {
        const weight = tag.toLowerCase().startsWith(lowerQuery) ? 6 : 3
        suggestions.set(tag, (suggestions.get(tag) || 0) + weight)
      }
    })
    
    // 地址關鍵字建議（從地址中提取有意義的詞彙）
    const addressParts = business.address.split(/[縣市鄉鎮區里路街段巷弄號]/);
    addressParts.forEach(part => {
      const trimmed = part.trim()
      if (trimmed.length > 1 && trimmed.toLowerCase().includes(lowerQuery)) {
        suggestions.set(trimmed, (suggestions.get(trimmed) || 0) + 2)
      }
    })
  })
  
  // 根據權重排序並返回
  return Array.from(suggestions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([suggestion]) => suggestion)
}