<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">

    <!-- Page header -->
    <div class="px-6 pt-6 pb-5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black tracking-tight">Plans</h1>
        <p class="mt-1 text-sm text-neutral-500">Define the subscription tiers tenants can be licensed on.</p>
      </div>
      <button
        @click="openDrawer('add', null)"
        class="inline-flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#052659]/90 transition-colors shrink-0"
      >
        <Plus class="size-4" />
        New plan
      </button>
    </div>

    <div class="px-6 py-6 space-y-6">

      <!-- Stats cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="stat in statsCards" :key="stat.label"
          class="relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <div :class="['absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl', stat.accent]" />
          <div class="pl-1">
            <div :class="['flex size-9 items-center justify-center rounded-xl mb-3', stat.iconBg]">
              <component :is="stat.icon" :class="['size-4', stat.iconColor]" />
            </div>
            <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">{{ stat.label }}</p>
            <p :class="['text-2xl font-black', stat.valueColor ?? '']">{{ stat.value }}</p>
            <p class="text-xs text-neutral-400 mt-1">{{ stat.sub }}</p>
            <p v-if="stat.growth" class="text-xs font-bold text-green-600 mt-0.5">{{ stat.growth }}</p>
          </div>
        </div>
      </div>

      <!-- Controls row -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <!-- View toggle -->
          <div class="flex rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-900 p-1 gap-1">
            <button @click="viewMode = 'cards'"
              :class="['inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                viewMode === 'cards' ? 'bg-[#052659] text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300']">
              <LayoutGrid class="size-3.5" />
              Cards
            </button>
            <button @click="viewMode = 'table'"
              :class="['inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                viewMode === 'table' ? 'bg-[#052659] text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300']">
              <AlignJustify class="size-3.5" />
              Table
            </button>
          </div>

          <!-- Billing cycle toggle -->
          <div class="flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1">
            <button @click="billingView = 'monthly'"
              :class="['px-4 py-1.5 rounded-lg text-xs font-bold transition-colors',
                billingView === 'monthly' ? 'bg-[#052659] text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300']">
              Monthly
            </button>
            <button @click="billingView = 'annual'"
              :class="['inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors',
                billingView === 'annual' ? 'bg-[#052659] text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300']">
              Annual
              <span class="text-[10px] font-black bg-green-500 text-white px-1.5 py-0.5 rounded-full leading-none">-20%</span>
            </button>
          </div>
        </div>

        <!-- Search -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filter by name or slug..."
            class="pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-700 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 w-64 transition-all"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="flex flex-col items-center gap-3 text-neutral-400">
          <div class="size-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span class="text-sm">Loading plans...</span>
        </div>
      </div>

      <!-- Cards view -->
      <div v-else-if="viewMode === 'cards'" class="grid gap-5 lg:grid-cols-3">
        <div
          v-for="(plan, idx) in filteredPlans"
          :key="plan.id"
          @click="selectedPlanId = plan.id"
          :class="[
            'relative rounded-2xl border-2 bg-white dark:bg-neutral-900 p-6 shadow-sm transition-all duration-200 flex flex-col cursor-pointer',
            selectedPlanId === plan.id
              ? 'border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/30 ring-2 ring-blue-500/20'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700'
          ]"
        >
          <!-- Most popular badge -->
          <div v-if="idx === 1 && selectedPlanId !== plan.id" class="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span class="bg-[#052659] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              Most Popular
            </span>
          </div>
          <!-- Selected badge -->
          <div v-if="selectedPlanId === plan.id" class="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span class="bg-[#052659] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
              <span class="size-1.5 rounded-full bg-white/80 inline-block" />
              Selected
            </span>
          </div>

          <!-- Plan name + slug -->
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span :class="['size-2.5 rounded-full shrink-0', planDotColor(idx)]" />
                <h3 class="text-lg font-black">{{ plan.plan_name }}</h3>
              </div>
              <span class="mt-1.5 inline-block text-xs font-mono font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                {{ plan.slug }}
              </span>
            </div>
          </div>

          <!-- Price -->
          <div class="mt-5">
            <div class="flex items-baseline gap-1">
              <span class="text-sm font-bold text-neutral-400 self-start mt-1">$</span>
              <span class="text-5xl font-black tracking-tight">{{ displayPrice(plan) }}</span>
              <span class="text-sm font-semibold text-neutral-400">/mo</span>
            </div>
            <p class="text-xs text-neutral-400 mt-1.5">Billed {{ billingLabel(plan.billing_type) }} · cancel anytime</p>
          </div>

          <!-- Members + Users boxes -->
          <div class="mt-5 grid grid-cols-2 gap-2">
            <div class="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 p-3">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 mb-1">
                <Users class="size-3.5" />
                Members
              </div>
              <p class="text-xl font-black" :class="isUnlimited(plan.mx_mbrs) ? 'text-[#052659]' : ''">
                <span v-if="isUnlimited(plan.mx_mbrs)">∞ Unlimited</span>
                <span v-else>{{ plan.mx_mbrs }}</span>
              </p>
            </div>
            <div class="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 p-3">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 mb-1">
                <UserCog class="size-3.5" />
                Users
              </div>
              <p class="text-xl font-black" :class="isUnlimited(plan.mxusrs) ? 'text-[#052659]' : ''">
                <span v-if="isUnlimited(plan.mxusrs)">∞ Unlimited</span>
                <span v-else>{{ plan.mxusrs }}</span>
              </p>
            </div>
          </div>

          <!-- Tenant count + progress -->
          <div class="mt-5">
            <div class="flex items-center justify-between text-xs font-bold mb-1.5">
              <span>{{ plan.tenant_count ?? 0 }} tenants</span>
              <span class="text-neutral-400">{{ tenantPercent(plan) }}% of base</span>
            </div>
            <div class="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div :class="['h-full rounded-full transition-all', planBarColor(idx)]"
                :style="{ width: tenantPercent(plan) + '%' }" />
            </div>
          </div>

          <!-- MRR contribution -->
          <div class="mt-4 flex items-center gap-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-3.5 py-2.5">
            <DollarSign class="size-3.5 text-green-500 shrink-0" />
            <span class="text-xs font-semibold text-neutral-500">Contributes</span>
            <span class="text-sm font-black text-neutral-800 dark:text-neutral-100 ml-auto">${{ formatNum(plan.mrr_contribution ?? 0) }} MRR</span>
          </div>

          <!-- Features list -->
          <ul v-if="parsedFeatures(plan).length" class="mt-5 space-y-2 flex-1">
            <li v-for="feat in parsedFeatures(plan)" :key="feat.label" class="flex items-center gap-2 text-sm">
              <component :is="feat.enabled ? Check : Minus" :class="['size-4 shrink-0', feat.enabled ? 'text-green-500' : 'text-neutral-300 dark:text-neutral-600']" />
              <span :class="feat.enabled ? 'text-neutral-700 dark:text-neutral-200' : 'text-neutral-400 dark:text-neutral-500'">{{ feat.label }}</span>
            </li>
          </ul>

          <!-- Card actions -->
          <div class="mt-6 flex items-center gap-2 pt-5 border-t border-neutral-100 dark:border-neutral-800">
            <button
              @click="openDrawer('view', plan)"
              :class="[
                'flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors',
                idx === 1
                  ? 'bg-[#052659] text-white hover:bg-[#052659]/90'
                  : 'border-2 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
              ]"
            >
              View plan
            </button>
            <button
              @click="openDrawer('edit', plan)"
              class="flex-1 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
            >
              Edit
            </button>
            <button class="flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
              <MoreHorizontal class="size-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Table view -->
      <div v-else class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-neutral-100 dark:border-neutral-800">
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Plan</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Price</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Billing</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Members</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Users</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Tenants</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">MRR</th>
              <th class="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="(plan, idx) in filteredPlans" :key="plan.id" class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
              <td class="px-5 py-4">
                <div class="flex items-center gap-2">
                  <span :class="['size-2 rounded-full shrink-0', planDotColor(idx)]" />
                  <div>
                    <p class="font-bold">{{ plan.plan_name }}</p>
                    <p class="text-xs font-mono text-neutral-400">{{ plan.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 font-black">${{ displayPrice(plan) }}<span class="text-xs font-semibold text-neutral-400">/mo</span></td>
              <td class="px-5 py-4 capitalize text-neutral-500 font-semibold">{{ plan.billing_type }}</td>
              <td class="px-5 py-4 font-bold">{{ isUnlimited(plan.mx_mbrs) ? '∞' : plan.mx_mbrs }}</td>
              <td class="px-5 py-4 font-bold">{{ isUnlimited(plan.mxusrs) ? '∞' : plan.mxusrs }}</td>
              <td class="px-5 py-4 font-bold">{{ plan.tenant_count ?? 0 }}</td>
              <td class="px-5 py-4 font-black text-green-600">${{ formatNum(plan.mrr_contribution ?? 0) }}</td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openDrawer('view', plan)"
                    class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors">
                    <Eye class="size-3.5" /> View
                  </button>
                  <button @click="openDrawer('edit', plan)"
                    class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors">
                    <Pencil class="size-3.5" /> Edit
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- Drawer (create / edit / view) -->
    <Drawer
      :open="drawerOpen"
      :title="drawerTitle"
      :showFooter="drawerAction !== 'view'"
      @update:open="drawerOpen = $event"
      @save="saveDrawer"
      @submit="saveDrawer"
    >
      <template #body>
        <CreatePlan
          v-if="['add', 'edit'].includes(drawerAction)"
          :key="drawerKey"
          :data="{ ...drawerData, action: drawerAction }"
          v-model:form="formData"
        />
        <ShowPlan v-else-if="drawerAction === 'view'" :data="drawerData" />
      </template>
    </Drawer>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Plus, LayoutGrid, AlignJustify, Search, Users, UserCog,
  DollarSign, Check, Minus, Eye, Pencil, MoreHorizontal,
  List, TrendingUp, BarChart2,
} from 'lucide-vue-next'
import { pomPinia } from 'septor-store'
import { fetchTableData } from '@/Global/landingLayout/util'
import { Drawer } from '@/Global'
import { formawtacher } from '@/Global/Forminputs/formWatcher'
import { plansApi, featuresApi } from '@/central/modules/apis'
import { toast } from 'vue-sonner'
import CreatePlan from './Create.vue'
import ShowPlan from './Show.vue'

const Store = pomPinia() as any
const formStore = formawtacher()
const loading = ref(true)
const viewMode = ref<'cards' | 'table'>('cards')
const billingView = ref<'monthly' | 'annual'>('monthly')
const searchQuery = ref('')
const drawerOpen = ref(false)
const drawerAction = ref<'add' | 'edit' | 'view'>('add')
const drawerData = ref<any>({})
const formData = ref<Record<string, any>>({})
const plans = ref<any[]>([])
const statsData = ref<any>({})
const selectedPlanId = ref<any>(null)
const drawerKey = ref(0)
const featureLabels = ref<Record<string, string>>({})

const { create } = plansApi()

const DOT_COLORS = ['bg-blue-500', 'bg-blue-600', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500']
const BAR_COLORS = ['bg-blue-500', 'bg-blue-600', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500']

function planDotColor(idx: number) { return DOT_COLORS[idx % DOT_COLORS.length] }
function planBarColor(idx: number) { return BAR_COLORS[idx % BAR_COLORS.length] }

function isUnlimited(val: any) {
  return !val || val === 0 || val >= 999
}

function displayPrice(plan: any) {
  const price = Number(plan.cost ?? 0)
  const multiplier = billingView.value === 'annual' ? 0.8 : 1
  return (price * multiplier).toFixed(2)
}

function billingLabel(cycle: string) {
  const map: Record<string, string> = { monthly: 'monthly', yearly: 'annually', annual: 'annually', weekly: 'weekly', daily: 'daily', quarterly: 'quarterly' }
  return map[cycle] ?? cycle
}

function tenantPercent(plan: any) {
  const total = plans.value.reduce((sum, p) => sum + (p.tenant_count ?? 0), 0)
  if (!total) return 0
  return Math.round(((plan.tenant_count ?? 0) / total) * 100)
}

function formatNum(val: any) {
  return Number(val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parsedFeatures(plan: any) {
  let features: Record<string, any> = {}
  try {
    features = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features ?? {})
  } catch { features = {} }

  const allKeys = Object.keys(featureLabels.value).length
    ? Object.keys(featureLabels.value)
    : Object.keys(features)
  return allKeys.map((k) => ({
    label: featureLabels.value[k] ?? k,
    enabled: !!features[k],
  }))
}

const filteredPlans = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return plans.value
  return plans.value.filter((p) =>
    (p.plan_name ?? '').toLowerCase().includes(q) || (p.slug ?? '').toLowerCase().includes(q)
  )
})

const totalMrr = computed(() => plans.value.reduce((s, p) => s + Number(p.mrr_contribution ?? 0), 0))

const statsCards = computed(() => [
  {
    label: 'Total plans',
    value: statsData.value.total_plans ?? plans.value.length,
    sub: 'All billed monthly',
    icon: List,
    iconBg: 'bg-blue-50 dark:bg-blue-950/40',
    iconColor: 'text-blue-600 dark:text-blue-300',
    accent: 'bg-blue-500',
  },
  {
    label: 'Active subscribers',
    value: statsData.value.active_subscribers ?? 0,
    sub: 'Tenants on a paid plan',
    icon: Users,
    iconBg: 'bg-teal-50 dark:bg-teal-950/40',
    iconColor: 'text-teal-600 dark:text-teal-300',
    accent: 'bg-teal-500',
  },
  {
    label: 'Monthly recurring revenue',
    value: `$${formatNum(statsData.value.mrr ?? totalMrr.value)}`,
    sub: '',
    growth: statsData.value.mrr_growth ? `▲ ${statsData.value.mrr_growth}% vs last month` : null,
    icon: TrendingUp,
    iconBg: 'bg-green-50 dark:bg-green-950/40',
    iconColor: 'text-green-600 dark:text-green-300',
    accent: 'bg-green-500',
    valueColor: 'text-green-700 dark:text-green-300',
  },
  {
    label: 'Avg revenue / tenant',
    value: `$${formatNum(statsData.value.avg_per_tenant ?? 0)}`,
    sub: 'ARPA across all tiers',
    icon: BarChart2,
    iconBg: 'bg-violet-50 dark:bg-violet-950/40',
    iconColor: 'text-violet-600 dark:text-violet-300',
    accent: 'bg-violet-500',
  },
])

const drawerTitle = computed(() => {
  const map: Record<string, string> = { add: 'New Plan', edit: 'Edit Plan', view: 'Plan Details' }
  return map[drawerAction.value] ?? 'Plan'
})

async function loadPlans() {
  loading.value = true
  const res = await fetchTableData({
    data: {},
    props: { state: 'plans_list', url: 'central/settings/plans/list', reload: false, time: 0 },
    Store,
    saveData: false,
  })
  plans.value = res?.payload?.data ?? res?.payload ?? []
  loading.value = false
}

async function loadStats() {
  const res = await fetchTableData({
    data: {},
    props: { state: 'plans_stats', url: 'central/settings/plans/stats', reload: false, time: 0 },
    Store,
    saveData: false,
  })
  statsData.value = res?.payload ?? {}
}

function openDrawer(action: 'add' | 'edit' | 'view', plan: any) {
  drawerAction.value = action
  drawerData.value = plan ?? {}
  formData.value = {}
  drawerKey.value++
  drawerOpen.value = true
}

async function saveDrawer() {
  // Build a plain payload from the emitted form array
  const fields = Object.values(formData.value).filter((item: any) => item?.name)
  const payload: Record<string, any> = {}
  fields.forEach((f: any) => { payload[f.name] = f.value })

  // Frontend guard: required fields
  const required = ['name', 'cost', 'billing_type', 'mx_mbrs', 'mxusrs']
  const missing = required.filter((k) => payload[k] === undefined || payload[k] === null || payload[k] === '')
  if (missing.length) {
    toast.error(`Please fill in all required fields: ${missing.join(', ')}`)
    return
  }

  // Pack selected features as an array of IDs
  const selectedFeatures = (formData.value as any).selectedfeatures ?? []
  payload.features = selectedFeatures.map((f: any) => f.id)

  formStore.setLoading(true)
  try {
    await create(payload)
    toast.success(drawerAction.value === 'edit' ? 'Plan updated successfully.' : 'Plan created successfully.')
    formData.value = {}
    drawerOpen.value = false
    await loadPlans()
    await loadStats()
  } catch (err: any) {
    const errors = err?.response?.data?.errors
    if (errors) {
      Object.values(errors).forEach((messages: any) => toast.error(messages[0]))
    } else {
      toast.error(err?.response?.data?.message ?? 'Failed to save plan.')
    }
  } finally {
    formStore.setLoading(false)
  }
}

async function loadFeatureLabels() {
  try {
    const res = await featuresApi().list()
    const items: any[] = res?.data?.payload ?? res?.data?.data ?? []
    items.forEach((f: any) => { featureLabels.value[f.key] = f.name })
  } catch { /* non-fatal */ }
}

onMounted(() => {
  loadPlans()
  loadStats()
  loadFeatureLabels()
})
</script>
