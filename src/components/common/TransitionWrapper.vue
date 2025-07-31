<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  name?: string
  mode?: 'out-in' | 'in-out' | 'default'
  appear?: boolean
  duration?: number | { enter: number; leave: number }
}

const props = withDefaults(defineProps<Props>(), {
  name: 'fade',
  mode: 'out-in',
  appear: true,
  duration: 300
})

// Computed transition classes
const transitionClasses = computed(() => {
  const base = `transition-${props.name}`
  return {
    enterActiveClass: `${base}-enter-active`,
    leaveActiveClass: `${base}-leave-active`,
    enterFromClass: `${base}-enter-from`,
    enterToClass: `${base}-enter-to`,
    leaveFromClass: `${base}-leave-from`,
    leaveToClass: `${base}-leave-to`
  }
})
</script>

<template>
  <Transition
    :name="name"
    :mode="mode"
    :appear="appear"
    :duration="duration"
    v-bind="transitionClasses"
  >
    <slot />
  </Transition>
</template>

<style scoped>
/* Fade transitions */
.transition-fade-enter-active,
.transition-fade-leave-active {
  transition: opacity 0.3s ease;
}

.transition-fade-enter-from,
.transition-fade-leave-to {
  opacity: 0;
}

.transition-fade-enter-to,
.transition-fade-leave-from {
  opacity: 1;
}

/* Slide transitions */
.transition-slide-enter-active,
.transition-slide-leave-active {
  transition: all 0.3s ease;
}

.transition-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.transition-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.transition-slide-enter-to,
.transition-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* Scale transitions */
.transition-scale-enter-active,
.transition-scale-leave-active {
  transition: all 0.2s ease;
}

.transition-scale-enter-from,
.transition-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.transition-scale-enter-to,
.transition-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Slide up transitions */
.transition-slide-up-enter-active,
.transition-slide-up-leave-active {
  transition: all 0.3s ease;
}

.transition-slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.transition-slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.transition-slide-up-enter-to,
.transition-slide-up-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Slide down transitions */
.transition-slide-down-enter-active,
.transition-slide-down-leave-active {
  transition: all 0.3s ease;
}

.transition-slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.transition-slide-down-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.transition-slide-down-enter-to,
.transition-slide-down-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Bounce transitions */
.transition-bounce-enter-active {
  animation: bounceIn 0.5s ease-out;
}

.transition-bounce-leave-active {
  animation: bounceOut 0.3s ease-in;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }
  20% {
    transform: scale3d(1.1, 1.1, 1.1);
  }
  40% {
    transform: scale3d(0.9, 0.9, 0.9);
  }
  60% {
    opacity: 1;
    transform: scale3d(1.03, 1.03, 1.03);
  }
  80% {
    transform: scale3d(0.97, 0.97, 0.97);
  }
  100% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
}

@keyframes bounceOut {
  0% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
  20% {
    transform: scale3d(0.9, 0.9, 0.9);
  }
  50% {
    opacity: 1;
    transform: scale3d(1.1, 1.1, 1.1);
  }
  100% {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }
}

/* Elastic transitions */
.transition-elastic-enter-active {
  animation: elasticIn 0.6s ease-out;
}

.transition-elastic-leave-active {
  animation: elasticOut 0.4s ease-in;
}

@keyframes elasticIn {
  0% {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }
  20% {
    transform: scale3d(1.1, 1.1, 1.1);
  }
  40% {
    transform: scale3d(0.9, 0.9, 0.9);
  }
  60% {
    opacity: 1;
    transform: scale3d(1.03, 1.03, 1.03);
  }
  80% {
    transform: scale3d(0.97, 0.97, 0.97);
  }
  100% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
}

@keyframes elasticOut {
  0% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
  20% {
    transform: scale3d(0.9, 0.9, 0.9);
  }
  100% {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }
}
</style>