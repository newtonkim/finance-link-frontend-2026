<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Plus, Eye, Pencil, Trash2, ChevronRight, LayoutGrid } from 'lucide-vue-next'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Spinner,
} from '@/Global'
import CreateGroupDrawer from '../components/CreateGroupDrawer.vue'
import { toast } from 'vue-sonner'

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

// Mock Data matching the image
const groups = ref<SavingsGroup[]>([
  {
    id: 1,
    name: 'Savers',
    primary_contact: '(UG) 78877788',
    location: 'Kyanja',
    status: 'Active',
    date_created: '3/9/2026',
  },
])

const filteredGroups = computed(() => {
  if (!search.value) return groups.value
  const q = search.value.toLowerCase()
  return groups.value.filter(g => 
    g.name.toLowerCase().includes(q) || 
    g.location.toLowerCase().includes(q) || 
    g.primary_contact.toLowerCase().includes(q)
  )
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
  toast.info(`Viewing details for ${group.name}`)
}

const openEdit = (group: SavingsGroup) => {
  toast.info(`Editing ${group.name}`)
}

const confirmDelete = (group: SavingsGroup) => {
  toast.error(`Delete functionality for ${group.name} coming soon.`)
}

function statusClass(s: string) {
  if (s.toLowerCase() === 'active') return 'bg-green-50 text-green-600 border-green-100'
  return 'bg-neutral-50 text-neutral-500 border-neutral-100'
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6 min-h-screen bg-[#f9fbfb] dark:bg-neutral-950">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-2 text-sm text-neutral-500 mb-2">
      <RouterLink to="/tenant/dashboard" class="hover:text-neutral-900 flex items-center gap-1.5 transition-colors">
        <LayoutGrid class="h-4 w-4" />
        Dashboard
      </RouterLink>
      <ChevronRight class="h-3.5 w-3.5" />
      <span class="text-neutral-900 font-medium">Group Savings</span>
    </nav>

    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold text-[#0A2318] dark:text-white">Group Savings</h1>
      <button
        class="inline-flex items-center gap-2 rounded-xl bg-[#0A2318] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A2318]/90 transition-all shadow-sm active:scale-95"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add New Group
      </button>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by name, location, or phone..."
          class="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-[#0A2318] focus:ring-1 focus:ring-[#0A2318] dark:border-neutral-800 dark:bg-neutral-900 dark:text-white shadow-sm"
        />
      </div>
    </div>

    <!-- Table Container -->
    <div class="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/30">
              <th class="px-8 py-5 text-left font-semibold text-neutral-400 uppercase tracking-wider text-[11px]">Group Name</th>
              <th class="px-6 py-5 text-left font-semibold text-neutral-400 uppercase tracking-wider text-[11px]">Primary Contact</th>
              <th class="px-6 py-5 text-left font-semibold text-neutral-400 uppercase tracking-wider text-[11px]">Location</th>
              <th class="px-6 py-5 text-left font-semibold text-neutral-400 uppercase tracking-wider text-[11px]">Status</th>
              <th class="px-6 py-5 text-left font-semibold text-neutral-400 uppercase tracking-wider text-[11px]">Date Created</th>
              <th class="px-8 py-5 text-right font-semibold text-neutral-400 uppercase tracking-wider text-[11px]">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            <!-- Loading -->
            <template v-if="loading">
              <tr v-for="i in 3" :key="i" class="animate-pulse">
                <td v-for="j in 6" :key="j" class="px-8 py-6">
                  <div class="h-4 rounded bg-neutral-100 dark:bg-neutral-800" :class="j === 1 ? 'w-40' : 'w-24'" />
                </td>
              </tr>
            </template>

            <!-- Empty -->
            <tr v-else-if="filteredGroups.length === 0">
              <td colspan="6" class="px-8 py-20 text-center text-sm text-neutral-400">
                No groups found.
              </td>
            </tr>

            <!-- Rows -->
            <tr
              v-else
              v-for="group in filteredGroups"
              :key="group.id"
              class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors"
            >
              <!-- Group Name -->
              <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                  <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-neutral-100 bg-neutral-50 p-1 flex items-center justify-center">
                    <img v-if="group.logo" :src="group.logo" class="h-full w-full object-contain" />
                    <div v-else class="text-[#0A2318] font-bold text-xs">
                      {{ group.name.substring(0, 2).toUpperCase() }}
                    </div>
                  </div>
                  <span class="font-bold text-[#0A2318] dark:text-white">{{ group.name }}</span>
                </div>
              </td>

              <!-- Primary Contact -->
              <td class="px-6 py-6 text-neutral-600 dark:text-neutral-400">
                {{ group.primary_contact }}
              </td>

              <!-- Location -->
              <td class="px-6 py-6 text-neutral-600 dark:text-neutral-400">
                {{ group.location }}
              </td>

              <!-- Status -->
              <td class="px-6 py-6">
                <span class="inline-flex rounded-full border px-3 py-1 text-[11px] font-bold capitalize" :class="statusClass(group.status)">
                  {{ group.status }}
                </span>
              </td>

              <!-- Date Created -->
              <td class="px-6 py-6 text-neutral-600 dark:text-neutral-400">
                {{ group.date_created }}
              </td>

              <!-- Actions -->
              <td class="px-8 py-6">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openView(group)"
                    class="inline-flex items-center gap-1.5 rounded-full bg-[#f0f4ff] px-4 py-1.5 text-xs font-bold text-[#4c6ef5] hover:bg-[#e7efff] transition-all"
                  >
                    <Eye class="h-3.5 w-3.5" />
                    View
                  </button>
                  <button
                    @click="openEdit(group)"
                    class="inline-flex items-center gap-1.5 rounded-full bg-[#f0f4ff] px-4 py-1.5 text-xs font-bold text-[#4c6ef5] hover:bg-[#e7efff] transition-all"
                  >
                    <Pencil class="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    @click="confirmDelete(group)"
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-50"
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
