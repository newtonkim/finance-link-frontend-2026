<template>
  <div class="px-6 py-5 flex flex-col gap-6">

    <!-- ── Header ────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Licenses</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Monitor and manage tenant subscriptions across the platform.
        </p>
      </div>
      <div class="flex items-center gap-2.5">
        <button
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
          <Download class="size-4" />
          Export
        </button>
        <button @click="() => openDrawer('add', null)"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
          <Plus class="size-4" />
          Issue license
        </button>
      </div>
    </div>

    <!-- ── Stats cards ───────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

      <!-- Active licenses -->
      <div class="relative bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-5 shadow-sm overflow-hidden">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-xl" />
        <div class="flex items-start gap-3 pl-2">
          <div class="size-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <CheckCircle class="size-5 text-green-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Active licenses</p>
            <p class="text-4xl font-bold text-neutral-900 dark:text-white mt-1 leading-none">{{ stats.active ?? '—' }}</p>
            <p class="text-xs text-green-500 mt-2 flex items-center gap-1 font-medium">
              <TrendingUp class="size-3" />
              {{ stats.issued_this_month ?? 0 }} issued this month
            </p>
          </div>
        </div>
      </div>

      <!-- Expiring ≤ 30 days -->
      <div class="relative bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-5 shadow-sm overflow-hidden">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-xl" />
        <div class="flex items-start gap-3 pl-2">
          <div class="size-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
            <Clock class="size-5 text-orange-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Expiring ≤ 30 days</p>
            <p class="text-4xl font-bold text-neutral-900 dark:text-white mt-1 leading-none">{{ stats.expiring_soon ?? '—' }}</p>
            <button class="text-xs text-orange-500 mt-2 hover:underline font-medium text-left">Send renewal reminders</button>
          </div>
        </div>
      </div>

      <!-- In grace period -->
      <div class="relative bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-5 shadow-sm overflow-hidden">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 rounded-l-xl" />
        <div class="flex items-start gap-3 pl-2">
          <div class="size-10 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle class="size-5 text-violet-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">In grace period</p>
            <p class="text-4xl font-bold text-neutral-900 dark:text-white mt-1 leading-none">{{ stats.grace ?? '—' }}</p>
            <button class="text-xs text-violet-500 mt-2 hover:underline font-medium text-left">Action needed</button>
          </div>
        </div>
      </div>

      <!-- Expired -->
      <div class="relative bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-5 shadow-sm overflow-hidden">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl" />
        <div class="flex items-start gap-3 pl-2">
          <div class="size-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <XCircle class="size-5 text-red-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Expired</p>
            <p class="text-4xl font-bold text-neutral-900 dark:text-white mt-1 leading-none">{{ stats.expired ?? '—' }}</p>
            <p class="text-xs text-red-400 mt-2 font-medium">Awaiting renewal</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Table card ────────────────────────────────────────────── -->
    <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm">

      <!-- filter tabs + search -->
      <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
        <div class="flex items-center gap-0.5 flex-wrap">
          <button v-for="tab in filterTabs" :key="tab.value" @click="setFilter(tab.value)" :class="[
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
            statusFilter === tab.value
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
          ]">
            {{ tab.label }}
            <span :class="[
              'px-1.5 rounded text-[10px] font-bold leading-5 inline-flex items-center',
              statusFilter === tab.value
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
            ]">{{ tab.count }}</span>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative">
            <Search class="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input v-model="searchQuery" type="text" placeholder="Filter by tenant or ID..."
              class="pl-8 pr-3 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-transparent text-neutral-700 dark:text-neutral-300 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-52" />
          </div>
          <button
            class="p-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <SlidersHorizontal class="size-4 text-neutral-500" />
          </button>
        </div>
      </div>

      <!-- table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-neutral-100 dark:border-neutral-800">
              <th class="w-10 px-5 py-3.5">
                <input type="checkbox" @change="toggleAll" :checked="allSelected"
                  class="rounded border-neutral-300 cursor-pointer" />
              </th>
              <th class="px-4 py-3.5 text-left text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Tenant</th>
              <th class="px-4 py-3.5 text-left text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Plan</th>
              <th class="px-4 py-3.5 text-left text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Start Date</th>
              <th class="px-4 py-3.5 text-left text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Expiry Date</th>
              <th class="px-4 py-3.5 text-left text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Days Left</th>
              <th class="px-4 py-3.5 text-left text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3.5 text-right text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- loading skeleton -->
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="border-b border-neutral-50 dark:border-neutral-800/50">
                <td class="px-5 py-4"><div class="h-4 w-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" /></td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    <div class="size-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                    <div class="space-y-1.5">
                      <div class="h-3 w-32 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                      <div class="h-2.5 w-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4"><div class="h-5 w-20 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse" /></td>
                <td class="px-4 py-4"><div class="h-4 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" /></td>
                <td class="px-4 py-4"><div class="h-4 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" /></td>
                <td class="px-4 py-4"><div class="h-4 w-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" /></td>
                <td class="px-4 py-4"><div class="h-5 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse" /></td>
                <td class="px-4 py-4"><div class="h-4 w-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse ml-auto" /></td>
              </tr>
            </template>

            <!-- empty -->
            <tr v-else-if="!filteredLicenses.length">
              <td colspan="8" class="py-16 text-center text-sm text-neutral-400 dark:text-neutral-500">
                No licenses found.
              </td>
            </tr>

            <!-- rows -->
            <template v-else>
              <tr v-for="license in filteredLicenses" :key="license.id" :class="[
                'hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors',
                'border-b border-neutral-50 dark:border-neutral-800/60 last:border-0',
                selectedIds.includes(license.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              ]">
                <td class="px-5 py-4">
                  <input type="checkbox" :checked="selectedIds.includes(license.id)"
                    @change="toggleSelect(license.id)"
                    class="rounded border-neutral-300 cursor-pointer accent-blue-600" />
                </td>

                <!-- tenant -->
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    <div :class="['size-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0', tenantColor(license.tenant_name)]">
                      {{ tenantInitials(license.tenant_name) }}
                    </div>
                    <div>
                      <p class="font-semibold text-neutral-900 dark:text-white text-sm leading-snug">{{ license.tenant_name }}</p>
                      <p class="text-[11px] text-neutral-400 dark:text-neutral-500 uppercase font-mono tracking-wide mt-0.5">{{ license.tenant_code ?? '' }}</p>
                    </div>
                  </div>
                </td>

                <!-- plan -->
                <td class="px-4 py-4">
                  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', planStyle(license.plan).badge]">
                    <span :class="['size-1.5 rounded-full shrink-0', planStyle(license.plan).dot]" />
                    {{ license.plan ?? '—' }}
                  </span>
                </td>

                <!-- license dates -->
                <td class="px-4 py-4 text-sm text-neutral-600 dark:text-neutral-300 font-mono">
                  {{ formatDate(license.starts) }}
                </td>
                <td class="px-4 py-4 text-sm text-neutral-600 dark:text-neutral-300 font-mono">
                  {{ formatDate(license.expires) }}
                </td>
                <td class="px-4 py-4">
                  <span :class="['text-sm font-medium', daysLeftStyle(license)]">
                    {{ daysLeftText(license) }}
                  </span>
                </td>

                <!-- status -->
                <td class="px-4 py-4">
                  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusStyle(license).badge]">
                    <span :class="['size-1.5 rounded-full shrink-0', statusStyle(license).dot]" />
                    {{ statusLabel(license) }}
                  </span>
                </td>

                <!-- actions -->
                <td class="px-4 py-4">
                  <div class="flex items-center justify-end gap-0.5">
                    <button @click="openDrawer('view', license)"
                      class="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                      <Eye class="size-4" />
                    </button>
                    <button @click="openDrawer('edit', license)"
                      class="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                      <Pencil class="size-4" />
                    </button>
                    <button @click="renewLicense(license)"
                      class="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors">
                      <RefreshCw class="size-4" />
                    </button>
                    <button
                      class="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                      <MoreVertical class="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- pagination -->
      <div v-if="pagination.total"
        class="flex items-center justify-between px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800">
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          Showing {{ licenses.length }} of {{ pagination.total }} licenses
        </p>
        <div class="flex items-center gap-1">
          <button @click="goToPage(pagination.current_page - 1)" :disabled="pagination.current_page <= 1" :class="[
            'size-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors',
            pagination.current_page <= 1
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
          ]">
            <ChevronLeft class="size-4 text-neutral-500" />
          </button>
          <button v-for="p in pageNumbers" :key="p" @click="goToPage(p)" :class="[
            'size-8 rounded-lg text-xs font-medium transition-colors',
            p === pagination.current_page
              ? 'bg-blue-600 text-white'
              : 'border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          ]">{{ p }}</button>
          <button @click="goToPage(pagination.current_page + 1)"
            :disabled="pagination.current_page >= pagination.last_page" :class="[
              'size-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors',
              pagination.current_page >= pagination.last_page
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
            ]">
            <ChevronRight class="size-4 text-neutral-500" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Bulk action bar ───────────────────────────────────────── -->
  <Transition name="slide-up">
    <div v-if="selectedIds.length > 0"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 dark:bg-neutral-800 text-white rounded-2xl px-5 py-3 flex items-center gap-2 shadow-2xl z-50 border border-neutral-700/50">
      <span class="text-sm font-semibold text-white pr-1">{{ selectedIds.length }} selected</span>
      <div class="w-px h-5 bg-neutral-600 mx-1" />
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors">
        <RefreshCw class="size-3.5" /> Renew
      </button>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors">
        <PauseCircle class="size-3.5" /> Suspend
      </button>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors">
        <Download class="size-3.5" /> Export
      </button>
      <button @click="clearSelection"
        class="ml-1 p-1.5 rounded-lg hover:bg-neutral-700 transition-colors text-neutral-400 hover:text-white">
        <X class="size-3.5" />
      </button>
    </div>
  </Transition>

  <!-- ── Drawer (create / edit / view) ────────────────────────── -->
  <Drawer v-if="drawerMounted" v-model:open="drawerOpen" :width="'sm:w-full md:w-1/2 lg:w-1/2'"
    :title="drawerTitle" :showFooter="drawerAction !== 'view'" @save="saveDrawer">
    <template #body>
      <LicenseForm v-if="['add', 'edit'].includes(drawerAction)" :data="{ ...drawerData, action: drawerAction }"
        v-model:form="formData" />
      <LicenseShow v-if="drawerAction === 'view'" :data="drawerData" />
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { pomPinia } from 'septor-store'
import {
  Download, Plus, CheckCircle, Clock, AlertTriangle, XCircle, TrendingUp,
  Search, SlidersHorizontal, Eye, Pencil, MoreVertical,
  ChevronLeft, ChevronRight, RefreshCw, PauseCircle, X
} from 'lucide-vue-next'
import { Drawer } from '@/Global'
import { fetchTableData } from '@/Global/landingLayout/util'
import LicenseForm from './Create.vue'
import LicenseShow from './Show.vue'
import { notify } from '@/Global/Toasters/ToastMsg'
import { lisenseApi } from '../apis'

const Store = pomPinia() as any
const router = useRouter()
const { create } = lisenseApi()

// ── state ──────────────────────────────────────────────────────
const statusFilter = ref('all')
const searchQuery = ref('')
const selectedIds = ref<string[]>([])
const drawerOpen = ref(false)
const drawerMounted = ref(false)
const drawerAction = ref<'add' | 'edit' | 'view'>('add')
const drawerData = ref<Record<string, any>>({})
const formData = ref<Record<string, any>>({})
const loading = ref(true)
const currentPage = ref(1)

// ── helpers ─────────────────────────────────────────────────────
const TENANT_COLORS = [
  'bg-teal-600', 'bg-emerald-600', 'bg-amber-600', 'bg-violet-600',
  'bg-cyan-700', 'bg-rose-600', 'bg-slate-600', 'bg-indigo-600',
]
function tenantColor(name: string) {
  if (!name) return 'bg-neutral-500'
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return TENANT_COLORS[Math.abs(h) % TENANT_COLORS.length]
}
function tenantInitials(name: string) {
  if (!name) return '??'
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function planStyle(plan: string) {
  const p = (plan ?? '').toLowerCase()
  if (p.includes('premium')) return { badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', dot: 'bg-blue-500' }
  if (p.includes('growth'))  return { badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-500' }
  if (p.includes('starter')) return { badge: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700/60 dark:text-neutral-300', dot: 'bg-neutral-400' }
  return { badge: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400', dot: 'bg-neutral-400' }
}

function formatDate(date: string) {
  if (!date) return '—'
  return date.slice(0, 10)
}

function daysLeftText(license: any) {
  return license.days_left_text ?? '—'
}

function daysLeftStyle(license: any) {
  const state = license.status_state ?? license.status
  if (state === 'expired') return 'text-red-500'
  if (state === 'expiring_soon') return 'text-orange-500'
  return license.days_left_text ? 'text-neutral-600 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-500'
}

function statusLabel(license: any) {
  if (license.status_label) return license.status_label
  const map: Record<string, string> = {
    active: 'Active', expired: 'Expired', trial: 'Trial',
    suspended: 'Suspended', grace: 'In grace',
  }
  return map[license.status] ?? license.status
}

function statusStyle(license: any) {
  const state = license.status_state ?? license.status
  const map: Record<string, { badge: string; dot: string }> = {
    active:    { badge: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300', dot: 'bg-green-500' },
    expired:   { badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300', dot: 'bg-red-500' },
    expiring_soon: { badge: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', dot: 'bg-orange-500' },
    trial:     { badge: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', dot: 'bg-violet-500' },
    suspended: { badge: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400', dot: 'bg-neutral-400' },
    grace:     { badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', dot: 'bg-amber-500' },
  }
  return map[state] ?? { badge: 'bg-neutral-100 text-neutral-600', dot: 'bg-neutral-400' }
}

// ── data ────────────────────────────────────────────────────────
const licenses = computed<any[]>(() => Store['licenseList']?.payload?.data ?? [])
const pagination = computed(() => ({
  current_page: Store['licenseList']?.payload?.current_page ?? 1,
  last_page:    Store['licenseList']?.payload?.last_page ?? 1,
  total:        Store['licenseList']?.payload?.total ?? 0,
}))
const stats = computed(() => Store['licenseStats']?.payload ?? {})

const filteredLicenses = computed(() => {
  if (!searchQuery.value.trim()) return licenses.value
  const q = searchQuery.value.toLowerCase()
  return licenses.value.filter(l =>
    (l.tenant_name ?? '').toLowerCase().includes(q) ||
    (l.tenant_code ?? '').toLowerCase().includes(q) ||
    (l.plan ?? '').toLowerCase().includes(q)
  )
})

const filterTabs = computed(() => [
  { label: 'All',       value: 'all',       count: stats.value.total ?? 0 },
  { label: 'Active',    value: 'active',    count: stats.value.active ?? 0 },
  { label: 'Grace',     value: 'grace',     count: stats.value.grace ?? 0 },
  { label: 'Suspended', value: 'suspended', count: stats.value.suspended ?? 0 },
  { label: 'Expired',   value: 'expired',   count: stats.value.expired ?? 0 },
  { label: 'Trial',     value: 'trial',     count: stats.value.trial ?? 0 },
])

// ── pagination ──────────────────────────────────────────────────
const pageNumbers = computed(() => {
  const total = pagination.value.last_page
  const cur = pagination.value.current_page
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: number[] = []
  for (let p = Math.max(1, cur - 1); p <= Math.min(total, cur + 1); p++) pages.push(p)
  if (!pages.includes(1)) pages.unshift(1)
  if (!pages.includes(total)) pages.push(total)
  return pages
})

// ── selection ───────────────────────────────────────────────────
const allSelected = computed(() =>
  licenses.value.length > 0 && licenses.value.every(l => selectedIds.value.includes(l.id))
)
function toggleAll(e: Event) {
  selectedIds.value = (e.target as HTMLInputElement).checked
    ? licenses.value.map(l => l.id)
    : []
}
function toggleSelect(id: string) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(i => i !== id)
    : [...selectedIds.value, id]
}
function clearSelection() { selectedIds.value = [] }

function renewLicense(license: any) {
  router.push(`/central/licenses/${license.id}/renew`)
}

// ── fetch ────────────────────────────────────────────────────────
async function fetchList(page = 1) {
  loading.value = true
  await fetchTableData({
    data: { page },
    props: { state: 'licenseList', url: `central/licenses/list?status=${statusFilter.value}`, reload: false, time: 0 },
    Store,
  })
  loading.value = false
}

async function fetchStats() {
  await fetchTableData({
    data: {},
    props: { state: 'licenseStats', url: 'central/licenses/stats', reload: false, time: 0 },
    Store,
  })
}

function setFilter(val: string) {
  statusFilter.value = val
  currentPage.value = 1
}

function goToPage(p: number) {
  if (p < 1 || p > pagination.value.last_page) return
  currentPage.value = p
  fetchList(p)
}

watch(statusFilter, () => fetchList(1))

onMounted(() => {
  fetchList()
  fetchStats()
})

// ── drawer ───────────────────────────────────────────────────────
const drawerTitle = computed(() => {
  const map: Record<string, string> = { add: 'Issue License', edit: 'Edit License', view: 'License Details' }
  return map[drawerAction.value] ?? 'License'
})

async function openDrawer(action: 'add' | 'edit' | 'view', license: any) {
  drawerMounted.value = false
  drawerAction.value = action
  if (action === 'edit' && license) {
    fetchTableData({
      data: { id: license.id },
      props: { state: 'licenseEditDetails', url: 'central/licenses/edit-details', reload: false, time: 0 },
      Store,
    })
    drawerData.value = Store['licenseEditDetails']?.payload ?? license
  } else {
    drawerData.value = license ?? {}
  }
  drawerMounted.value = true
  drawerOpen.value = true
}

async function saveDrawer() {
  try {
    await create(formData.value)
    drawerOpen.value = false
    formData.value = {}
    await fetchList(currentPage.value)
    await fetchStats()
  } catch {
    notify({ msg: 'Failed to save license', type: 'error' })
  }
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateX(-50%) translateY(1.5rem);
  opacity: 0;
}
.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}
</style>
