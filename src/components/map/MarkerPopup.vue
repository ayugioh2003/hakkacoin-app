<script setup lang="ts">
import type { Business } from '@/types'

interface Props {
  business: Business
  showFullInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showFullInfo: true
})

const emit = defineEmits<{
  openGoogleMaps: [url: string]
  close: []
}>()

// Handle Google Maps link click
function handleGoogleMapsClick(e: Event) {
  e.preventDefault()
  window.open(props.business.map_url, '_blank')
  emit('openGoogleMaps', props.business.map_url)
}

// Format business hours
function formatBusinessHours(hours: string | null): string {
  if (!hours) return '未提供'
  return hours
}

// Get tag display
function getTagDisplay(tags: string[]): string {
  if (tags.length === 0) return '其他'
  return tags.join('、')
}
</script>

<template>
  <div class="marker-popup">
    <!-- Business Image -->
    <div v-if="business.image.length > 0 && showFullInfo" class="popup-image">
      <img 
        :src="business.image[0]" 
        :alt="business.name"
        class="w-full h-32 object-cover"
        loading="lazy"
      >
    </div>

    <!-- Business Info -->
    <div class="popup-content p-4">
      <!-- Name and Tags -->
      <div class="mb-3">
        <h3 class="text-lg font-bold text-gray-900 mb-1">{{ business.name }}</h3>
        <div class="flex flex-wrap gap-1">
          <span 
            v-for="tag in business.tag" 
            :key="tag"
            class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
            :class="{
              'bg-red-100 text-red-800': tag === '食',
              'bg-blue-100 text-blue-800': tag === '購',
              'bg-green-100 text-green-800': tag === '住',
              'bg-yellow-100 text-yellow-800': tag === '遊',
              'bg-gray-100 text-gray-800': !['食', '購', '住', '遊'].includes(tag)
            }"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- Introduction -->
      <p v-if="showFullInfo && business.introduction" 
         class="text-sm text-gray-700 mb-3 line-clamp-3">
        {{ business.introduction }}
      </p>

      <!-- Contact Info -->
      <div class="space-y-2 text-sm">
        <!-- Address -->
        <div class="flex items-start gap-2">
          <svg class="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="text-gray-700">{{ business.address }}</span>
        </div>

        <!-- Phone -->
        <div v-if="business.contact" class="flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <a :href="`tel:${business.contact}`" class="text-blue-600 hover:underline">
            {{ business.contact }}
          </a>
        </div>

        <!-- Business Hours -->
        <div v-if="business.business_hours && showFullInfo" class="flex items-start gap-2">
          <svg class="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-gray-700">{{ formatBusinessHours(business.business_hours) }}</span>
        </div>

        <!-- Classification -->
        <div v-if="showFullInfo && business.classification" class="flex items-start gap-2">
          <svg class="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span class="text-gray-700 text-xs">{{ business.classification }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-4 flex gap-2">
        <button
          @click="handleGoogleMapsClick"
          class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C7.802 0 4 3.403 4 7.602C4 11.8 7.469 16.812 12 24C16.531 16.812 20 11.8 20 7.602C20 3.403 16.198 0 12 0ZM12 11C10.343 11 9 9.657 9 8C9 6.343 10.343 5 12 5C13.657 5 15 6.343 15 8C15 9.657 13.657 11 12 11Z"/>
          </svg>
          在 Google Maps 中查看
        </button>
        
        <a
          v-if="business.website"
          :href="business.website"
          target="_blank"
          class="inline-block px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
        >
          官網
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.marker-popup {
  min-width: 280px;
  max-width: 350px;
}

.popup-image img {
  border-radius: 0.5rem 0.5rem 0 0;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>