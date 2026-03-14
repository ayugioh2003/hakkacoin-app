import type { Business, BusinessData } from '@/types'

/**
 * 標籤 ID 對應表（API 回傳數字 ID，需轉換為中文標籤）
 */
export const TAG_ID_MAP: Record<number, string> = {
  1: '食',
  2: '住',
  3: '遊',
  4: '購',
  5: '其他',
  6: '其他',
  0: '其他',
}

/**
 * 將標籤 ID 或字串轉換為中文標籤
 */
export function resolveTagLabel(tag: number | string): string {
  if (typeof tag === 'number') {
    return TAG_ID_MAP[tag] ?? '其他'
  }
  const num = Number(tag)
  if (!isNaN(num) && TAG_ID_MAP[num] !== undefined) {
    return TAG_ID_MAP[num]
  }
  // 已經是中文標籤，直接回傳
  return tag
}

/**
 * 從地址解析縣市
 */
export function parseCountyFromAddress(address: string): string {
  const countyMatches = address.match(/^(.{2,3}[縣市])/)
  return countyMatches ? countyMatches[1] : '其他'
}

/**
 * 解析商家 JSON 資料
 */
export function parseBusinessData(data: BusinessData): Business[] {
  return data.data.info.map((business: any) => ({
    ...business,
    tag: Array.isArray(business.tag)
      ? business.tag.map((t: number | string) => resolveTagLabel(t))
      : [],
    county: business.city || parseCountyFromAddress(business.address),
  }))
}

/**
 * 取得所有縣市列表
 */
export function getCounties(businesses: Business[]): string[] {
  const counties = new Set(
    businesses.map((b) => b.county).filter((county): county is string => Boolean(county))
  )
  return Array.from(counties).sort()
}

/**
 * 取得所有標籤列表
 */
export function getTags(businesses: Business[]): string[] {
  const tags = new Set(businesses.flatMap((b) => b.tag.map(t => String(t).trim()).filter(Boolean)))
  return Array.from(tags).sort()
}

/**
 * 驗證商家資料格式
 */
export function validateBusinessData(data: unknown): data is BusinessData {
  if (typeof data !== 'object' || data === null) return false
  
  const typedData = data as any
  
  // 支援兩種格式：
  // 1. 原始格式：{ data: { total: number, info: [] } }
  // 2. 新格式：{ code: number, message: string, data: { total_count: number, info: [] } }
  
  const hasValidDataStructure = typeof typedData.data === 'object' && Array.isArray(typedData.data.info)
  const hasValidTotal = typeof typedData.data.total === 'number' || typeof typedData.data.total_count === 'number'
  const hasValidBusinesses = typedData.data.info.every((item: any) => 
    typeof item.id === 'number' &&
    typeof item.name === 'string' &&
    typeof item.address === 'string'
  )
  
  return hasValidDataStructure && hasValidTotal && hasValidBusinesses
}