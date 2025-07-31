# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個客家小錢地圖 Web App，基於 Vue 3 + Vite 的互動式地圖應用程式。該應用程式使用開源地圖方案展示台灣各地的客家商家，並提供搜尋、篩選和導航功能。

## 開發指令

- **啟動開發伺服器**: `pnpm dev` (使用 Vite 開發伺服器和熱重載)
- **建置生產版本**: `pnpm build` 
- **預覽生產版本**: `pnpm preview`
- **程式碼檢查**: `pnpm lint`
- **類型檢查**: `pnpm type-check`
- **格式化程式碼**: `pnpm format`

專案使用 pnpm 作為套件管理器 (版本 9.5.0+)。

## 技術架構

- **前端框架**: Vue 3 (Composition API + `<script setup>`)
- **建置工具**: Vite 7.x
- **狀態管理**: Pinia
- **地圖引擎**: Leaflet.js
- **搜尋引擎**: Fuse.js
- **樣式框架**: Tailwind CSS (可選)
- **類型檢查**: TypeScript
- **套件管理器**: pnpm

## 專案文件

開發規劃文件位於 `docs/` 目錄：
- `docs/requirements.md` - 需求規格書
- `docs/technical-design.md` - 技術設計文件  
- `docs/development-plan.md` - 開發時程規劃

## 關鍵資料

- **商家資料**: `src/assets/hakkaconcoin-maps.json` 包含 1350 家客家商家資訊
- **資料結構**: 
  ```typescript
  interface Business {
    id: number
    name: string
    introduction: string
    image: string[]
    tag: string[]
    address: string
    contact: string
    business_hours: string | null
    map_url: string
    classification: string
    is_hakka: boolean
    website: string | null
  }
  ```

## 專案結構

```
src/
├── components/           # Vue 元件
│   ├── common/          # 共用元件 (SearchBox, FilterPanel, LoadingSpinner)
│   ├── map/             # 地圖相關元件 (MapContainer, MarkerPopup, MapControls)
│   └── layout/          # 佈局元件 (Header, Sidebar, Footer)
├── composables/         # 組合式函數 (useMap, useSearch, useFilter)
├── stores/              # Pinia stores (mapStore, searchStore, filterStore)
├── types/               # TypeScript 類型定義
├── utils/               # 工具函數 (dataParser, mapHelpers, searchHelpers)
├── assets/              # 靜態資源和資料
└── styles/              # 樣式檔案
docs/                    # 專案文件
```

## 核心功能

1. **地圖顯示**: 使用 Leaflet.js 顯示互動式地圖，商家以錨點形式展示
2. **商家資訊**: 點擊錨點彈出商家詳細資訊，地址可跳轉 Google Maps
3. **搜尋功能**: 支援商家名稱、地址的模糊搜尋
4. **篩選功能**: 支援縣市、標籤等多重篩選條件

## 開發流程

### 重要提醒
每完成一天的工作後，必須：
1. 更新 `docs/development-plan.md` 中對應的任務清單，將完成的項目打勾 ✅
2. 確認是否需要更新 `CLAUDE.md` 檔案，反映最新的專案狀態
3. 提交當天的程式碼變更
4. 確認功能正常運作後，才開始下一天的工作

### 開發階段
- **第 1-2 天**: 環境建置與基礎架構
- **第 3-5 天**: 地圖核心功能開發
- **第 6-7 天**: 搜尋功能開發
- **第 8-9 天**: 篩選功能開發
- **第 10-11 天**: UI/UX 優化
- **第 12 天**: 測試與部署準備

## 效能考量

- 使用 Marker Clustering 處理大量商家標記
- 實作搜尋防抖機制 (300ms)
- 圖片懶載入和預載入
- 虛擬化處理可視範圍內的標記

## 開發注意事項

- 遵循 Vue 3 Composition API 最佳實踐
- 使用 TypeScript 提升程式碼品質
- 元件化設計，提升程式碼重複使用性
- 響應式設計，支援桌面和行動裝置
- 實作適當的錯誤處理和載入狀態