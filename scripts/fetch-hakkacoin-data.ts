#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface ApiResponse {
  code?: number
  message?: string
  data: {
    page?: number
    page_size?: number
    total_page?: number
    total_count?: number
    total: number
    info: any[]
  }
}

// 延遲函數
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 重試函數
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response
    } catch (error) {
      lastError = error as Error
      console.log(`❌ 請求失敗 (嘗試 ${i + 1}/${maxRetries}): ${lastError.message}`)
      
      if (i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 1000 // 指數退避: 1s, 2s, 4s
        console.log(`⏳ 等待 ${waitTime / 1000} 秒後重試...`)
        await delay(waitTime)
      }
    }
  }
  
  throw lastError
}

// 取得單頁資料
async function fetchPage(page: number, pageSize: number): Promise<ApiResponse> {
  const url = `https://api.hakkacoin.com.tw/api/v1/store/list?language=tw&page=${page}&page_size=${pageSize}`
  console.log(`\n📡 正在請求第 ${page} 頁...`)
  console.log(`   URL: ${url}`)
  
  const response = await fetchWithRetry(url)
  const data: ApiResponse = await response.json()
  
  // 檢查是否有資料
  if (!data.data || !data.data.info) {
    console.log('   完整回應:', JSON.stringify(data, null, 2))
    throw new Error(`API 回應格式錯誤`)
  }
  
  console.log(`   取得筆數: ${data.data.info.length}`)
  console.log(`   總筆數: ${data.data.total || data.data.total_count}`)
  
  return data
}

// 主要函數
async function fetchAllData(pageSize = 300, shouldMerge = false, maxRecords?: number) {
  const jsonPath = path.join(__dirname, '../src/assets/hakkacoin-maps.json')
  const backupPath = path.join(__dirname, `../src/assets/hakkacoin-maps-backup-${Date.now()}.json`)
  const coordinatesPath = path.join(__dirname, '../src/assets/coordinates.json')
  const mergedPath = path.join(__dirname, '../src/assets/hakkacoin-maps-with-coordinates.json')
  
  console.log('🚀 開始從 Hakkacoin API 取得資料...')
  console.log(`📊 每頁筆數: ${pageSize}`)
  
  // 建立備份（如果檔案存在）
  if (fs.existsSync(jsonPath)) {
    const backupData = fs.readFileSync(jsonPath, 'utf-8')
    fs.writeFileSync(backupPath, backupData)
    console.log(`✅ 備份已建立: ${backupPath}`)
  }
  
  try {
    // 取得第一頁，了解總數
    const firstPage = await fetchPage(1, pageSize)
    const totalCount = firstPage.data.total || firstPage.data.total_count || 0
    const totalPages = Math.ceil(totalCount / pageSize)
    
    console.log(`\n📊 資料統計:`)
    console.log(`   總筆數: ${totalCount}`)
    console.log(`   總頁數: ${totalPages}`)
    console.log(`   每頁筆數: ${pageSize}`)
    
    // 收集所有資料
    const allBusinesses: any[] = [...firstPage.data.info]
    const idSet = new Set(firstPage.data.info.map((b: any) => b.id))
    console.log(`✅ 第 1/${totalPages} 頁完成 (${allBusinesses.length} 筆)`)
    
    // 取得剩餘頁面
    for (let page = 2; page <= totalPages; page++) {
      await delay(500) // 避免請求過快
      const pageData = await fetchPage(page, pageSize)
      
      // 檢查重複的 ID
      let duplicates = 0
      for (const business of pageData.data.info) {
        // 如果設定了最大筆數限制，檢查是否已達上限
        if (maxRecords && allBusinesses.length >= maxRecords) {
          console.log(`   ℹ️  已達最大筆數限制 (${maxRecords})，停止取得更多資料`)
          break
        }
        
        if (idSet.has(business.id)) {
          duplicates++
          console.log(`   ⚠️  發現重複 ID: ${business.id} - ${business.name}`)
        } else {
          idSet.add(business.id)
          allBusinesses.push(business)
        }
      }
      
      if (duplicates > 0) {
        console.log(`✅ 第 ${page}/${totalPages} 頁完成 (累計 ${allBusinesses.length} 筆，排除 ${duplicates} 筆重複)`)
      } else {
        console.log(`✅ 第 ${page}/${totalPages} 頁完成 (累計 ${allBusinesses.length} 筆)`)
      }
      
      // 如果已達最大筆數，提前結束
      if (maxRecords && allBusinesses.length >= maxRecords) {
        break
      }
    }
    
    // 建立完整的資料結構（保持與原始格式一致）
    // 注意：API 回傳的格式可能與儲存的格式不同
    const fullData = {
      code: 200,
      message: "success",
      data: {
        page: 1,
        page_size: allBusinesses.length,
        total_page: 1,
        total_count: allBusinesses.length,
        info: allBusinesses
      }
    }
    
    console.log(`\n⚠️  注意：實際取得 ${allBusinesses.length} 筆資料`)
    
    // 儲存資料
    fs.writeFileSync(jsonPath, JSON.stringify(fullData, null, 2))
    console.log(`\n✅ 資料已儲存到: ${jsonPath}`)
    console.log(`📊 總共取得 ${allBusinesses.length} 筆商家資料`)
    
    // 如果需要合併座標資料
    if (shouldMerge && fs.existsSync(coordinatesPath)) {
      console.log('\n🔄 正在合併座標資料...')
      
      const coordinatesData = JSON.parse(fs.readFileSync(coordinatesPath, 'utf-8'))
      const mergedBusinesses = allBusinesses.map(business => {
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
        ...fullData,
        data: {
          ...fullData.data,
          info: mergedBusinesses
        }
      }
      
      fs.writeFileSync(mergedPath, JSON.stringify(mergedData, null, 2))
      console.log(`✅ 整合檔案已建立: ${mergedPath}`)
      
      // 統計有座標的商家數
      const withCoordinates = mergedBusinesses.filter(b => b.coordinates).length
      console.log(`📍 ${withCoordinates}/${allBusinesses.length} 筆商家有座標資料`)
    }
    
  } catch (error) {
    console.error('\n❌ 發生錯誤:', error)
    process.exit(1)
  }
}

// 解析命令列參數
async function main() {
  const args = process.argv.slice(2)
  let pageSize = 300
  let shouldMerge = false
  let maxRecords: number | undefined
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--page-size' && args[i + 1]) {
      pageSize = parseInt(args[i + 1])
    }
    if (args[i] === '--merge') {
      shouldMerge = true
    }
    if (args[i] === '--max' && args[i + 1]) {
      maxRecords = parseInt(args[i + 1])
    }
    if (args[i] === '--help') {
      console.log(`
使用方式：
  pnpm run fetch-data                    # 取得所有資料（每頁 300 筆）
  pnpm run fetch-data -- --page-size 500 # 自訂每頁筆數
  pnpm run fetch-data -- --merge         # 取得資料並合併座標
  pnpm run fetch-data -- --max 1350      # 限制最大筆數
  
選項：
  --page-size <number>  每頁筆數（預設 300）
  --merge              合併現有的座標資料
  --max <number>       限制最大筆數
  --help               顯示說明
      `)
      process.exit(0)
    }
  }
  
  await fetchAllData(pageSize, shouldMerge, maxRecords)
}

// 執行
main().catch(console.error)