<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Construction } from 'lucide-vue-next'

const props = defineProps<{
  title?: string
  description?: string
}>()

const route = useRoute()

const displayTitle = computed(() => {
  if (props.title) return props.title
  
  // Try to use label/title from route meta
  const routeLabel = route.meta?.label || route.meta?.title || route.name
  if (routeLabel && typeof routeLabel === 'string' && routeLabel.trim() !== '') {
    return `${routeLabel} Coming Soon`
  }
  
  return 'Coming Soon'
})
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
    <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-nfuko-primary/5 dark:bg-bg-nfuko-yellow/5">
      <Construction class="h-12 w-12 text-nfuko-primary dark:text-bg-nfuko-yellow" />
    </div>
    
    <h2 class="mb-3 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
      {{ displayTitle }}
    </h2>
    
    <p class="max-w-md text-[14px] leading-relaxed text-neutral-500 dark:text-neutral-400">
      {{ description || 'We are working hard to bring you this feature. Check back soon for updates!' }}
    </p>
  </div>
</template>
