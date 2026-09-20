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

/** Compact form for the headline row, where the magnitude matters more than the digits. */
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

const tenantNote = computed(() => {
  const { total, active, suspended } = data.value.tenants
  if (!total) return 'None provisioned yet'
  if (suspended) return `${active} active · ${suspended} suspended`
  return `${active} active`
})

const licenceNote = computed(() => {
  const { expired, expiring_30_days: soon } = data.value.licenses
  if (expired) return `${expired} expired`
  if (soon) return `${soon} expiring within 30 days`
  return 'All current'
})

const licenceAlert = computed(() => data.value.licenses.expired > 0)

const reachNote = computed(() => {
  const { tenants_counted: counted, tenants_unreachable: unreachable } = data.value.reach
  const base = `Across ${counted} ${counted === 1 ? 'sacco' : 'saccos'}`
  return unreachable ? `${base} · ${unreachable} unavailable` : base
})

const planRows = computed(() => data.value.plans)
const hasPlansInUse = computed(() => planRows.value.some((p) => p.active_licences > 0))
</script>

<template>
  <div class="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6">
    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-[22px] font-semibold tracking-tight text-neutral-900 dark:text-white">Platform</h1>
        <p class="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
          <span v-if="updatedAt">Updated {{ updatedAt }}</span>
          <span v-else>Loading platform metrics…</span>
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-semibold text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nfuko-primary dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
        :disabled="loading"
        @click="load"
      >
        <RefreshCw class="size-4" :class="loading && 'animate-spin'" aria-hidden="true" />
        Refresh
      </button>
    </header>

    <!-- Load failure -->
    <div
      v-if="error"
      class="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-500/20 dark:bg-red-500/10"
      role="alert"
    >
      <CircleAlert class="mt-0.5 size-5 shrink-0 text-nfuko-danger" aria-hidden="true" />
      <div class="flex-1">
        <p class="text-[14px] font-semibold text-red-900 dark:text-red-200">{{ error }}</p>
        <button
          type="button"
          class="mt-2 text-[13px] font-semibold text-red-800 underline underline-offset-2 dark:text-red-300"
          @click="load"
        >
          Try again
        </button>
      </div>
    </div>

    <!-- What needs doing, before what looks good -->
    <AttentionFeed :items="data.attention" :loading="loading" />

    <!-- Headline figures -->
    <section
      class="grid grid-cols-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 dark:divide-white/5 dark:border-white/10 dark:bg-[#151515]"
      aria-label="Platform headline figures"
    >
      <PlatformStat
        label="Tenants"
        :value="count(data.tenants.total)"
        :note="tenantNote"
        :icon="Building2"
        :loading="loading"
        class="sm:border-r sm:border-neutral-100 dark:sm:border-white/5"
      />
      <PlatformStat
        label="Active licences"
        :value="count(data.licenses.active)"
        :note="licenceNote"
        :alert="licenceAlert"
        :icon="ShieldCheck"
        :loading="loading"
        class="lg:border-r lg:border-neutral-100 dark:lg:border-white/5"
      />
      <PlatformStat
        :label="`Recurring revenue (${currency})`"
        :value="moneyCompact(data.revenue.mrr)"
        :note="`${money(data.revenue.arr)} ${currency} annualised`"
        :icon="Coins"
        :loading="loading"
        class="sm:border-r sm:border-neutral-100 dark:sm:border-white/5"
      />
      <PlatformStat
        label="Members reached"
        :value="count(data.reach.members)"
        :note="reachNote"
        :icon="Users"
        :loading="loading"
      />
    </section>

    <!-- Growth + money under management -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <GrowthChart :points="data.growth" :loading="loading" />
      </div>

      <section
        class="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#151515]"
        aria-labelledby="managed-heading"
      >
        <header class="px-5 py-4">
          <h2 id="managed-heading" class="text-base font-semibold text-neutral-900 dark:text-white">
            Under management
          </h2>
          <p class="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">{{ reachNote }}</p>
        </header>

        <div class="flex flex-1 flex-col justify-center gap-6 px-5 pb-6">
          <div>
            <div class="flex items-center gap-2">
              <PiggyBank class="size-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
              <span class="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">Member savings</span>
            </div>
            <div v-if="loading" class="mt-2 h-7 w-32 animate-pulse rounded bg-neutral-100 dark:bg-white/10"></div>
            <p v-else class="mt-2 text-[24px] font-semibold tracking-tight text-neutral-900 tabular-nums dark:text-white">
              {{ money(data.reach.savings_balance) }}
              <span class="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">{{ currency }}</span>
            </p>
          </div>

          <div>
            <div class="flex items-center gap-2">
              <HandCoins class="size-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
              <span class="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">Loans outstanding</span>
            </div>
            <div v-if="loading" class="mt-2 h-7 w-32 animate-pulse rounded bg-neutral-100 dark:bg-white/10"></div>
            <p v-else class="mt-2 text-[24px] font-semibold tracking-tight text-neutral-900 tabular-nums dark:text-white">
              {{ money(data.reach.loans_outstanding) }}
              <span class="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">{{ currency }}</span>
            </p>
          </div>
        </div>
      </section>
    </div>

    <!-- Plans + recent tenants -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- A handful of plans is a table, not a donut -->
      <section
        class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#151515]"
        aria-labelledby="plans-heading"
      >
        <header class="border-b border-neutral-100 px-5 py-4 dark:border-white/10">
          <h2 id="plans-heading" class="text-base font-semibold text-neutral-900 dark:text-white">Plans</h2>
        </header>

        <div v-if="loading" class="space-y-3 p-5">
          <div v-for="n in 3" :key="n" class="h-9 animate-pulse rounded bg-neutral-100 dark:bg-white/5"></div>
        </div>

        <p v-else-if="!planRows.length" class="px-5 py-6 text-[13px] text-neutral-500 dark:text-neutral-400">
          No plans configured yet.
        </p>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-white/10">
                <th class="px-5 py-2.5 text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">Plan</th>
                <th class="px-5 py-2.5 text-right text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                  Price
                </th>
                <th class="px-5 py-2.5 text-right text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                  Live
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-white/5">
              <tr
                v-for="plan in planRows"
                :key="plan.id"
                class="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-white/5"
              >
                <td class="px-5 py-3">
                  <p class="truncate text-[14px] font-medium text-neutral-900 dark:text-white">{{ plan.name }}</p>
                  <p class="text-[12px] text-neutral-500 capitalize dark:text-neutral-400">{{ plan.billing_cycle }}</p>
                </td>
                <td class="px-5 py-3 text-right text-[14px] tabular-nums text-neutral-700 dark:text-neutral-300">
                  {{ money(plan.price) }}
                </td>
                <td class="px-5 py-3 text-right">
                  <span
                    class="inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums"
                    :class="
                      plan.active_licences
                        ? 'bg-nfuko-primary/10 text-nfuko-primary dark:bg-white/10 dark:text-nfuko-accent'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-white/5 dark:text-neutral-400'
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
            class="border-t border-neutral-100 px-5 py-3 text-[12px] text-neutral-500 dark:border-white/10 dark:text-neutral-400"
          >
            No plan currently has a live licence, so recurring revenue reads zero.
          </p>
        </div>
      </section>

      <!-- Recent tenants -->
      <section
        class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#151515]"
        aria-labelledby="recent-heading"
      >
        <header class="border-b border-neutral-100 px-5 py-4 dark:border-white/10">
          <h2 id="recent-heading" class="text-base font-semibold text-neutral-900 dark:text-white">
            Recent tenants
          </h2>
        </header>

        <div v-if="loading" class="space-y-3 p-5">
          <div v-for="n in 3" :key="n" class="h-9 animate-pulse rounded bg-neutral-100 dark:bg-white/5"></div>
        </div>

        <div v-else-if="!data.recent_tenants.length" class="px-5 py-6">
          <p class="text-[14px] font-medium text-neutral-900 dark:text-white">No saccos yet</p>
          <p class="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
            Provisioned saccos appear here as they are onboarded.
          </p>
        </div>

        <ul v-else class="divide-y divide-neutral-100 dark:divide-white/5">
          <li
            v-for="tenant in data.recent_tenants"
            :key="tenant.subdomain"
            class="flex items-center gap-4 px-5 py-3 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-white/5"
          >
            <div
              class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-nfuko-primary/10 text-[13px] font-semibold text-nfuko-primary dark:bg-white/10 dark:text-nfuko-accent"
              aria-hidden="true"
            >
              {{ tenant.name.charAt(0).toUpperCase() }}
            </div>

            <div class="min-w-0 flex-1">
              <p class="truncate text-[14px] font-medium text-neutral-900 dark:text-white">{{ tenant.name }}</p>
              <p class="truncate text-[12px] text-neutral-500 dark:text-neutral-400">
                {{ tenant.subdomain }} · joined {{ tenant.created_at }}
              </p>
            </div>

            <span
              class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              :class="
                tenant.licence_active
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
              "
            >
              {{ tenant.licence_active ? 'Licensed' : 'Unlicensed' }}
            </span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
