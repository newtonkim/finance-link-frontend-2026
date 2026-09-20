<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, CircleCheck, Clock, OctagonAlert, PauseCircle } from 'lucide-vue-next'
import type { AttentionItem } from '@/central/modules/apis/dashboard/dashboardApi'

const props = defineProps<{
  items: AttentionItem[]
  loading?: boolean
}>()

/**
 * Severity carries an icon and a worded status as well as a tint, so the state is
 * never communicated by colour alone.
 */
const TONE = {
  critical: {
    icon: OctagonAlert,
    label: 'Expired',
    text: 'text-nfuko-danger',
    chip: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  },
  serious: {
    icon: PauseCircle,
    label: 'Suspended',
    text: 'text-orange-600 dark:text-orange-400',
    chip: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Expiring',
    text: 'text-amber-600 dark:text-amber-400',
    chip: 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
  },
  info: {
    icon: Clock,
    label: 'Upcoming',
    text: 'text-neutral-600 dark:text-neutral-300',
    chip: 'bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-300',
  },
} as const

const tone = (severity: AttentionItem['severity']) => TONE[severity] ?? TONE.info

function describe(item: AttentionItem): string {
  if (item.type === 'tenant_suspended') return 'Account suspended'

  const days = item.days ?? 0
  const plan = item.plan ? `${item.plan} licence` : 'Licence'

  if (days < 0) {
    const n = Math.abs(days)
    return `${plan} expired ${n} ${n === 1 ? 'day' : 'days'} ago`
  }
  if (days === 0) return `${plan} expires today`
  return `${plan} expires in ${days} ${days === 1 ? 'day' : 'days'}`
}

const criticalCount = computed(
  () => props.items.filter((i) => i.severity === 'critical' || i.severity === 'serious').length,
)
</script>

<template>
  <section
    class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#151515]"
    aria-labelledby="attention-heading"
  >
    <header class="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 dark:border-white/10">
      <h2 id="attention-heading" class="text-base font-semibold text-neutral-900 dark:text-white">
        Needs attention
      </h2>
      <span
        v-if="!loading && items.length"
        class="rounded-full px-2.5 py-1 text-[12px] font-semibold"
        :class="criticalCount ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'"
      >
        {{ items.length }}
      </span>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="divide-y divide-neutral-100 dark:divide-white/5">
      <div v-for="n in 2" :key="n" class="flex items-center gap-4 px-5 py-4">
        <div class="size-9 animate-pulse rounded-full bg-neutral-100 dark:bg-white/10"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3.5 w-40 animate-pulse rounded bg-neutral-100 dark:bg-white/10"></div>
          <div class="h-3 w-56 animate-pulse rounded bg-neutral-100/70 dark:bg-white/5"></div>
        </div>
      </div>
    </div>

    <!-- Resolved: nothing outstanding is a real result, so say what it means -->
    <div v-else-if="!items.length" class="flex items-start gap-3 px-5 py-6">
      <CircleCheck class="mt-0.5 size-5 shrink-0 text-nfuko-success" aria-hidden="true" />
      <div>
        <p class="text-[14px] font-medium text-neutral-900 dark:text-white">Everything is current</p>
        <p class="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
          No licence expires in the next 30 days and no tenant is suspended.
        </p>
      </div>
    </div>

    <ul v-else class="divide-y divide-neutral-100 dark:divide-white/5">
      <li
        v-for="item in items"
        :key="`${item.type}-${item.subdomain}`"
        class="flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-white/5"
      >
        <component
          :is="tone(item.severity).icon"
          class="size-5 shrink-0"
          :class="tone(item.severity).text"
          aria-hidden="true"
        />

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p class="truncate text-[14px] font-semibold text-neutral-900 dark:text-white">
              {{ item.tenant }}
            </p>
            <span
              class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              :class="tone(item.severity).chip"
            >
              {{ tone(item.severity).label }}
            </span>
          </div>
          <p class="mt-0.5 truncate text-[13px] text-neutral-500 dark:text-neutral-400">
            {{ describe(item) }}
          </p>
        </div>

        <RouterLink
          to="/central/licenses"
          class="shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-nfuko-primary transition-colors duration-150 hover:bg-nfuko-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nfuko-primary dark:text-nfuko-accent dark:hover:bg-white/10"
        >
          Review
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
