<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Users, UserCog, Building2, TrendingUp,
  CheckCircle2, XCircle, CalendarDays, Hash, Tag, Clock,
} from 'lucide-vue-next'
import { featuresApi } from '@/central/modules/apis/Settings'

const props = defineProps<{ data: Record<string, any> }>()

const featureLabels = ref<Record<string, string>>({})
const featuresLoadError = ref(false)

onMounted(async () => {
  try {
    const res = await featuresApi().list()
    const items: any[] = res?.data?.payload ?? res?.data?.data ?? []
    items.forEach((f: any) => { featureLabels.value[f.key] = f.name })
  } catch {
    featuresLoadError.value = true
  }
})

const BILLING_LABELS: Record<string, string> = {
  monthly: 'Monthly', yearly: 'Annually', annual: 'Annually',
  weekly: 'Weekly', daily: 'Daily', quarterly: 'Quarterly',
}

function parsedFeatures() {
  const raw = props.data.features
  if (!raw) return {}
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return {} } }
  return {}
}

const features = computed(() => {
  const obj = parsedFeatures()
  const allKeys = Object.keys(featureLabels.value).length
    ? Object.keys(featureLabels.value)
    : Object.keys(obj)
  return allKeys.map((key) => ({
    key,
    label: featureLabels.value[key] ?? key,
    enabled: !!obj[key],
  }))
})

const enabledCount = computed(() => features.value.filter(f => f.enabled).length)
const billingLabel = computed(() => BILLING_LABELS[props.data.billing_type] ?? props.data.billing_type ?? '—')

function isUnlimited(v: any) { return !v || Number(v) === 0 || Number(v) >= 999 }
function fmt(v: any) { return Number(v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtDate(v: any) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const DOT_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
function dotColor() {
  const idx = Math.abs((props.data.plan_name ?? '').charCodeAt(0) ?? 0) % DOT_COLORS.length
  return DOT_COLORS[idx]
}
</script>

<template>
  <div class="space-y-5 px-1 pb-6">

    <!-- ── Plan identity header ───────────────────────────── -->
    <div class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div class="h-1.5 w-full bg-linear-to-r from-blue-500 via-blue-400 to-violet-500" />

      <div class="p-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <span :class="['size-3.5 rounded-full shrink-0 mt-0.5', dotColor()]" />
            <div>
              <h2 class="text-2xl font-black text-neutral-900 dark:text-white leading-tight">
                {{ data.plan_name ?? '—' }}
              </h2>
              <span class="mt-1.5 inline-flex items-center gap-1 text-xs font-mono font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg">
                <Tag class="size-3" />
                {{ data.slug ?? '—' }}
              </span>
            </div>
          </div>

          <div class="text-right shrink-0">
            <div class="flex items-baseline gap-0.5">
              <span class="text-sm font-bold text-neutral-400">$</span>
              <span class="text-3xl font-black text-neutral-900 dark:text-white">{{ fmt(data.cost) }}</span>
              <span class="text-sm font-semibold text-neutral-400 ml-1">/mo</span>
            </div>
            <p class="text-xs text-neutral-400 mt-0.5">Billed {{ billingLabel }}</p>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-4 gap-3">
          <div class="flex flex-col items-center justify-center gap-1 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-3">
            <Users class="size-4 text-blue-500" />
            <span class="text-xl font-black text-neutral-800 dark:text-neutral-100">
              {{ isUnlimited(data.mx_mbrs) ? '∞' : data.mx_mbrs }}
            </span>
            <span class="text-[10px] font-bold uppercase tracking-wide text-blue-500">Members</span>
          </div>

          <div class="flex flex-col items-center justify-center gap-1 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 p-3">
            <UserCog class="size-4 text-violet-500" />
            <span class="text-xl font-black text-neutral-800 dark:text-neutral-100">
              {{ isUnlimited(data.mxusrs) ? '∞' : data.mxusrs }}
            </span>
            <span class="text-[10px] font-bold uppercase tracking-wide text-violet-500">Users</span>
          </div>

          <div class="flex flex-col items-center justify-center gap-1 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 p-3">
            <Building2 class="size-4 text-teal-500" />
            <span class="text-xl font-black text-neutral-800 dark:text-neutral-100">
              {{ data.tenant_count ?? 0 }}
            </span>
            <span class="text-[10px] font-bold uppercase tracking-wide text-teal-500">Tenants</span>
          </div>

          <div class="flex flex-col items-center justify-center gap-1 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/50 p-3">
            <TrendingUp class="size-4 text-green-500" />
            <span class="text-xl font-black text-green-700 dark:text-green-300">
              ${{ fmt(data.mrr_contribution ?? 0) }}
            </span>
            <span class="text-[10px] font-bold uppercase tracking-wide text-green-500">MRR</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Features ───────────────────────────────────────── -->
    <div class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div v-if="featuresLoadError" class="px-5 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
        Could not load feature labels — showing stored keys only.
      </div>
      <div class="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <h3 class="text-sm font-black text-neutral-800 dark:text-neutral-100">Features</h3>
          <p class="text-xs text-neutral-400 mt-0.5">Capabilities included in this plan</p>
        </div>
        <div class="flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-950/40 px-3 py-1">
          <CheckCircle2 class="size-3.5 text-green-500" />
          <span class="text-xs font-black text-green-700 dark:text-green-300">{{ enabledCount }} / {{ features.length }} enabled</span>
        </div>
      </div>

      <div class="p-4 grid grid-cols-2 gap-2">
        <div
          v-for="feat in features"
          :key="feat.key"
          :class="[
            'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border transition-colors',
            feat.enabled
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
              : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-700/50'
          ]"
        >
          <component
            :is="feat.enabled ? CheckCircle2 : XCircle"
            :class="['size-4 shrink-0', feat.enabled ? 'text-green-500' : 'text-neutral-300 dark:text-neutral-600']"
          />
          <span :class="['text-xs font-semibold', feat.enabled ? 'text-neutral-800 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500']">
            {{ feat.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Metadata ───────────────────────────────────────── -->
    <div class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div class="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <h3 class="text-sm font-black text-neutral-800 dark:text-neutral-100">Plan Info</h3>
      </div>
      <div class="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800">
        <div class="px-5 py-4">
          <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1">
            <Hash class="size-3" />
            Plan ID
          </div>
          <p class="text-sm font-black text-neutral-700 dark:text-neutral-200 truncate">{{ data.id ?? '—' }}</p>
        </div>
        <div class="px-5 py-4">
          <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1">
            <Clock class="size-3" />
            Billing Cycle
          </div>
          <p class="text-sm font-black text-neutral-700 dark:text-neutral-200 capitalize">{{ data.billing_type ?? '—' }}</p>
        </div>
        <div class="px-5 py-4">
          <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1">
            <CalendarDays class="size-3" />
            Created
          </div>
          <p class="text-sm font-bold text-neutral-700 dark:text-neutral-200">{{ fmtDate(data.created_at) }}</p>
        </div>
      </div>
    </div>

  </div>
</template>
