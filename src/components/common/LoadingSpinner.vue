<script setup lang="ts">
// Props
interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  text?: string
  fullScreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  text: '',
  fullScreen: false
})

// Computed classes
const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

const colorClasses = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  white: 'text-white',
  gray: 'text-gray-400'
}
</script>

<template>
  <div 
    :class="[
      'flex items-center justify-center',
      fullScreen ? 'fixed inset-0 bg-white bg-opacity-75 z-50' : '',
      text ? 'flex-col gap-3' : ''
    ]"
  >
    <!-- Spinner -->
    <div class="relative">
      <div 
        :class="[
          'animate-spin rounded-full border-2 border-gray-200',
          sizeClasses[size],
          colorClasses[color]
        ]"
        style="border-top-color: currentColor"
      ></div>
    </div>

    <!-- Loading Text -->
    <div 
      v-if="text" 
      :class="[
        'text-sm font-medium',
        colorClasses[color] === 'text-white' ? 'text-white' : 'text-gray-600'
      ]"
    >
      {{ text }}
    </div>
  </div>
</template>

<style scoped>
/* Custom spinner animation */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 2s linear infinite;
}
</style>