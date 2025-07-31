# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個 Vue 3 + Vite 應用程式，用於展示客家幣商家資訊。此應用程式專注於展示台灣各地的客家企業和服務，資料儲存在一個包含商家詳細資訊、位置和營業資訊的大型 JSON 檔案中。

## 開發指令

- **啟動開發伺服器**: `pnpm dev` (使用 Vite 開發伺服器和熱重載)
- **建置生產版本**: `pnpm build` 
- **預覽生產版本**: `pnpm preview`

專案使用 pnpm 作為套件管理器 (版本 9.5.0+)。

## 架構

- **框架**: Vue 3 搭配 Composition API (`<script setup>` 語法)
- **建置工具**: Vite 7.x
- **套件管理器**: pnpm
- **進入點**: `src/main.js` - 建立 Vue 應用程式並掛載到 `#app`
- **主要元件**: `src/App.vue` - 目前顯示 Vite/Vue 標誌和 HelloWorld 元件

## 關鍵資料

- **商家資料**: `src/assets/hakkaconcoin-maps.json` 包含大量商家資訊 (~1350 家企業)
  - 每個商家包含：id、名稱、介紹、圖片、標籤、地址、聯絡方式、營業時間、地圖連結、分類和客家身份
  - 資料涵蓋台灣各地企業，類別包括食品 (食)、服務業等
  - 所有文字內容為繁體中文

## 專案結構

```
src/
├── App.vue           # 根元件
├── main.js          # 應用程式進入點
├── style.css        # 全域樣式
├── components/      # Vue 元件
│   └── HelloWorld.vue
└── assets/          # 靜態資源和資料
    ├── vue.svg
    └── hakkaconcoin-maps.json  # 主要商家資料
```

## 開發注意事項

- 專案目前處於初始設定狀態，使用預設的 Vite/Vue 範本結構
- 未偵測到程式碼檢查、測試或 TypeScript 配置
- 大型 JSON 資料檔案顯示這將是一個資料驅動的應用程式，用於顯示商家資訊
- 元件架構可能需要擴展以處理商家列表、地圖和篩選功能