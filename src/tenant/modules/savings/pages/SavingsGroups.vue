<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Eye, Pencil, Trash2, ChevronRight, LayoutGrid, Filter, MoreHorizontal, MapPin } from 'lucide-vue-next'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Spinner,
} from '@/Global'
import CreateGroupDrawer from '../components/CreateGroup.vue'
import { toast } from 'vue-sonner'
import { groupsApi } from '@/tenant/apis/savings'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SavingsGroup {
  id: number
  name: string
  primary_contact: string
  location: string
  status: string
  date_created: string
  logo?: string
}

// ─── State ────────────────────────────────────────────────────────────────────
const search = ref('')
const loading = ref(false)
const showCreateDrawer = ref(false)
const groups = ref<SavingsGroup[]>([])

// ─── Fetching ─────────────────────────────────────────────────────────────────
async function fetchGroups() {
  loading.value = true
  try {
    const response = await groupsApi.list()
    const rawData = response.data?.data ?? response.data
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.data)
        ? rawData.data
        : []

    // Clean by default: Filter out invalid/duplicate entries immediately
    const seen = new Set<string | number>()
    groups.value = (list as SavingsGroup[]).filter(g => {
      if (!g || !g.name || g.name.toLowerCase().includes('unnamed')) return false
      
      const key = g.id && g.id > 0 ? g.id : `${g.name}|${g.primary_contact}|${g.location}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch (error) {
    console.error('Failed to fetch groups:', error)
    toast.error('Failed to load savings groups.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchGroups()
})

const filteredGroups = computed(() => {
  if (!search.value) return groups.value
  const q = search.value.toLowerCase()
  return groups.value.filter(g => {
    const name = g?.name?.toLowerCase() || ''
    const location = g?.location?.toLowerCase() || ''
    const contact = g?.primary_contact?.toLowerCase() || ''
    return name.includes(q) || location.includes(q) || contact.includes(q)
  })
})

// ─── Handlers ─────────────────────────────────────────────────────────────────
const openCreate = () => {
  showCreateDrawer.value = true
}

const handleSuccess = (newGroup: SavingsGroup) => {
  groups.value = [newGroup, ...groups.value]
  toast.success('Group created successfully!')
}

const openView = (group: SavingsGroup) => {
  toast.info(`Viewing details for ${group?.name || 'Group'}`)
}

const openEdit = (group: SavingsGroup) => {
  toast.info(`Editing ${group?.name || 'Group'}`)
}

const confirmDelete = async (group: SavingsGroup) => {
  if (!group?.id) return
  if (!confirm(`Are you sure you want to delete "${group.name || 'this group'}"?`)) return

  try {
    await groupsApi.destroy(group.id)
    groups.value = groups.value.filter(g => g.id !== group.id)
    toast.success('Group deleted successfully.')
  } catch (error) {
    console.error('Failed to delete group:', error)
    toast.error('Failed to delete group.')
  }
}

function statusClass(s: any) {
  if (!s || typeof s !== 'string') return 'bg-neutral-100 text-neutral-500'
  const val = s.toLowerCase()
  if (val === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (val === 'inactive') return 'bg-rose-50 text-rose-700 border-rose-100'
  return 'bg-neutral-50 text-neutral-500 border-neutral-100'
}
</script>

<template>
  <div class="flex flex-col gap-8 p-10 min-h-screen bg-[#f8fafc] dark:bg-neutral-950 font-sans">

    <!-- Top Level Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-2">
        <!-- Breadcrumbs -->
        <nav class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
          <RouterLink to="/tenant/dashboard" class="hover:text-[#0A2318] transition-colors">Dashboard</RouterLink>
          <ChevronRight class="h-3 w-3" />
          <span class="text-[#0A2318]">Group Savings -</span>
        </nav>
        <h1 class="text-4xl font-black text-[#0A2318] dark:text-white tracking-tight">Group Savings</h1>
        <p class="text-sm text-neutral-500 max-w-lg">Manage and monitor institutional savings groups, their membership tiers, and overall performance.</p>
      </div>

      <button
        class="inline-flex items-center gap-2.5 rounded-2xl bg-nfuko-primary px-8 py-4 text-sm font-bold text-white hover:bg-[#124b30] transition-all shadow-xl shadow-[#0A2318]/10 active:scale-95 group"
        @click="openCreate"
      >
        <Plus class="h-5 w-5 transition-transform group-hover:rotate-90" />
        Add New Group
      </button>
    </div>

    <!-- Stats Summary Tiles (Visual Polish) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div v-for="(val, label) in { 'Total Groups': groups.length, 'Active Portfolios': 0, 'Growth Rate': '0%' }" :key="label" class="bg-white dark:bg-neutral-900 p-6 rounded-[24px] border border-neutral-100 dark:border-neutral-800 shadow-sm">
        <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">{{ label }}</p>
        <p class="text-2xl font-black text-[#0A2318] dark:text-white">{{ val }}</p>
      </div>
    </div>

    <!-- List Controls -->
    <div class="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-[28px] border border-neutral-100 dark:border-neutral-800 shadow-sm">
      <div class="relative flex-1">
        <Search class="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search groups by name, location or contact protocol..."
          class="w-full rounded-2xl border-none bg-neutral-50 dark:bg-neutral-800 py-3.5 pl-12 pr-4 text-sm outline-none transition-all placeholder:text-neutral-400 focus:bg-neutral-100 focus:ring-2 focus:ring-[#0A2318]/5 dark:text-white"
        />
      </div>
      <button class="h-12 px-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 transition-all">
        <Filter class="h-4 w-4" />
        Filters
      </button>
    </div>

    <!-- Table Container -->
    <div class="overflow-hidden rounded-[32px] border border-neutral-100 bg-white shadow-xl shadow-neutral-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-neutral-50/50 dark:bg-neutral-800/50">
              <th class="px-8 py-6 text-left font-bold text-[#0A2318]/40 uppercase tracking-[0.15em] text-[10px]">Institutional Identity</th>
              <th class="px-6 py-6 text-left font-bold text-[#0A2318]/40 uppercase tracking-[0.15em] text-[10px]">Primary Contact</th>
              <th class="px-6 py-6 text-left font-bold text-[#0A2318]/40 uppercase tracking-[0.15em] text-[10px]">Location Node</th>
              <th class="px-6 py-6 text-left font-bold text-[#0A2318]/40 uppercase tracking-[0.15em] text-[10px]">Status</th>
              <th class="px-6 py-6 text-left font-bold text-[#0A2318]/40 uppercase tracking-[0.15em] text-[10px]">Launch Date</th>
              <th class="px-8 py-6 text-right font-bold text-[#0A2318]/40 uppercase tracking-[0.15em] text-[10px]">Management</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            <!-- Loading -->
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td v-for="j in 6" :key="j" class="px-8 py-7">
                  <div class="h-5 rounded-lg bg-neutral-100 dark:bg-neutral-800" :class="j === 1 ? 'w-48' : 'w-24'" />
                </td>
              </tr>
            </template>

            <!-- Empty -->
            <tr v-else-if="filteredGroups.length === 0">
              <td colspan="6" class="px-8 py-32 text-center">
                <div class="flex flex-col items-center gap-3">
                   <div class="h-16 w-16 rounded-3xl bg-neutral-50 flex items-center justify-center text-neutral-300">
                     <LayoutGrid class="h-8 w-8" />
                   </div>
                   <p class="text-sm font-bold text-neutral-800 dark:text-neutral-200">No Groups Encountered</p>
                   <p class="text-xs text-neutral-400">Expand your search reach or create a new group entry.</p>
                </div>
              </td>
            </tr>

            <!-- Rows -->
            <tr
              v-else
              v-for="group in filteredGroups"
              :key="group.id"
              class="group hover:bg-[#f8fafc] dark:hover:bg-neutral-800/40 transition-all cursor-default"
            >
              <!-- Group Name -->
              <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                  <div class="h-12 w-12 shrink-0 overflow-hidden rounded-[18px] border-2 border-white dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105">
                    <img v-if="group.logo" :src="group.logo" class="h-full w-full object-cover" />
                    <div v-else class="text-[#0A2318] dark:text-white font-black text-sm">
                      {{ (group.name || 'SG').substring(0, 2).toUpperCase() }}
                    </div>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-bold text-[#0A2318] dark:text-white text-base">{{ group.name || 'Unnamed Group' }}</span>
                    <span class="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">ID: #{{ (group.id || 0).toString().slice(-4) }}</span>
                  </div>
                </div>
              </td>

              <!-- Primary Contact -->
              <td class="px-6 py-6">
                <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-medium">
                  {{ group.primary_contact }}
                </div>
              </td>

              <!-- Location -->
              <td class="px-6 py-6">
                <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <MapPin class="h-3.5 w-3.5 text-neutral-300" />
                  {{ group.location }}
                </div>
              </td>

              <!-- Status -->
              <td class="px-6 py-6">
                <span class="inline-flex rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors" :class="statusClass(group.status)">
                  {{ group.status }}
                </span>
              </td>

              <!-- Date Created -->
              <td class="px-6 py-6 text-neutral-500 dark:text-neutral-400 font-medium italic">
                {{ group.date_created }}
              </td>

              <!-- Actions -->
              <td class="px-8 py-6">
                <div class="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button
                    @click="openView(group)"
                    class="h-10 px-5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-xs font-bold text-[#0A2318] dark:text-white hover:bg-neutral-50 transition-all shadow-sm"
                  >
                    Details
                  </button>
                  <button
                    @click="openEdit(group)"
                    class="h-10 w-10 flex items-center justify-center rounded-xl bg-neutral-50 text-neutral-600 hover:bg-neutral-100 transition-all"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    @click="confirmDelete(group)"
                    class="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

      <!-- Create Group Drawer -->
      <CreateGroupDrawer
        v-model:open="showCreateDrawer"
        @success="handleSuccess"
      />
  </div>
</template>

<style scoped>
/* Any custom styles if needed */
</style>
