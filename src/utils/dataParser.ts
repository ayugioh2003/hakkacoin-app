import type { Business, BusinessData } from '@/types'

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
  return data.data.info.map((business) => ({
    ...business,
    county: parseCountyFromAddress(business.address),
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
  const tags = new Set(businesses.flatMap((b) => b.tag))
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