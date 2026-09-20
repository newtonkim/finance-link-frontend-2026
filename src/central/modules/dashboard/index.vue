<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Building2,
  CircleAlert,
  Coins,
  HandCoins,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-vue-next'
import {
  centralDashboardApi,
  emptyAnalytics,
  type DashboardAnalytics,
} from '@/central/modules/apis/dashboard/dashboardApi'
import AttentionFeed from './components/AttentionFeed.vue'
import GrowthChart from './components/GrowthChart.vue'
import PlatformStat from './components/PlatformStat.vue'

const api = centralDashboardApi()

const data = ref<DashboardAnalytics>(emptyAnalytics())
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await api.getAnalytics()
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Could not load platform metrics.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const currency = computed(() => data.value.currency)

/** Full precision with separators — the reach figures are the ones people quote. */
function money(value: number): string {
  return new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

/** Compact form for the stat row, where magnitude matters more than digits. */
function moneyCompact(value: number): string {
  const n = Number(value || 0)
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
  return money(n)
}

function count(value: number): string {
  return new Intl.NumberFormat('en-UG').format(Number(value || 0))
}

const updatedAt = computed(() => {
  if (!data.value.generated_at) return ''
  return new Date(data.value.generated_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const tenantSub = computed(() => {
  const { total, active, suspended } = data.value.tenants
  if (!total) return 'None provisioned yet'
  if (suspended) return `${active} active · ${suspended} suspended`
  return `${active} active`
})

const licenceSub = computed(() => {
  const { expired, expiring_30_days: soon } = data.value.licenses
  if (expired) return `${expired} expired`
  if (soon) return `${soon} expiring within 30 days`
  return 'All current'
})

const licenceAlert = computed(() => data.value.licenses.expired > 0)

const reachSub = computed(() => {
  const { tenants_counted: counted, tenants_unreachable: unreachable } = data.value.reach
  const base = `Across ${counted} ${counted === 1 ? 'sacco' : 'saccos'}`
  return unreachable ? `${base} · ${unreachable} unavailable` : base
})

const planRows = computed(() => data.value.plans)
const hasPlansInUse = computed(() => planRows.value.some((p) => p.active_licences > 0))
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">
    <!-- Page header -->
    <div
      class="px-6 pt-6 pb-5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4"
    >
      <div>
        <h1 class="text-3xl font-black tracking-tight">Dashboard</h1>
        <p class="mt-1 text-sm text-neutral-500">
          <span v-if="updatedAt">Platform health across every SACCO. Updated {{ updatedAt }}.</span>
          <span v-else>Platform health across every SACCO.</span>
        </p>
      </div>
      <button
        type="button"
        :disabled="loading"
        class="inline-flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#052659]/90 transition-colors shrink-0 disabled:opacity-60"
        @click="load"
      >
        <RefreshCw class="size-4" :class="loading && 'animate-spin'" aria-hidden="true" />
        Refresh
      </button>
    </div>

    <div class="px-6 py-6 space-y-5">
      <!-- Load failure -->
      <div
        v-if="error"
        class="relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm flex items-start gap-3"
        role="alert"
      >
        <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-red-500" />
        <div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30 ml-1">
          <CircleAlert class="size-4 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold">{{ error }}</p>
          <button
            type="button"
            class="mt-2 text-xs font-bold text-[#052659] dark:text-nfuko-accent hover:underline"
            @click="load"
          >
            Try again
          </button>
        </div>
      </div>

      <!-- Stats cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PlatformStat
          label="Total Tenants"
          :value="count(data.tenants.total)"
          :sub="tenantSub"
          :icon="Building2"
          accent="bg-green-500"
          icon-bg="bg-green-50 dark:bg-green-900/30"
          icon-color="text-green-600 dark:text-green-400"
          :loading="loading"
        />
        <PlatformStat
          label="Active Licences"
          :value="count(data.licenses.active)"
          :sub="licenceSub"
          :alert="licenceAlert"
          :icon="ShieldCheck"
          :accent="licenceAlert ? 'bg-red-500' : 'bg-violet-500'"
          :icon-bg="licenceAlert ? 'bg-red-50 dark:bg-red-900/30' : 'bg-violet-50 dark:bg-violet-900/30'"
          :icon-color="licenceAlert ? 'text-red-600 dark:text-red-400' : 'text-violet-600 dark:text-violet-400'"
          :loading="loading"
        />
        <PlatformStat
          :label="`Recurring Revenue (${currency})`"
          :value="moneyCompact(data.revenue.mrr)"
          :sub="`${money(data.revenue.arr)} ${currency} annualised`"
          :icon="Coins"
          accent="bg-orange-500"
          icon-bg="bg-orange-50 dark:bg-orange-900/30"
          icon-color="text-orange-600 dark:text-orange-400"
          :loading="loading"
        />
        <PlatformStat
          label="Members Reached"
          :value="count(data.reach.members)"
          :sub="reachSub"
          :icon="Users"
          accent="bg-blue-500"
          icon-bg="bg-blue-50 dark:bg-blue-900/30"
          icon-color="text-blue-600 dark:text-blue-400"
          :loading="loading"
        />
      </div>

      <!-- What needs acting on, before anything decorative -->
      <AttentionFeed :items="data.attention" :loading="loading" />

      <!-- Growth + money under management -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <GrowthChart :points="data.growth" :loading="loading" />
        </div>

        <section
          class="flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm"
          aria-labelledby="managed-heading"
        >
          <div class="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 id="managed-heading" class="text-base font-black tracking-tight">Under Management</h2>
            <p class="mt-1 text-xs text-neutral-400">{{ reachSub }}</p>
          </div>

          <div class="flex flex-1 flex-col justify-center gap-6 px-5 py-6">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <div class="flex size-9 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/30">
                  <PiggyBank class="size-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
                <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Member Savings</p>
              </div>
              <div v-if="loading" class="h-7 w-32 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"></div>
              <p v-else class="text-2xl font-black tabular-nums">
                {{ money(data.reach.savings_balance) }}
                <span class="text-xs font-semibold text-neutral-400">{{ currency }}</span>
              </p>
            </div>

            <div>
              <div class="flex items-center gap-2 mb-2">
                <div class="flex size-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/30">
                  <HandCoins class="size-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
                </div>
                <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Loans Outstanding</p>
              </div>
              <div v-if="loading" class="h-7 w-32 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"></div>
              <p v-else class="text-2xl font-black tabular-nums">
                {{ money(data.reach.loans_outstanding) }}
                <span class="text-xs font-semibold text-neutral-400">{{ currency }}</span>
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- Plans + recent tenants -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- A handful of plans is a table, not a donut -->
        <section
          class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm"
          aria-labelledby="plans-heading"
        >
          <div class="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 id="plans-heading" class="text-base font-black tracking-tight">Plans</h2>
          </div>

          <div v-if="loading" class="space-y-3 p-5">
            <div v-for="n in 3" :key="n" class="h-9 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"></div>
          </div>

          <p v-else-if="!planRows.length" class="px-5 py-6 text-xs text-neutral-400">No plans configured yet.</p>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-neutral-200 dark:border-neutral-800">
                  <th
                    class="px-5 py-3.5 text-left text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider"
                  >
                    Plan
                  </th>
                  <th
                    class="px-4 py-3.5 text-right text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider"
                  >
                    Price
                  </th>
                  <th
                    class="px-5 py-3.5 text-right text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider"
                  >
                    Live
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="plan in planRows"
                  :key="plan.id"
                  class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td class="px-5 py-3">
                    <p class="truncate font-bold">{{ plan.name }}</p>
                    <p class="text-xs text-neutral-400 capitalize">{{ plan.billing_cycle }}</p>
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums text-neutral-600 dark:text-neutral-300">
                    {{ money(plan.price) }}
                  </td>
                  <td class="px-5 py-3 text-right">
                    <span
                      class="inline-flex min-w-7 justify-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums"
                      :class="
                        plan.active_licences
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                      "
                    >
                      {{ plan.active_licences }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <p
              v-if="!hasPlansInUse"
              class="border-t border-neutral-200 dark:border-neutral-800 px-5 py-3 text-xs text-neutral-400"
            >
              No plan currently has a live licence, so recurring revenue reads zero.
            </p>
          </div>
        </section>

        <!-- Recent tenants -->
        <section
          class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm"
          aria-labelledby="recent-heading"
        >
          <div class="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 id="recent-heading" class="text-base font-black tracking-tight">Recent Tenants</h2>
          </div>

          <div v-if="loading" class="space-y-3 p-5">
            <div v-for="n in 3" :key="n" class="h-9 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"></div>
          </div>

          <div v-else-if="!data.recent_tenants.length" class="px-5 py-6">
            <p class="text-sm font-bold">No saccos yet</p>
            <p class="mt-1 text-xs text-neutral-400">Provisioned saccos appear here as they are onboarded.</p>
          </div>

          <ul v-else class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <li
              v-for="tenant in data.recent_tenants"
              :key="tenant.subdomain"
              class="flex items-center gap-4 px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div
                class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#052659] text-xs font-black text-white"
                aria-hidden="true"
              >
                {{ tenant.name.charAt(0).toUpperCase() }}
              </div>

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold">{{ tenant.name }}</p>
                <p class="truncate text-xs text-neutral-400">
                  {{ tenant.subdomain }} · joined {{ tenant.created_at }}
                </p>
              </div>

              <span
                class="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                :class="
                  tenant.licence_active
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                "
              >
                {{ tenant.licence_active ? 'Licensed' : 'Unlicensed' }}
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
