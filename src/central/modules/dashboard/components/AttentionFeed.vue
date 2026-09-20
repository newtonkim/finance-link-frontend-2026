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
    text: 'text-red-600 dark:text-red-400',
    tile: 'bg-red-50 dark:bg-red-900/30',
    chip: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  serious: {
    icon: PauseCircle,
    label: 'Suspended',
    text: 'text-orange-600 dark:text-orange-400',
    tile: 'bg-orange-50 dark:bg-orange-900/30',
    chip: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Expiring',
    text: 'text-amber-600 dark:text-amber-400',
    tile: 'bg-amber-50 dark:bg-amber-900/30',
    chip: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  info: {
    icon: Clock,
    label: 'Upcoming',
    text: 'text-neutral-500 dark:text-neutral-400',
    tile: 'bg-neutral-100 dark:bg-neutral-800',
    chip: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
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
    class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm"
    aria-labelledby="attention-heading"
  >
    <div
      class="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-200 dark:border-neutral-800"
    >
      <h2 id="attention-heading" class="text-base font-black tracking-tight">Needs Attention</h2>
      <span
        v-if="!loading && items.length"
        class="rounded-lg px-2.5 py-1 text-xs font-bold"
        :class="
          criticalCount
            ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
        "
      >
        {{ items.length }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="divide-y divide-neutral-100 dark:divide-neutral-800">
      <div v-for="n in 2" :key="n" class="flex items-center gap-4 px-5 py-4">
        <div class="size-10 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3.5 w-40 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"></div>
          <div class="h-3 w-56 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"></div>
        </div>
      </div>
    </div>

    <!-- Nothing outstanding is a real result, so say what it means -->
    <div v-else-if="!items.length" class="flex items-start gap-3 px-5 py-6">
      <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30">
        <CircleCheck class="size-5 text-green-600 dark:text-green-400" aria-hidden="true" />
      </div>
      <div>
        <p class="text-sm font-bold">Everything is current</p>
        <p class="mt-1 text-xs text-neutral-400">
          No licence expires in the next 30 days and no tenant is suspended.
        </p>
      </div>
    </div>

    <ul v-else class="divide-y divide-neutral-100 dark:divide-neutral-800">
      <li
        v-for="item in items"
        :key="`${item.type}-${item.subdomain}`"
        class="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-lg"
          :class="tone(item.severity).tile"
        >
          <component
            :is="tone(item.severity).icon"
            class="size-5"
            :class="tone(item.severity).text"
            aria-hidden="true"
          />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p class="truncate text-sm font-bold">{{ item.tenant }}</p>
            <span
              class="rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
              :class="tone(item.severity).chip"
            >
              {{ tone(item.severity).label }}
            </span>
          </div>
          <p class="mt-0.5 truncate text-xs text-neutral-400">{{ describe(item) }}</p>
        </div>

        <RouterLink
          to="/central/licenses"
          class="shrink-0 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Review
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
