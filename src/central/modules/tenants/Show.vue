<script setup lang="ts">
import { computed } from 'vue'
import {
  ExternalLink, Globe, Database, CalendarDays, Hash,
  CheckCircle2, XCircle, CreditCard, Users, UserCog,
  Tag, Clock,
} from 'lucide-vue-next'

const props = defineProps<{ data: Record<string, any> }>()

const FEATURE_LABELS: Record<string, string> = {
  reports:          'Monthly statements',
  loans:            'Loans & SACCO module',
  savings:          'Core ledger & savings',
  shares:           'Shares module',
  nfc:              'NFC offline payments',
  api:              'REST API access',
  sso:              'SSO & audit logs',
  whitelabel:       'White-label & SSO',
  email_support:    'Email support',
  priority_support: 'Priority support',
}

function initials(name: string) {
  if (!name) return '?'
  return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
}

const statusStyles = computed(() => {
  const map: Record<string, { badge: string; dot: string; label: string }> = {
    active:    { badge: 'bg-green-50 text-green-700 border-green-200',        dot: 'bg-green-500',   label: 'Active' },
    trial:     { badge: 'bg-amber-50 text-amber-700 border-amber-200',        dot: 'bg-amber-500',   label: 'Trial' },
    suspended: { badge: 'bg-red-50 text-red-700 border-red-200',              dot: 'bg-red-500',     label: 'Suspended' },
    expired:   { badge: 'bg-neutral-100 text-neutral-500 border-neutral-200', dot: 'bg-neutral-400', label: 'Expired' },
  }
  return map[props.data.status] ?? map.expired
})

const parsedFeatures = computed(() => {
  const raw = props.data.features
  if (!raw) return {}
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return {} } }
  return {}
})

const featureList = computed(() =>
  Object.entries(FEATURE_LABELS).map(([key, label]) => ({
    key, label, enabled: !!parsedFeatures.value[key],
  }))
)

const enabledCount = computed(() => featureList.value.filter(f => f.enabled).length)
const hasFeatures  = computed(() => Object.keys(parsedFeatures.value).length > 0)

function isUnlimited(v: any) { return !v || Number(v) === 0 || Number(v) >= 999 }
function fmt(v: any) {
  return Number(v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtDate(v: any) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
function fmtTime(v: any) {
  if (!v) return ''
  return new Date(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function daysLeft(dateStr: string) {
  if (!dateStr) return null
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000))
}
function daysLeftClass(dateStr: string) {
  const d = daysLeft(dateStr)
  if (d === null) return 'text-neutral-400'
  if (d === 0)   return 'text-red-500 font-bold'
  if (d <= 7)    return 'text-amber-500 font-bold'
  return 'text-neutral-700 dark:text-neutral-200 font-semibold'
}
</script>

<template>
  <div class="space-y-4 px-1 pb-6">

    <!-- ── Identity card ───────────────────────────────── -->
    <div class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">

      <!-- Sidebar-toned gradient bar -->
      <div class="h-20 relative" style="background: linear-gradient(to right, #0c1427, #0050D8)">
        <div class="absolute -bottom-8 left-6">
          <div class="size-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg ring-4 ring-white dark:ring-neutral-900"
               style="background-color: #0c1427">
            {{ initials(data.sacco_name) }}
          </div>
        </div>
      </div>

      <!-- Name / meta -->
      <div class="pt-12 pb-5 px-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-black text-neutral-900 dark:text-white leading-tight">
              {{ data.sacco_name ?? '—' }}
            </h2>
            <a
              v-if="data.url || data.sacco_domain"
              :href="data.url || data.sacco_domain"
              target="_blank"
              class="inline-flex items-center gap-1.5 mt-1 text-sm font-medium text-nfuko-primary hover:underline"
            >
              <Globe class="size-3.5" />
              {{ data.url || data.sacco_domain }}
              <ExternalLink class="size-3" />
            </a>
            <p v-else class="mt-1 text-sm text-neutral-400">No domain configured</p>
            <p v-if="data.host_domain" class="text-xs text-neutral-400 mt-0.5">Host: {{ data.host_domain }}</p>
          </div>

          <span :class="['inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black border shrink-0 mt-1', statusStyles.badge]">
            <span :class="['size-2 rounded-full', statusStyles.dot]" />
            {{ statusStyles.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── License & Plan ──────────────────────────────── -->
    <div class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div class="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <h3 class="text-sm font-black text-neutral-800 dark:text-neutral-100">License & Plan</h3>
        <p class="text-xs text-neutral-400 mt-0.5">Subscription and billing details</p>
      </div>

      <!-- Plan name row -->
      <div class="p-5 flex items-center gap-4 border-b border-neutral-100 dark:border-neutral-800">
        <div class="size-12 rounded-xl flex items-center justify-center shrink-0" style="background-color: rgba(0,80,216,0.08)">
          <CreditCard class="size-6 text-nfuko-primary" />
        </div>
        <div class="flex-1">
          <p class="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">Active Plan</p>
          <p class="text-base font-black text-neutral-800 dark:text-neutral-100 capitalize">
            {{ data.plan_name ?? 'No plan' }}
          </p>
        </div>
        <div v-if="data.plan_slug" class="shrink-0">
          <span class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-nfuko-primary"
                style="background-color: rgba(0,80,216,0.08)">
            <Tag class="size-3" />
            {{ data.plan_slug }}
          </span>
        </div>
      </div>

      <!-- Metrics: cost / members / users -->
      <div class="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800">
        <div class="px-5 py-4 flex flex-col items-center gap-1">
          <p class="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Cost</p>
          <p class="text-xl font-black text-neutral-800 dark:text-neutral-100">${{ fmt(data.cost) }}</p>
          <p class="text-[10px] text-neutral-400 capitalize">{{ data.billing_type ?? '—' }}</p>
        </div>

        <div class="px-5 py-4 flex flex-col items-center gap-1" style="background-color: rgba(0,80,216,0.04)">
          <Users class="size-4 text-nfuko-primary mb-0.5" />
          <p class="text-xl font-black text-neutral-800 dark:text-neutral-100">
            {{ isUnlimited(data.mx_mbrs) ? '∞' : (data.mx_mbrs ?? '—') }}
          </p>
          <p class="text-[10px] font-bold uppercase tracking-wide text-nfuko-primary">Members</p>
        </div>

        <div class="px-5 py-4 flex flex-col items-center gap-1">
          <UserCog class="size-4 text-nfuko-accent mb-0.5" />
          <p class="text-xl font-black text-neutral-800 dark:text-neutral-100">
            {{ isUnlimited(data.mxusrs) ? '∞' : (data.mxusrs ?? '—') }}
          </p>
          <p class="text-[10px] font-bold uppercase tracking-wide text-nfuko-accent">Users</p>
        </div>
      </div>

      <!-- License expiry -->
      <div v-if="data.license_expires_at" class="px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
        <Clock class="size-3.5 text-neutral-400 shrink-0" />
        <span class="text-xs text-neutral-400 font-medium">License expires</span>
        <span :class="['text-xs ml-auto', daysLeftClass(data.license_expires_at)]">
          {{ daysLeft(data.license_expires_at) === 0 ? 'Expired' : `${daysLeft(data.license_expires_at)}d left` }}
          &mdash; {{ fmtDate(data.license_expires_at) }}
        </span>
      </div>
    </div>

    <!-- ── Features ────────────────────────────────────── -->
    <div v-if="hasFeatures" class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <h3 class="text-sm font-black text-neutral-800 dark:text-neutral-100">Plan Features</h3>
          <p class="text-xs text-neutral-400 mt-0.5">Capabilities available to this tenant</p>
        </div>
        <div class="flex items-center gap-1.5 rounded-full px-3 py-1" style="background-color: rgba(0,80,216,0.08)">
          <CheckCircle2 class="size-3.5 text-nfuko-primary" />
          <span class="text-xs font-black text-nfuko-primary">{{ enabledCount }} / {{ featureList.length }}</span>
        </div>
      </div>

      <div class="p-4 grid grid-cols-2 gap-2">
        <div
          v-for="feat in featureList"
          :key="feat.key"
          :class="[
            'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border transition-colors',
            feat.enabled
              ? 'border-nfuko-primary/20 dark:border-nfuko-primary/30'
              : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-700/50'
          ]"
          :style="feat.enabled ? 'background-color: rgba(0,80,216,0.06)' : ''"
        >
          <component
            :is="feat.enabled ? CheckCircle2 : XCircle"
            :class="['size-4 shrink-0', feat.enabled ? 'text-nfuko-primary' : 'text-neutral-300 dark:text-neutral-600']"
          />
          <span :class="['text-xs font-semibold truncate', feat.enabled ? 'text-neutral-800 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500']">
            {{ feat.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Account Info ────────────────────────────────── -->
    <div class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div class="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <h3 class="text-sm font-black text-neutral-800 dark:text-neutral-100">Account Info</h3>
      </div>
      <div class="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800">
        <div class="px-5 py-4">
          <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-2">
            <Hash class="size-3" />
            Tenant ID
          </div>
          <p class="text-sm font-black text-neutral-700 dark:text-neutral-200 truncate">{{ data.id ?? '—' }}</p>
        </div>
        <div class="px-5 py-4 bg-neutral-50 dark:bg-neutral-800/40">
          <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-2">
            <Database class="size-3" />
            Database
          </div>
          <p class="text-sm font-mono font-bold text-neutral-700 dark:text-neutral-200 truncate">{{ data.storage ?? '—' }}</p>
        </div>
        <div class="px-5 py-4">
          <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-2">
            <CalendarDays class="size-3" />
            Date Created
          </div>
          <p class="text-sm font-bold text-neutral-700 dark:text-neutral-200">{{ fmtDate(data.created_at) }}</p>
          <p class="text-[11px] text-neutral-400 mt-0.5">{{ fmtTime(data.created_at) }}</p>
        </div>
      </div>
    </div>

  </div>
</template>
