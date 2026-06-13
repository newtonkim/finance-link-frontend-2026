<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  starts: string
  expires: string
  grace_ends?: string | null
  status: string
}>()

const progress = computed(() => {
  if (!props.starts || !props.expires) return 0
  const start = new Date(props.starts).getTime()
  const end = new Date(props.expires).getTime()
  const now = Date.now()
  const total = end - start
  if (total <= 0) return 100
  return Math.min(100, Math.max(0, ((now - start) / total) * 100))
})

const isExpiringSoon = computed(() =>
  props.status === 'active' && daysToExpiry.value >= 0 && daysToExpiry.value <= 30
)

const daysToExpiry = computed(() => {
  if (!props.expires) return 0
  return Math.ceil((new Date(props.expires).getTime() - Date.now()) / 86400000)
})

const daysText = computed(() => {
  const d = daysToExpiry.value
  if (props.status === 'suspended') return 'Billing paused'
  if (props.status === 'grace') {
    if (props.grace_ends) {
      const graceDays = Math.ceil((new Date(props.grace_ends).getTime() - Date.now()) / 86400000)
      return graceDays > 0 ? `In grace · ${graceDays} days left` : 'Grace period ended'
    }
    return 'In grace period'
  }
  if (props.status === 'expired') return `Expired ${Math.abs(d)} days ago`
  if (props.status === 'trial') return `Trial · ${d} days left`
  if (isExpiringSoon.value) return `Expires in ${d} days`
  return `${d} days left`
})

const trackColor = computed(() => {
  if (props.status === 'suspended') return 'bg-neutral-200 dark:bg-neutral-700'
  if (props.status === 'expired') return 'bg-red-100 dark:bg-red-900/30'
  if (props.status === 'grace') return 'bg-amber-100 dark:bg-amber-900/30'
  if (props.status === 'trial') return 'bg-violet-100 dark:bg-violet-900/30'
  if (isExpiringSoon.value) return 'bg-orange-100 dark:bg-orange-900/30'
  return 'bg-green-100 dark:bg-green-900/30'
})

const fillColor = computed(() => {
  if (props.status === 'suspended') return 'bg-neutral-400'
  if (props.status === 'expired') return 'bg-red-500'
  if (props.status === 'grace') return 'bg-amber-500'
  if (props.status === 'trial') return 'bg-violet-500'
  if (isExpiringSoon.value) return 'bg-orange-500'
  return 'bg-green-500'
})

const daysTextColor = computed(() => {
  if (props.status === 'suspended') return 'text-neutral-500'
  if (props.status === 'expired') return 'text-red-500'
  if (props.status === 'grace') return 'text-amber-600'
  if (props.status === 'trial') return 'text-violet-500'
  if (isExpiringSoon.value) return 'text-orange-500'
  return 'text-neutral-500'
})

function fmt(d: string) {
  if (!d) return '—'
  return d.slice(0, 10)
}
</script>

<template>
  <div class="w-full min-w-[200px]">
    <div class="relative h-1.5 rounded-full overflow-hidden mb-1.5" :class="trackColor">
      <div class="absolute left-0 top-0 h-full rounded-full transition-all" :class="fillColor"
        :style="{ width: `${progress}%` }" />
      <div class="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full bg-neutral-800 dark:bg-white opacity-60"
        :style="{ left: `${progress}%` }" />
    </div>
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
        <span>{{ fmt(starts) }}</span>
        <span>→</span>
        <span>{{ fmt(expires) }}</span>
      </div>
      <span class="text-[11px] font-medium shrink-0" :class="daysTextColor">
        · {{ daysText }}
      </span>
    </div>
  </div>
</template>
