<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">

    <!-- Page header -->
    <div class="px-6 pt-6 pb-5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black tracking-tight">Tenants</h1>
        <p class="mt-1 text-sm text-neutral-500">Manage all SACCO organisations registered on the platform.</p>
      </div>
      <button
        @click="openDrawer('add', null)"
        class="inline-flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#052659]/90 transition-colors shrink-0"
      >
        <Plus class="size-4" />
        Add New
      </button>
    </div>

    <div class="px-6 py-6 space-y-5">

      <!-- Stats cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="stat in statsCards"
          :key="stat.label"
          class="relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm"
        >
          <div :class="['absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl', stat.accent]" />
          <div class="pl-1">
            <div :class="['flex size-9 items-center justify-center rounded-xl mb-3', stat.iconBg]">
              <component :is="stat.icon" :class="['size-4', stat.iconColor]" />
            </div>
            <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">{{ stat.label }}</p>
            <p class="text-2xl font-black">{{ stat.value }}</p>
            <p class="text-xs text-neutral-400 mt-1">{{ stat.sub }}</p>
          </div>
        </div>
      </div>

      <!-- Controls row -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <!-- Status filter pills -->
        <div class="flex items-center gap-1.5 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <button
            v-for="f in filterOptions"
            :key="f.value"
            @click="statusFilter = f.value"
            :class="[
              'px-4 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize',
              statusFilter === f.value
                ? 'bg-[#052659] text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            ]"
          >
            {{ f.label }}
            <span
              :class="[
                'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black',
                statusFilter === f.value
                  ? 'bg-white/20 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
              ]"
            >
              {{ f.count }}
            </span>
          </button>
        </div>

        <!-- Search -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name or domain..."
            class="pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-700 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 w-80 transition-all"
          />
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="flex flex-col items-center gap-3 text-neutral-400">
          <div class="size-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span class="text-sm">Loading tenants...</span>
        </div>
      </div>

      <!-- Table -->
      <div v-else class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">

        <!-- Empty state -->
        <div v-if="filteredTenants.length === 0" class="flex flex-col items-center justify-center py-20 gap-3">
          <div class="size-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Building2 class="size-7 text-neutral-400" />
          </div>
          <p class="text-sm font-bold text-neutral-500">No tenants found</p>
          <p class="text-xs text-neutral-400">Try a different filter or search term.</p>
        </div>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b border-neutral-100 dark:border-neutral-800">
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">SACCO</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Domain</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Database</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">License</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Status</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Created</th>
              <th class="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr
              v-for="tenant in filteredTenants"
              :key="tenant.id"
              class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group"
            >
              <!-- SACCO -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div :class="['size-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0', avatarColor(tenant.sacco_name)]">
                    {{ initials(tenant.sacco_name) }}
                  </div>
                  <div>
                    <p class="font-bold text-neutral-800 dark:text-neutral-100 leading-tight">{{ tenant.sacco_name ?? '—' }}</p>
                    <p class="text-[11px] text-neutral-400 font-medium">ID #{{ tenant.id }}</p>
                  </div>
                </div>
              </td>

              <!-- Domain -->
              <td class="px-5 py-3.5">
                <div class="space-y-0.5">
                  <a
                    v-if="tenant.url"
                    :href="tenant.url"
                    target="_blank"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline text-xs"
                  >
                    <ExternalLink class="size-3 shrink-0" />
                    {{ tenant.url }}
                  </a>
                  <span v-else class="text-neutral-400 text-xs">—</span>
                  <p v-if="tenant.host_domain" class="text-[11px] text-neutral-400">{{ tenant.host_domain }}</p>
                </div>
              </td>

              <!-- Database -->
              <td class="px-5 py-3.5">
                <span class="inline-flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300">
                  <Database class="size-3 shrink-0" />
                  {{ tenant.storage ?? '—' }}
                </span>
              </td>

              <!-- License expiry -->
              <td class="px-5 py-3.5">
                <div v-if="tenant.license_expires_at" class="flex items-center gap-1.5">
                  <Clock class="size-3.5 text-neutral-400 shrink-0" />
                  <div>
                    <p :class="['text-xs font-bold', daysLeftClass(tenant.license_expires_at)]">
                      {{ daysLeftLabel(tenant.license_expires_at) }}
                    </p>
                    <p class="text-[11px] text-neutral-400">{{ fmtDate(tenant.license_expires_at) }}</p>
                  </div>
                </div>
                <span v-else class="text-xs font-bold text-red-400">No license</span>
              </td>

              <!-- Status -->
              <td class="px-5 py-3.5">
                <span :class="['inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize', statusClass(tenant.status)]">
                  <span :class="['size-1.5 rounded-full', statusDot(tenant.status)]" />
                  {{ tenant.status ?? 'unknown' }}
                </span>
              </td>

              <!-- Created -->
              <td class="px-5 py-3.5 text-sm text-neutral-500 font-medium">
                {{ fmtDate(tenant.created_at) }}
              </td>

              <!-- Actions -->
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    v-if="isExpired(tenant)"
                    @click="renewTenant(tenant)"
                    class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                    title="Renew expired license"
                  >
                    <RefreshCw class="size-3.5" /> Renew
                  </button>
                  <button
                    @click="openDrawer('view', tenant)"
                    class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                  >
                    <Eye class="size-3.5" /> View
                  </button>
                  <button
                    @click="openDrawer('edit', tenant)"
                    class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                  >
                    <Pencil class="size-3.5" /> Edit
                  </button>
                  <button
                    @click="confirmDelete(tenant)"
                    class="flex size-7 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 class="size-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Table footer -->
        <div
          v-if="filteredTenants.length > 0"
          class="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800"
        >
          <p class="text-xs text-neutral-400 font-medium">
            Showing
            <span class="font-bold text-neutral-600 dark:text-neutral-300">{{ filteredTenants.length }}</span>
            of
            <span class="font-bold text-neutral-600 dark:text-neutral-300">{{ allTenants.length }}</span>
            tenants
          </p>
        </div>
      </div>
    </div>

    <!-- Drawer -->
    <Drawer
      :open="drawerOpen"
      :title="drawerTitle"
      :showFooter="showFooter"
      @update:open="drawerOpen = $event"
      @save="saveTenant"
      @submit="saveTenant"
    >
      <template #body>
        <TenantForm
          v-if="['add', 'edit'].includes(drawerAction)"
          :watcher="{ action: drawerAction, data: drawerData }"
          v-model:form="formData"
          @changedStep="onChangedStep"
        />
        <TenantShow v-else-if="drawerAction === 'view'" :data="drawerData" />
      </template>
    </Drawer>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus, Building2, Search, Clock, Eye, Pencil, Trash2,
  Database, ExternalLink, UserCheck, UserX, RefreshCw,
} from 'lucide-vue-next'
import { pomPinia } from 'septor-store'
import { fetchTableData } from '@/Global/landingLayout/util'
import { Drawer } from '@/Global'
import { tenantsApi } from '../apis'
import { formawtacher } from '@/Global/Forminputs/formWatcher'
import TenantForm from './Create.vue'
import TenantShow from './Show.vue'
import { toast } from 'vue-sonner'

const Store = pomPinia() as any
const router = useRouter()
const formStore = formawtacher()
const { create, Erase } = tenantsApi()

const loading       = ref(true)
const allTenants    = ref<any[]>([])
const searchQuery   = ref('')
const statusFilter  = ref('all')
const drawerOpen    = ref(false)
const drawerAction  = ref<'add' | 'edit' | 'view'>('add')
const drawerData    = ref<any>({})
const formData      = ref<Record<string, any>>({})
const showFooter    = ref(false)

const filterOptions = computed(() => [
  { value: 'all',       label: 'All',       count: allTenants.value.length },
  { value: 'active',    label: 'Active',    count: allTenants.value.filter(t => t.status === 'active').length },
  { value: 'trial',     label: 'Trial',     count: allTenants.value.filter(t => t.status === 'trial').length },
  { value: 'suspended', label: 'Suspended', count: allTenants.value.filter(t => t.status === 'suspended').length },
])

const statsCards = computed(() => [
  {
    label: 'Total Tenants',
    value: allTenants.value.length,
    sub: 'All SACCO organisations',
    icon: Building2,
    iconBg: 'bg-blue-50 dark:bg-blue-950/40',
    iconColor: 'text-blue-600',
    accent: 'bg-blue-500',
  },
  {
    label: 'Active',
    value: allTenants.value.filter(t => t.status === 'active').length,
    sub: 'Currently active',
    icon: UserCheck,
    iconBg: 'bg-green-50 dark:bg-green-950/40',
    iconColor: 'text-green-600',
    accent: 'bg-green-500',
  },
  {
    label: 'Trial',
    value: allTenants.value.filter(t => t.status === 'trial').length,
    sub: 'On trial period',
    icon: Clock,
    iconBg: 'bg-amber-50 dark:bg-amber-950/40',
    iconColor: 'text-amber-600',
    accent: 'bg-amber-500',
  },
  {
    label: 'Suspended',
    value: allTenants.value.filter(t => t.status === 'suspended').length,
    sub: 'Access restricted',
    icon: UserX,
    iconBg: 'bg-red-50 dark:bg-red-950/40',
    iconColor: 'text-red-600',
    accent: 'bg-red-500',
  },
])

const filteredTenants = computed(() => {
  let list = statusFilter.value === 'all'
    ? allTenants.value
    : allTenants.value.filter(t => t.status === statusFilter.value)
  const q = searchQuery.value.toLowerCase()
  if (q) list = list.filter(t =>
    (t.sacco_name ?? '').toLowerCase().includes(q) ||
    (t.url ?? '').toLowerCase().includes(q)
  )
  return list
})

const drawerTitle = computed(() => {
  const map: Record<string, string> = {
    add: 'New Tenant', edit: 'Edit Tenant', view: 'Tenant Details',
  }
  return map[drawerAction.value] ?? 'Tenant'
})

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-amber-600', 'bg-rose-600', 'bg-teal-600', 'bg-indigo-600',
]
function avatarColor(name: string) {
  const idx = Math.abs((name ?? 'A').charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}
function initials(name: string) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    active:    'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300',
    trial:     'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300',
    suspended: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300',
    expired:   'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
  }
  return map[status] ?? 'bg-neutral-100 text-neutral-500'
}
function statusDot(status: string) {
  const map: Record<string, string> = {
    active: 'bg-green-500', trial: 'bg-amber-500',
    suspended: 'bg-red-500', expired: 'bg-neutral-400',
  }
  return map[status] ?? 'bg-neutral-400'
}

function daysLeft(dateStr: string) {
  const now = new Date()
  const exp = new Date(dateStr)
  return Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}
function daysLeftLabel(dateStr: string) {
  const d = daysLeft(dateStr)
  return d === 0 ? 'Expired' : `${d}d left`
}
function daysLeftClass(dateStr: string) {
  const d = daysLeft(dateStr)
  if (d === 0) return 'text-red-500'
  if (d <= 7)  return 'text-amber-500'
  return 'text-neutral-700 dark:text-neutral-300'
}
function fmtDate(v: any) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// A license is renewable once it has lapsed: no license on file, a past expiry,
// or an expired/suspended status.
function isExpired(tenant: any) {
  if (tenant.status === 'expired' || tenant.status === 'suspended') return true
  if (!tenant.license_expires_at) return true
  return new Date(tenant.license_expires_at) <= new Date()
}

function renewTenant(tenant: any) {
  if (!tenant.license_id) {
    toast.error('This tenant has no license to renew yet.')
    return
  }
  router.push(`/central/licenses/${tenant.license_id}/renew`)
}

async function loadTenants() {
  loading.value = true
  const res = await fetchTableData({
    data: { status: 'all' },
    props: { state: 'tenants_list_all', url: 'central/tenants/list', reload: false, time: 0 },
    Store,
    saveData: false,
  })
  allTenants.value = res?.payload?.data ?? res?.payload ?? []
  loading.value = false
}

function openDrawer(action: 'add' | 'edit' | 'view', tenant: any) {
  drawerAction.value = action
  drawerData.value   = tenant ?? {}
  formData.value     = {}
  showFooter.value   = false
  drawerOpen.value   = true
}

function onChangedStep(isLastStep: boolean) {
  showFooter.value = isLastStep
}

async function saveTenant() {
  formStore.setLoading(true)
  try {
    await create(formData.value)
    toast.success('Tenant created successfully.')
    formData.value = {}
    drawerOpen.value = false
    await loadTenants()
  } catch (err: any) {
    const errors = err?.response?.data?.errors
    if (errors) {
      Object.values(errors).forEach((messages: any) => toast.error(messages[0]))
    } else {
      toast.error(err?.response?.data?.message ?? 'Failed to create tenant.')
    }
  } finally {
    formStore.setLoading(false)
  }
}

function confirmDelete(tenant: any) {
  if (confirm(`Remove "${tenant.sacco_name}"? This cannot be undone.`)) {
    Erase(tenant)
    loadTenants()
  }
}

onMounted(() => loadTenants())
</script>
