// 商家資料類型定義
export interface Business {
  id: number
  name: string
  introduction: string
  image: string[]
  tag: string[]
  discount_info: string
  address: string
  contact: string
  business_hours: string | null
  map_url: string
  classification: string
  is_hakka: boolean
  website: string | null
  // 計算屬性
  county?: string
  coordinates?: [number, number]
}

// 搜尋相關類型
export interface SearchOptions {
  keys: string[]
  threshold: number
  includeScore: boolean
}

export interface SearchResult {
  item: Business
  score?: number
}

// 篩選相關類型
export interface FilterOptions {
  counties: string[]
  tags: string[]
  isHakka?: boolean
}

// 地圖相關類型
export interface MapState {
  center: [number, number]
  zoom: number
  bounds?: [[number, number], [number, number]]
}

// API 響應類型
export interface BusinessData {
  // 支援原始格式和新格式
  code?: number
  message?: string
  status?: string
  msg?: string
  data: {
    total?: number       // 原始格式
    total_count?: number // 新格式
    page?: number
    page_size?: number
    total_page?: number
    info: Business[]
  }
}