import type { Business } from '@/types'
import L from 'leaflet'

// 台灣的預設地圖中心點
export const TAIWAN_CENTER: [number, number] = [23.8, 120.9]
export const DEFAULT_ZOOM = 8

/**
 * 建立自訂標記圖示
 */
export function createCustomIcon(color = '#ef4444'): L.DivIcon {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  })
}

/**
 * 根據標籤取得標記顏色
 */
export function getMarkerColorByTag(tags: string[]): string {
  const colorMap: Record<string, string> = {
    食: '#ef4444', // 紅色
    購: '#3b82f6', // 藍色
    住: '#10b981', // 綠色
    遊: '#f59e0b', // 橙色
    其他: '#6b7280', // 灰色
  }

  for (const tag of tags) {
    if (colorMap[tag]) {
      return colorMap[tag]
    }
  }
  
  return colorMap['其他']
}

/**
 * 計算商家群組的邊界
 */
export function calculateBounds(businesses: Business[]): [[number, number], [number, number]] | null {
  if (businesses.length === 0) return null

  const coordinates = businesses
    .map(b => b.coordinates)
    .filter((coord): coord is [number, number] => coord !== undefined)

  if (coordinates.length === 0) return null

  const lats = coordinates.map(coord => coord[0])
  const lngs = coordinates.map(coord => coord[1])

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ]
}

/**
 * 地理編碼 - 將地址轉換為座標 (簡化版本)
 */
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  // 這裡可以整合真實的地理編碼服務，如 OpenStreetMap Nominatim
  // 目前回傳 null，表示需要後續實作
  console.warn('Geocoding not implemented yet:', address)
  return null
}

/**
 * 建立彈出視窗內容
 */
export function createPopupContent(business: Business): string {
  const imageHtml = business.image.length > 0 
    ? `<img src="${business.image[0]}" alt="${business.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />`
    : ''

  const tagsHtml = business.tag.length > 0
    ? `<div style="margin: 8px 0;">
         ${business.tag.map(tag => 
           `<span style="background: #e5e7eb; padding: 2px 6px; border-radius: 12px; font-size: 12px; margin-right: 4px;">${tag}</span>`
         ).join('')}
       </div>`
    : ''

  return `
    <div style="min-width: 250px; max-width: 300px;">
      ${imageHtml}
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${business.name}</h3>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #666; line-height: 1.4;">${business.introduction}</p>
      ${tagsHtml}
      <div style="margin: 8px 0; font-size: 13px; color: #666;">
        <div style="margin-bottom: 4px;">📍 ${business.address}</div>
        ${business.contact ? `<div style="margin-bottom: 4px;">📞 ${business.contact}</div>` : ''}
        ${business.business_hours ? `<div>🕒 ${business.business_hours}</div>` : ''}
      </div>
      <div style="margin-top: 12px; text-align: center;">
        <a href="${business.map_url}" target="_blank" style="
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
        ">在 Google Maps 中查看</a>
      </div>
    </div>
  `
}