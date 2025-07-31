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
    ? `<img src="${business.image[0]}" alt="${business.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px 8px 0 0; display: block;" />`
    : ''

  const tagsHtml = business.tag.length > 0
    ? `<div style="margin: 8px 0;">
         ${business.tag.map(tag => {
           let bgColor = '#e5e7eb'
           let textColor = '#374151'
           
           if (tag === '食') {
             bgColor = '#fee2e2'
             textColor = '#991b1b'
           } else if (tag === '購') {
             bgColor = '#dbeafe'
             textColor = '#1e40af'
           } else if (tag === '住') {
             bgColor = '#d1fae5'
             textColor = '#065f46'
           } else if (tag === '遊') {
             bgColor = '#fef3c7'
             textColor = '#92400e'
           }
           
           return `<span style="background: ${bgColor}; color: ${textColor}; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 4px; font-weight: 500;">${tag}</span>`
         }).join('')}
       </div>`
    : ''

  return `
    <div style="min-width: 280px; max-width: 350px; overflow: hidden; border-radius: 8px;">
      ${imageHtml}
      <div style="padding: 12px;">
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #111827;">${business.name}</h3>
        ${tagsHtml}
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #4b5563; line-height: 1.5; max-height: 60px; overflow: hidden;">${business.introduction}</p>
        <div style="margin: 12px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
          <div style="margin-bottom: 6px; display: flex; align-items: flex-start;">
            <span style="margin-right: 8px;">📍</span>
            <span style="flex: 1;">${business.address}</span>
          </div>
          ${business.contact ? `
            <div style="margin-bottom: 6px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📞</span>
              <a href="tel:${business.contact}" style="color: #2563eb; text-decoration: none;">${business.contact}</a>
            </div>
          ` : ''}
          ${business.business_hours ? `
            <div style="display: flex; align-items: flex-start;">
              <span style="margin-right: 8px;">🕒</span>
              <span style="flex: 1;">${business.business_hours}</span>
            </div>
          ` : ''}
        </div>
        <div style="margin-top: 16px; display: flex; gap: 8px;">
          <a href="${business.map_url}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            background: #2563eb;
            color: white;
            padding: 10px 16px;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
          " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
            <svg style="width: 16px; height: 16px; margin-right: 6px;" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C7.802 0 4 3.403 4 7.602C4 11.8 7.469 16.812 12 24C16.531 16.812 20 11.8 20 7.602C20 3.403 16.198 0 12 0ZM12 11C10.343 11 9 9.657 9 8C9 6.343 10.343 5 12 5C13.657 5 15 6.343 15 8C15 9.657 13.657 11 12 11Z"/>
            </svg>
            Google Maps
          </a>
          ${business.website ? `
            <a href="${business.website}" target="_blank" style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 10px 16px;
              border: 1px solid #d1d5db;
              color: #374151;
              text-decoration: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              background: white;
              transition: background 0.2s;
            " onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
              官網
            </a>
          ` : ''}
        </div>
      </div>
    </div>
  `
}