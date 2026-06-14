<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">

    <!-- Page header -->
    <div class="px-6 pt-6 pb-5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black tracking-tight">Platform Users</h1>
        <p class="mt-1 text-sm text-neutral-500">Manage admin staff and their access roles on the platform.</p>
      </div>
      <button
        @click="openDrawer('add', null)"
        class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors shrink-0"
      >
        <UserPlus class="size-4" />
        New User
      </button>
    </div>

    <div class="px-6 py-6 space-y-5">

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
            v-for="f in filterOptions" :key="f.value"
            @click="statusFilter = f.value"
            :class="[
              'px-4 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize',
              statusFilter === f.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            ]"
          >
            {{ f.label }}
            <span v-if="f.count !== null" :class="['ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black', statusFilter === f.value ? 'bg-white/20 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500']">
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
            placeholder="Search by name or email..."
            class="pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-700 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 w-72 transition-all"
          />
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="flex flex-col items-center gap-3 text-neutral-400">
          <div class="size-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span class="text-sm">Loading users...</span>
        </div>
      </div>

      <!-- Table -->
      <div v-else class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        <!-- Empty state -->
        <div v-if="filteredStaff.length === 0" class="flex flex-col items-center justify-center py-20 gap-3">
          <div class="size-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Users class="size-7 text-neutral-400" />
          </div>
          <p class="text-sm font-bold text-neutral-500">No users found</p>
          <p class="text-xs text-neutral-400">Try a different filter or search term.</p>
        </div>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b border-neutral-100 dark:border-neutral-800">
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">User</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Email</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Role</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Status</th>
              <th class="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">Joined</th>
              <th class="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr
              v-for="user in filteredStaff"
              :key="user.id"
              class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group"
            >
              <!-- User (avatar + name) -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div :class="['size-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0', avatarColor(user.staff_fall_name)]">
                    {{ initials(user.staff_fall_name) }}
                  </div>
                  <div>
                    <p class="font-bold text-neutral-800 dark:text-neutral-100 leading-tight">{{ user.staff_fall_name ?? '—' }}</p>
                    <p class="text-[11px] text-neutral-400 font-medium">ID #{{ user.id }}</p>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 font-medium">
                  <Mail class="size-3.5 text-neutral-400 shrink-0" />
                  {{ user.staff_email ?? '—' }}
                </div>
              </td>

              <!-- Role -->
              <td class="px-5 py-3.5">
                <span class="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 capitalize">
                  <ShieldCheck class="size-3" />
                  {{ user.system_role ?? 'No role' }}
                </span>
              </td>

              <!-- Status -->
              <td class="px-5 py-3.5">
                <span :class="['inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize', statusClass(user.status)]">
                  <span :class="['size-1.5 rounded-full', statusDot(user.status)]" />
                  {{ user.status ?? 'unknown' }}
                </span>
              </td>

              <!-- Date -->
              <td class="px-5 py-3.5 text-sm text-neutral-500 font-medium">
                {{ fmtDate(user.created_at) }}
              </td>

              <!-- Actions -->
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button @click="openDrawer('view', user)"
                    class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors">
                    <Eye class="size-3.5" /> View
                  </button>
                  <button @click="openDrawer('edit', user)"
                    class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors">
                    <Pencil class="size-3.5" /> Edit
                  </button>
                  <button @click="confirmDelete(user)"
                    class="flex size-7 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100 transition-colors">
                    <Trash2 class="size-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Table footer / count -->
        <div v-if="filteredStaff.length > 0" class="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <p class="text-xs text-neutral-400 font-medium">
            Showing <span class="font-bold text-neutral-600 dark:text-neutral-300">{{ filteredStaff.length }}</span> of
            <span class="font-bold text-neutral-600 dark:text-neutral-300">{{ allStaff.length }}</span> users
          </p>
        </div>
      </div>
    </div>

    <!-- Drawer -->
    <Drawer
      :open="drawerOpen"
      :title="drawerTitle"
      width="w-full sm:max-w-[520px]"
      :showFooter="drawerAction !== 'view'"
      @update:open="drawerOpen = $event"
      @save="saveUser"
      @submit="saveUser"
    >
      <template #body>
        <StaffForm
          v-if="['add', 'edit'].includes(drawerAction)"
          :watcher="{ action: drawerAction, data: drawerData }"
          v-model:form="formData"
        />
        <StaffShow v-else-if="drawerAction === 'view'" :data="drawerData" />
      </template>
    </Drawer>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  UserPlus, Users, Search, Mail, ShieldCheck,
  Eye, Pencil, Trash2, UserCheck, UserX, Clock,
} from 'lucide-vue-next'
import { pomPinia } from 'septor-store'
import { fetchTableData } from '@/Global/landingLayout/util'
import { Drawer } from '@/Global'
import { staffsApi } from '../apis'
import StaffForm from './Create.vue'
import StaffShow from './Show.vue'

const Store = pomPinia() as any
const { create } = staffsApi()

const loading     = ref(true)
const allStaff    = ref<any[]>([])
const searchQuery = ref('')
const statusFilter = ref('all')
const drawerOpen   = ref(false)
const drawerAction = ref<'add' | 'edit' | 'view'>('add')
const drawerData   = ref<any>({})
const formData     = ref<Record<string, any>>({})

const filterOptions = computed(() => [
  { value: 'all',       label: 'All',       count: allStaff.value.length },
  { value: 'active',    label: 'Active',    count: allStaff.value.filter(u => u.status === 'active').length },
  { value: 'trial',     label: 'Trial',     count: allStaff.value.filter(u => u.status === 'trial').length },
  { value: 'suspended', label: 'Suspended', count: allStaff.value.filter(u => u.status === 'suspended').length },
])

const statsCards = computed(() => [
  {
    label: 'Total users',
    value: allStaff.value.length,
    sub: 'All platform users',
    icon: Users,
    iconBg: 'bg-blue-50 dark:bg-blue-950/40',
    iconColor: 'text-blue-600',
    accent: 'bg-blue-500',
  },
  {
    label: 'Active',
    value: allStaff.value.filter(u => u.status === 'active').length,
    sub: 'Currently active',
    icon: UserCheck,
    iconBg: 'bg-green-50 dark:bg-green-950/40',
    iconColor: 'text-green-600',
    accent: 'bg-green-500',
  },
  {
    label: 'Trial',
    value: allStaff.value.filter(u => u.status === 'trial').length,
    sub: 'On trial access',
    icon: Clock,
    iconBg: 'bg-amber-50 dark:bg-amber-950/40',
    iconColor: 'text-amber-600',
    accent: 'bg-amber-500',
  },
  {
    label: 'Suspended',
    value: allStaff.value.filter(u => u.status === 'suspended').length,
    sub: 'Access restricted',
    icon: UserX,
    iconBg: 'bg-red-50 dark:bg-red-950/40',
    iconColor: 'text-red-600',
    accent: 'bg-red-500',
  },
])

const filteredStaff = computed(() => {
  let list = statusFilter.value === 'all'
    ? allStaff.value
    : allStaff.value.filter(u => u.status === statusFilter.value)
  const q = searchQuery.value.toLowerCase()
  if (q) list = list.filter(u =>
    (u.staff_fall_name ?? '').toLowerCase().includes(q) ||
    (u.staff_email ?? '').toLowerCase().includes(q)
  )
  return list
})

const drawerTitle = computed(() => {
  const map: Record<string, string> = { add: 'New User', edit: 'Edit User', view: 'User Details' }
  return map[drawerAction.value] ?? 'User'
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
function fmtDate(v: any) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function loadStaff() {
  loading.value = true
  const res = await fetchTableData({
    data: { status: 'all' },
    props: { state: 'staff_list_all', url: 'central/staff/list', reload: false, time: 0 },
    Store,
    saveData: false,
  })
  allStaff.value = res?.payload?.data ?? res?.payload ?? []
  loading.value = false
}

function openDrawer(action: 'add' | 'edit' | 'view', user: any) {
  drawerAction.value = action
  drawerData.value = user ?? {}
  formData.value = {}
  drawerOpen.value = true
}

function saveUser() {
  create(formData.value)
  formData.value = {}
  drawerOpen.value = false
  loadStaff()
}

function confirmDelete(user: any) {
  if (confirm(`Remove "${user.staff_fall_name}"? This cannot be undone.`)) {
    // delete action — wire to Erase when ready
  }
}

onMounted(() => loadStaff())
</script>
