#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Business {
  id: number
  name: string
  address: string
  coordinates?: [number, number]
  geocodeInfo?: {
    matchedAddress?: string
    score?: number
    locationType?: string
    processedAt?: string
  }
  [key: string]: any
}

interface ArcGISResponse {
  candidates: Array<{
    address: string
    location: {
      x: number
      y: number
    }
    score: number
    attributes: {
      Addr_type: string
      Match_addr: string
      StAddr: string
      City: string
    }
  }>
}

// ArcGIS 地理編碼函數
async function geocodeAddressArcGIS(address: string): Promise<{
  coordinates: [number, number] | null
  matchedAddress?: string
  score?: number
  locationType?: string
}> {
  const url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates'
  const params = new URLSearchParams({
    SingleLine: address,
    f: 'json',
    outSR: JSON.stringify({ wkid: 4326 }),
    outFields: 'Addr_type,Match_addr,StAddr,City',
    maxLocations: '6'
  })

  try {
    const response = await fetch(`${url}?${params}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: ArcGISResponse = await response.json()
    
    if (data.candidates && data.candidates.length > 0) {
      // 選擇分數最高的結果
      const bestMatch = data.candidates.reduce((prev, current) => 
        current.score > prev.score ? current : prev
      )
      
      return {
        coordinates: [bestMatch.location.y, bestMatch.location.x], // 注意：緯度在前
        matchedAddress: bestMatch.attributes.Match_addr,
        score: bestMatch.score,
        locationType: bestMatch.attributes.Addr_type
      }
    }
  } catch (error) {
    console.error(`Geocoding failed for ${address}:`, error)
  }
  
  return { coordinates: null }
}

// 批次處理函數
async function processBusinesses(startFrom = 0, batchSize = 100) {
  const jsonPath = path.join(__dirname, '../src/assets/hakkacoin-maps.json')
  const coordinatesPath = path.join(__dirname, '../src/assets/coordinates.json')
  const mergedPath = path.join(__dirname, '../src/assets/hakkacoin-maps-with-coordinates.json')
  
  // 讀取原始資料
  const rawData = fs.readFileSync(jsonPath, 'utf-8')
  const data = JSON.parse(rawData)
  const businesses: Business[] = data.data.info
  
  // 讀取或建立座標檔案
  let coordinatesData: Record<number, {
    coordinates: [number, number]
    geocodeInfo: any
  }> = {}
  
  if (fs.existsSync(coordinatesPath)) {
    coordinatesData = JSON.parse(fs.readFileSync(coordinatesPath, 'utf-8'))
  }
  
  // 處理統計
  let processed = 0
  let successful = 0
  let failed = 0
  const startTime = Date.now()
  
  // 建立進度檔案
  const progressPath = path.join(__dirname, '../geocoding-progress.json')
  let progress: any = {}
  if (fs.existsSync(progressPath)) {
    progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'))
  }
  
  console.log(`🚀 Starting geocoding from index ${startFrom}...`)
  console.log(`📊 Total businesses: ${businesses.length}`)
  console.log(`⚡ Rate limit: 50 requests per minute`)
  
  // 批次處理
  for (let i = startFrom; i < Math.min(startFrom + batchSize, businesses.length); i++) {
    const business = businesses[i]
    
    // 跳過已有座標的商家（除非要強制更新）
    if (coordinatesData[business.id] && !process.argv.includes('--force')) {
      console.log(`⏭️  Skipping ${i + 1}/${businesses.length}: ${business.name} (已有座標)`)
      continue
    }
    
    processed++
    console.log(`\n🔍 Processing ${i + 1}/${businesses.length}: ${business.name}`)
    console.log(`   地址: ${business.address}`)
    
    // 執行地理編碼
    const result = await geocodeAddressArcGIS(business.address)
    
    if (result.coordinates) {
      // 儲存座標到獨立的物件中
      coordinatesData[business.id] = {
        coordinates: result.coordinates,
        geocodeInfo: {
          matchedAddress: result.matchedAddress,
          score: result.score,
          locationType: result.locationType,
          processedAt: new Date().toISOString()
        }
      }
      successful++
      console.log(`   ✅ 成功: [${result.coordinates[0]}, ${result.coordinates[1]}]`)
      console.log(`   📍 匹配地址: ${result.matchedAddress}`)
      console.log(`   📊 匹配分數: ${result.score}`)
    } else {
      failed++
      console.log(`   ❌ 失敗: 無法找到座標`)
      
      // 記錄失敗的地址
      if (!progress.failed) progress.failed = []
      progress.failed.push({
        id: business.id,
        name: business.name,
        address: business.address
      })
    }
    
    // 更新進度
    progress.lastProcessed = i
    progress.successful = successful
    progress.failed_count = failed
    progress.lastUpdated = new Date().toISOString()
    
    // 每 10 筆儲存一次
    if (processed % 10 === 0) {
      fs.writeFileSync(coordinatesPath, JSON.stringify(coordinatesData, null, 2))
      fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2))
      console.log(`\n💾 Progress saved: ${successful} successful, ${failed} failed`)
    }
    
    // 速率限制：每分鐘最多 50 個請求
    // 每個請求後等待 1.2 秒（50請求/60秒）
    await new Promise(resolve => setTimeout(resolve, 1200))
  }
  
  // 最終儲存座標資料
  fs.writeFileSync(coordinatesPath, JSON.stringify(coordinatesData, null, 2))
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2))
  
  // 建立整合檔案（合併原始資料與座標）
  const mergedBusinesses = businesses.map(business => {
    const coordData = coordinatesData[business.id]
    if (coordData) {
      return {
        ...business,
        coordinates: coordData.coordinates,
        geocodeInfo: coordData.geocodeInfo
      }
    }
    return business
  })
  
  const mergedData = {
    ...data,
    data: {
      ...data.data,
      info: mergedBusinesses
    }
  }
  
  fs.writeFileSync(mergedPath, JSON.stringify(mergedData, null, 2))
  console.log(`\n✅ 整合檔案已建立: ${mergedPath}`)
  
  // 顯示統計
  const duration = (Date.now() - startTime) / 1000 / 60
  console.log('\n' + '='.repeat(50))
  console.log('📊 地理編碼完成統計：')
  console.log(`   處理數量: ${processed}`)
  console.log(`   成功: ${successful}`)
  console.log(`   失敗: ${failed}`)
  console.log(`   成功率: ${(successful / processed * 100).toFixed(1)}%`)
  console.log(`   執行時間: ${duration.toFixed(1)} 分鐘`)
  console.log('='.repeat(50))
  
  // 如果還有未處理的，提示繼續
  const nextIndex = startFrom + batchSize
  if (nextIndex < businesses.length) {
    console.log(`\n👉 還有 ${businesses.length - nextIndex} 筆待處理`)
    console.log(`   執行以下命令繼續：`)
    console.log(`   npm run geocode -- --start ${nextIndex}`)
  }
}

// 主程式
async function main() {
  const args = process.argv.slice(2)
  let startFrom = 0
  let batchSize = 100
  
  // 解析參數
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--start' && args[i + 1]) {
      startFrom = parseInt(args[i + 1])
    }
    if (args[i] === '--batch' && args[i + 1]) {
      batchSize = parseInt(args[i + 1])
    }
    if (args[i] === '--help') {
      console.log(`
使用方式：
  npm run geocode                    # 從頭開始處理 100 筆
  npm run geocode -- --start 100     # 從第 100 筆開始
  npm run geocode -- --batch 50      # 每批處理 50 筆
  npm run geocode -- --force         # 強制更新已有座標的商家
  
範例：
  npm run geocode -- --start 100 --batch 50  # 從第 100 筆開始，處理 50 筆
      `)
      process.exit(0)
    }
  }
  
  await processBusinesses(startFrom, batchSize)
}

// 執行
main().catch(console.error)