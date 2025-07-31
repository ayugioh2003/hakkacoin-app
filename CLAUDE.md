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
- **地理編碼**: `pnpm geocode` (執行 ArcGIS 地址轉座標)
- **資料同步**: `pnpm fetch-data` (從 Hakkacoin API 取得最新資料)

專案使用 pnpm 作為套件管理器 (版本 9.5.0+)。

## 技術架構

- **前端框架**: Vue 3 (Composition API + `<script setup>`)
- **建置工具**: Vite 7.x
- **狀態管理**: Pinia
- **地圖引擎**: Leaflet.js (with Marker Clustering)
- **搜尋引擎**: Fuse.js (模糊搜尋 + 權重配置)
- **樣式框架**: Tailwind CSS
- **類型檢查**: TypeScript
- **套件管理器**: pnpm

## 專案文件

開發規劃文件位於 `docs/` 目錄：
- `docs/requirements.md` - 需求規格書
- `docs/technical-design.md` - 技術設計文件  
- `docs/development-plan.md` - 開發時程規劃

## 關鍵資料

- **原始商家資料**: `src/assets/hakkacoin-maps.json` 包含 1350 家客家商家資訊（保持不變）
- **座標資料**: `src/assets/coordinates.json` 包含商家的經緯度資訊（獨立儲存）
- **整合資料**: `src/assets/hakkacoin-maps-with-coordinates.json` 合併商家資訊與座標（Web App 使用）
- **資料來源**: https://api.hakkacoin.com.tw/api/v1/store/list
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
    coordinates?: [number, number]  // 經緯度（透過 ArcGIS 地理編碼取得）
    geocodeInfo?: {                 // 地理編碼資訊
      matchedAddress?: string
      score?: number
      locationType?: string
      processedAt?: string
    }
  }
  ```

## 專案結構

```
src/
├── components/           # Vue 元件
│   ├── common/          # 共用元件 (SearchBox, FilterPanel, LoadingSpinner)
│   ├── map/             # 地圖相關元件 (MapContainer, MarkerPopup, MapControls)
│   └── layout/          # 佈局元件 (Header, Sidebar, Footer)
├── composables/         # 組合式函數 (useMap, useSearch, useFilter, useBusinesses)
├── stores/              # Pinia stores (mapStore, searchStore, filterStore)
├── types/               # TypeScript 類型定義
├── utils/               # 工具函數 (dataParser, mapHelpers, searchHelpers)
├── assets/              # 靜態資源和資料
└── styles/              # 樣式檔案
scripts/                 # 工具腳本
├── geocode-arcgis.ts    # ArcGIS 地理編碼腳本
└── fetch-hakkacoin-data.ts # Hakkacoin API 資料同步腳本
docs/                    # 專案文件
```

## 核心功能

1. **地圖顯示**: 使用 Leaflet.js 顯示互動式地圖，商家以錨點形式展示
2. **商家資訊**: 點擊錨點彈出商家詳細資訊，地址可跳轉 Google Maps
3. **搜尋功能**: 支援商家名稱、地址的模糊搜尋，含智慧建議和搜尋歷史
4. **篩選功能**: 支援縣市、標籤、客家認證等多重篩選條件

## 開發流程

### 重要提醒
每完成一天的工作後，必須：
1. 更新 `docs/development-plan.md` 中對應的任務清單，將完成的項目打勾 ✅
2. 確認是否需要更新 `CLAUDE.md` 檔案，反映最新的專案狀態
3. 提交當天的程式碼變更
4. 確認功能正常運作後，才開始下一天的工作

### 開發階段
- **第 1-2 天**: 環境建置與基礎架構 ✅
- **第 3-4 天**: 地圖核心功能開發 ✅
- **第 5 天**: 地理編碼與資料管理 ✅
- **第 6 天**: 地圖互動優化 ✅
- **第 7-8 天**: 搜尋功能開發 ✅
- **第 9-10 天**: 篩選功能開發 ✅
- **第 11 天**: 界面設計與佈局 ✅
- **第 12 天**: UI/UX 最終優化
- **第 13 天**: 測試與部署準備

### 已完成功能
- TypeScript 開發環境配置
- Pinia stores 架構（mapStore, searchStore, filterStore）
- 商家資料載入機制（優先使用含座標的整合檔案）
- 資料解析與處理工具
- 完整 composables（useBusinesses, useMap, useSearch, useFilter）
- 地圖顯示功能（MapContainer 元件）
- 地圖控制元件（MapControls - 縮放、重置、定位）
- Leaflet.js 整合與 OpenStreetMap 瓦片圖層
- 商家標記功能（自訂圖示、點擊事件、高亮顯示）
- MarkerPopup 元件（彈出視窗）
- Marker Clustering（標記群集，已修復動畫錯誤）
- Google Maps 整合（地址跳轉）
- ArcGIS 地理編碼功能（批次地址轉座標）
- Hakkacoin API 資料同步功能
- 資料版本控制與去重機制
- 地圖載入狀態與錯誤處理
- 響應式地圖尺寸調整（含防抖）
- 地圖事件防抖機制
- 無障礙支援（aria-label）
- **搜尋功能**（SearchBox 元件）:
  - 模糊搜尋（Fuse.js 整合，權重配置優化）
  - 智慧搜尋建議（商家名稱、縣市、標籤、地址關鍵字）
  - 搜尋歷史管理（自動記錄、清除、重複搜尋）
  - 搜尋結果高亮顯示（地圖標記高亮 + 脈動動畫）
  - 鍵盤導航支援（上下鍵選擇、Enter 確認、Esc 關閉）
  - 防抖搜尋機制（300ms 延遲）
- **篩選功能**（FilterPanel 元件）:
  - 縣市篩選（按地理位置篩選，顯示各縣市商家數量）
  - 商家類型篩選（食、購、住、遊分類，彩色標籤顯示）
  - 客家認證篩選（客家委員會認證商家）
  - 即時統計資訊（篩選結果數量、百分比、隱藏數量）
  - 清除功能（個別類別和全部篩選條件清除）
  - 滑出式面板設計（從右側滑出，不遮擋地圖）
  - 響應式設計（桌面版無背景遮罩，手機版有背景遮罩）
  - 狀態持久化（localStorage 自動保存和恢復篩選條件）
  - 進階動畫效果（滑入動畫、彈跳效果、微互動回饋）
  - 多重篩選組合（縣市+標籤+客家認證任意組合）
  - 優化的視覺設計（陰影、顏色過渡、hover 效果）
- **界面設計與佈局**（Day 11 完成）:
  - Header.vue 元件（標題、標誌、搜尋整合、篩選按鈕）
  - LoadingSpinner.vue 元件（多尺寸、多顏色、可配置文字）
  - ErrorMessage.vue 元件（錯誤、警告、資訊類型，可關閉）
  - Sidebar.vue 元件（未來擴展用，分頁設計）
  - 響應式佈局設計系統（container-responsive、card、btn 類別）
  - 全域樣式系統（src/styles/globals.css，自訂 CSS 類別）
  - Tailwind CSS 擴展配置（客家色彩主題、自訂動畫）
  - 行動裝置優化（safe-area 支援、響應式設計）
  - 無障礙支援改進（focus-visible-ring、適當的 ARIA 標籤）

## 效能考量

- 使用 Marker Clustering 處理大量商家標記（禁用動畫以避免錯誤）
- 實作搜尋防抖機制 (300ms)
- 圖片懶載入和預載入
- 虛擬化處理可視範圍內的標記
- 地理編碼速率限制（50 請求/分鐘）

## 開發注意事項

- 遵循 Vue 3 Composition API 最佳實踐
- 使用 TypeScript 提升程式碼品質
- 元件化設計，提升程式碼重複使用性
- 響應式設計，支援桌面和行動裝置
- 實作適當的錯誤處理和載入狀態
- 原始資料檔案（hakkacoin-maps.json）保持不變，座標資料獨立儲存
- 使用整合檔案（hakkacoin-maps-with-coordinates.json）供 Web App 使用

## 工具腳本說明

### geocode-arcgis.ts
- **用途**: 批次將商家地址轉換為經緯度座標
- **執行**: `pnpm geocode`
- **參數**:
  - `--start <number>`: 從指定索引開始處理
  - `--batch <number>`: 每批處理的筆數（預設 100）
  - `--force`: 強制更新已有座標的商家
- **輸出**: 
  - `coordinates.json`: 座標資料
  - `hakkacoin-maps-with-coordinates.json`: 整合檔案

### fetch-hakkacoin-data.ts
- **用途**: 從 Hakkacoin API 同步最新商家資料
- **執行**: `pnpm fetch-data`
- **參數**:
  - `--page-size <number>`: 每頁筆數（預設 300）
  - `--merge`: 合併現有座標資料
  - `--max <number>`: 限制最大筆數（預設無限制）
- **功能**: 自動去重、版本控制、備份原始檔案