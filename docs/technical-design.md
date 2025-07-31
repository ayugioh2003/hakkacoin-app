# 客家幣地圖 Web App 技術設計文件

## 技術架構概覽

### 整體架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │   Business      │    │      Data       │
│     Layer       │    │     Layer       │    │     Layer       │
│                 │    │                 │    │                 │
│ Vue Components  │◄──►│ Composables     │◄──►│ JSON Data       │
│ Leaflet Map     │    │ Store (Pinia)   │    │ Static Assets   │
│ Search UI       │    │ Utils           │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 技術選型

### 核心技術棧
- **前端框架**: Vue 3 (Composition API)
- **建置工具**: Vite
- **狀態管理**: Pinia
- **類型檢查**: TypeScript
- **地圖引擎**: Leaflet.js
- **地圖瓦片**: OpenStreetMap
- **CSS 框架**: Tailwind CSS（推薦）或原生 CSS

### 主要依賴套件
```json
{
  "dependencies": {
    "vue": "^3.x",
    "pinia": "^2.x",
    "leaflet": "^1.9.x",
    "fuse.js": "^7.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/leaflet": "^1.9.x",
    "tailwindcss": "^3.x"
  }
}
```

### 技術選型理由

#### Leaflet.js 選用原因
- 輕量級（~42KB gzipped）
- 開源且社群活躍
- 完整的 TypeScript 支援
- 豐富的插件生態系統
- 與 Vue 3 整合容易

#### Fuse.js 選用原因
- 輕量級模糊搜尋引擎
- 支援複合搜尋條件
- 效能優異
- 無需後端支援

## 系統架構設計

### 目錄結構
```
src/
├── components/           # Vue 元件
│   ├── common/          # 共用元件
│   │   ├── SearchBox.vue
│   │   ├── FilterPanel.vue
│   │   └── LoadingSpinner.vue
│   ├── map/             # 地圖相關元件
│   │   ├── MapContainer.vue
│   │   ├── MarkerPopup.vue
│   │   └── MapControls.vue
│   └── layout/          # 佈局元件
│       ├── Header.vue
│       ├── Sidebar.vue
│       └── Footer.vue
├── composables/         # 組合式函數
│   ├── useMap.ts
│   ├── useSearch.ts
│   ├── useFilter.ts
│   └── useGeolocation.ts
├── stores/              # Pinia stores
│   ├── mapStore.ts
│   ├── searchStore.ts
│   └── filterStore.ts
├── types/               # TypeScript 類型定義
│   ├── store.ts
│   ├── map.ts
│   └── business.ts
├── utils/               # 工具函數
│   ├── dataParser.ts
│   ├── mapHelpers.ts
│   └── searchHelpers.ts
├── assets/              # 靜態資源
│   ├── hakkacoin-maps.json
│   ├── icons/
│   └── images/
└── styles/              # 樣式檔案
    ├── main.css
    ├── map.css
    └── components.css
```

## 核心元件設計

### 1. MapContainer.vue
**職責**: 主要地圖容器元件
```typescript
interface MapContainerProps {
  businesses: Business[]
  filteredBusinesses: Business[]
  selectedBusiness?: Business
}

interface MapContainerEmits {
  markerClick: [business: Business]
  mapReady: []
}
```

### 2. SearchBox.vue
**職責**: 搜尋輸入元件
```typescript
interface SearchBoxProps {
  placeholder?: string
  businesses: Business[]
}

interface SearchBoxEmits {
  search: [query: string, results: Business[]]
  clear: []
}
```

### 3. FilterPanel.vue
**職責**: 篩選面板元件
```typescript
interface FilterPanelProps {
  businesses: Business[]
  availableCounties: string[]
  availableTags: string[]
}

interface FilterPanelEmits {
  filter: [filters: FilterOptions]
  reset: []
}
```

### 4. MarkerPopup.vue
**職責**: 商家資訊彈出視窗
```typescript
interface MarkerPopupProps {
  business: Business
  showFullInfo?: boolean
}

interface MarkerPopupEmits {
  openGoogleMaps: [url: string]
  close: []
}
```

## 資料流設計

### 狀態管理架構
```typescript
// mapStore.ts
interface MapState {
  map: Map | null
  businesses: Business[]
  filteredBusinesses: Business[]
  selectedBusiness: Business | null
  mapCenter: [number, number]
  mapZoom: number
  isLoading: boolean
}

// searchStore.ts
interface SearchState {
  query: string
  searchResults: Business[]
  searchHistory: string[]
  isSearching: boolean
}

// filterStore.ts
interface FilterState {
  selectedCounties: string[]
  selectedTags: string[]
  availableCounties: string[]
  availableTags: string[]
}
```

### 資料流向
```
JSON Data → dataParser → mapStore.businesses → 
filteredBusinesses (computed) → MapContainer → Leaflet Markers
                ↑
      searchStore + filterStore
```

## API 設計

### 搜尋 API
```typescript
interface SearchService {
  searchByName(query: string, businesses: Business[]): Business[]
  searchByAddress(query: string, businesses: Business[]): Business[]
  searchByKeyword(query: string, businesses: Business[]): Business[]
}
```

### 篩選 API
```typescript
interface FilterService {
  filterByCounty(businesses: Business[], counties: string[]): Business[]
  filterByTag(businesses: Business[], tags: string[]): Business[]
  combineFilters(businesses: Business[], filters: FilterOptions): Business[]
}
```

### 地圖 API
```typescript
interface MapService {
  initializeMap(containerId: string): Map
  addMarkers(map: Map, businesses: Business[]): void
  updateMarkers(map: Map, businesses: Business[]): void
  centerMapOnBusinesses(map: Map, businesses: Business[]): void
}
```

## 資料模型

### Business 類型定義
```typescript
interface Business {
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
```

### 搜尋相關類型
```typescript
interface SearchOptions {
  keys: string[]           // 搜尋欄位
  threshold: number        // 模糊匹配閾值
  includeScore: boolean    // 是否包含分數
}

interface FilterOptions {
  counties: string[]
  tags: string[]
  isHakka?: boolean
}
```

## 效能優化策略

### 1. 地圖效能優化
- 使用 Marker Clustering 處理大量標記
- 實作虛擬化，只渲染可視範圍內的標記
- 使用防抖處理地圖移動事件

### 2. 搜尋效能優化
- 實作搜尋防抖（300ms）
- 使用 Web Workers 處理大量資料搜尋
- 建立搜尋索引快取

### 3. 資料載入優化
- 實作懶載入，分批載入商家資料
- 使用 Service Worker 快取地圖瓦片
- 圖片懶載入和預載入

## 安全性考量

### 1. 資料安全
- 客戶端資料驗證
- XSS 防護（Vue 3 預設保護）
- 避免敏感資訊洩露

### 2. 地圖安全
- 限制地圖存取範圍
- 防止過度縮放導致效能問題
- 實作請求頻率限制

## 部署架構

### 靜態網站部署
```
GitHub Pages / Netlify / Vercel
├── index.html
├── assets/
│   ├── js/
│   ├── css/
│   └── images/
└── data/
    └── businesses.json
```

### 建置流程
```bash
npm run build    # Vite 建置
npm run preview  # 本地預覽
npm run deploy   # 部署至靜態主機
```

## 測試策略

### 1. 單元測試
- 使用 Vitest
- 測試 composables 和 utils
- 測試資料處理邏輯

### 2. 元件測試
- 使用 Vue Test Utils
- 測試使用者互動
- 測試事件發送

### 3. E2E 測試
- 使用 Cypress
- 測試完整使用者流程
- 測試跨瀏覽器相容性

## 瀏覽器相容性

### 支援目標
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

### Polyfills 需求
- 針對舊版瀏覽器的 ES2020 特性
- Leaflet.js 相容性檢查