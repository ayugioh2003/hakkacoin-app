/**
 * 模擬座標資料（暫時使用，之後會實作地理編碼）
 * 根據縣市提供大概的座標範圍
 */

interface CountyCoordinates {
  [key: string]: {
    center: [number, number]
    bounds: {
      minLat: number
      maxLat: number
      minLng: number
      maxLng: number
    }
  }
}

const countyCoordinates: CountyCoordinates = {
  '台北市': {
    center: [25.0330, 121.5654],
    bounds: { minLat: 24.96, maxLat: 25.21, minLng: 121.46, maxLng: 121.67 }
  },
  '新北市': {
    center: [25.0170, 121.4628],
    bounds: { minLat: 24.67, maxLat: 25.30, minLng: 121.28, maxLng: 122.01 }
  },
  '桃園市': {
    center: [24.9936, 121.3010],
    bounds: { minLat: 24.57, maxLat: 25.08, minLng: 120.99, maxLng: 121.39 }
  },
  '台中市': {
    center: [24.1477, 120.6736],
    bounds: { minLat: 24.04, maxLat: 24.40, minLng: 120.44, maxLng: 121.05 }
  },
  '台南市': {
    center: [22.9998, 120.2269],
    bounds: { minLat: 22.88, maxLat: 23.47, minLng: 120.03, maxLng: 120.61 }
  },
  '高雄市': {
    center: [22.6273, 120.3014],
    bounds: { minLat: 22.47, maxLat: 23.47, minLng: 120.17, maxLng: 121.03 }
  },
  '新竹市': {
    center: [24.8138, 120.9675],
    bounds: { minLat: 24.77, maxLat: 24.86, minLng: 120.91, maxLng: 121.03 }
  },
  '新竹縣': {
    center: [24.8387, 121.0177],
    bounds: { minLat: 24.44, maxLat: 24.93, minLng: 120.88, maxLng: 121.35 }
  },
  '苗栗縣': {
    center: [24.5602, 120.8214],
    bounds: { minLat: 24.29, maxLat: 24.82, minLng: 120.63, maxLng: 121.19 }
  },
  '彰化縣': {
    center: [24.0518, 120.5161],
    bounds: { minLat: 23.81, maxLat: 24.20, minLng: 120.33, maxLng: 120.68 }
  },
  '南投縣': {
    center: [23.9609, 120.9718],
    bounds: { minLat: 23.42, maxLat: 24.25, minLng: 120.61, maxLng: 121.30 }
  },
  '雲林縣': {
    center: [23.7092, 120.4313],
    bounds: { minLat: 23.47, maxLat: 23.85, minLng: 120.10, maxLng: 120.74 }
  },
  '嘉義市': {
    center: [23.4801, 120.4491],
    bounds: { minLat: 23.44, maxLat: 23.52, minLng: 120.40, maxLng: 120.49 }
  },
  '嘉義縣': {
    center: [23.4518, 120.2554],
    bounds: { minLat: 23.15, maxLat: 23.61, minLng: 120.10, maxLng: 120.86 }
  },
  '屏東縣': {
    center: [22.5519, 120.5487],
    bounds: { minLat: 21.90, maxLat: 22.88, minLng: 120.38, maxLng: 120.89 }
  },
  '宜蘭縣': {
    center: [24.7021, 121.7377],
    bounds: { minLat: 24.40, maxLat: 24.84, minLng: 121.35, maxLng: 121.84 }
  },
  '花蓮縣': {
    center: [23.9871, 121.6016],
    bounds: { minLat: 23.00, maxLat: 24.39, minLng: 121.29, maxLng: 121.80 }
  },
  '台東縣': {
    center: [22.7972, 121.0713],
    bounds: { minLat: 22.00, maxLat: 23.37, minLng: 120.74, maxLng: 121.60 }
  },
  '澎湖縣': {
    center: [23.5712, 119.5793],
    bounds: { minLat: 23.12, maxLat: 23.75, minLng: 119.42, maxLng: 119.71 }
  },
  '金門縣': {
    center: [24.4493, 118.3766],
    bounds: { minLat: 24.38, maxLat: 24.53, minLng: 118.22, maxLng: 118.49 }
  },
  '連江縣': {
    center: [26.1605, 119.9516],
    bounds: { minLat: 25.93, maxLat: 26.38, minLng: 119.90, maxLng: 120.49 }
  }
}

/**
 * 根據地址獲取模擬座標
 */
export function getMockCoordinates(address: string, index: number): [number, number] | null {
  // 嘗試從地址中提取縣市
  let county: string | null = null
  
  for (const countyName of Object.keys(countyCoordinates)) {
    if (address.includes(countyName)) {
      county = countyName
      break
    }
  }
  
  if (!county) {
    // 如果找不到縣市，返回台灣中心點附近的隨機座標
    const lat = 23.5 + (Math.random() - 0.5) * 2
    const lng = 120.9 + (Math.random() - 0.5) * 2
    return [lat, lng]
  }
  
  const countyData = countyCoordinates[county]
  const { bounds } = countyData
  
  // 在縣市範圍內生成隨機座標，但確保有一定的分散性
  const latRange = bounds.maxLat - bounds.minLat
  const lngRange = bounds.maxLng - bounds.minLng
  
  // 使用 index 來確保座標的確定性和分散性
  const gridSize = Math.ceil(Math.sqrt(50)) // 假設每個縣市最多50個點
  const row = Math.floor(index / gridSize) % gridSize
  const col = index % gridSize
  
  // 添加一些隨機偏移，避免過於規則
  const randomOffsetLat = (Math.random() - 0.5) * (latRange / gridSize) * 0.8
  const randomOffsetLng = (Math.random() - 0.5) * (lngRange / gridSize) * 0.8
  
  const lat = bounds.minLat + (latRange / gridSize) * row + (latRange / gridSize / 2) + randomOffsetLat
  const lng = bounds.minLng + (lngRange / gridSize) * col + (lngRange / gridSize / 2) + randomOffsetLng
  
  // 確保座標在範圍內
  const finalLat = Math.max(bounds.minLat, Math.min(bounds.maxLat, lat))
  const finalLng = Math.max(bounds.minLng, Math.min(bounds.maxLng, lng))
  
  return [finalLat, finalLng]
}

/**
 * 為商家列表添加模擬座標
 */
export function addMockCoordinatesToBusinesses<T extends { address: string; coordinates?: [number, number] }>(
  businesses: T[]
): T[] {
  const countyGroups = new Map<string, number>()
  
  return businesses.map((business, index) => {
    // 如果已有座標，直接返回
    if (business.coordinates) {
      return business
    }
    
    // 提取縣市名稱
    let county = '其他'
    for (const countyName of Object.keys(countyCoordinates)) {
      if (business.address.includes(countyName)) {
        county = countyName
        break
      }
    }
    
    // 計算該縣市的商家索引
    const countyIndex = countyGroups.get(county) || 0
    countyGroups.set(county, countyIndex + 1)
    
    // 獲取模擬座標
    const coordinates = getMockCoordinates(business.address, countyIndex)
    
    return {
      ...business,
      coordinates
    }
  })
}