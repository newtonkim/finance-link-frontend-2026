<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Users, CreditCard, PieChart, Shield, Info, ChevronRight, Plus, Trash2, Loader2, UserPlus } from 'lucide-vue-next'
import { groupsApi } from '@/tenant/apis/savings'
import { formatMoneyValue } from '@/Global'
import { useCurrencyStore } from '@/stores/currency'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const currencyStore = useCurrencyStore()

const groupId = Number(route.params.id)
const group = ref<any>(null)
const members = ref<any[]>([])
const loading = ref(true)
const activeTab = ref('info')

function toRelative(url: string): string {
  try { return new URL(url).pathname } catch { return url }
}

const imageUrl = computed(() => group.value?.image_url ? toRelative(group.value.image_url) : null)

const totalSavings = computed(() =>
  members.value.reduce((sum: number, m: any) => sum + (m.pivot?.balance ?? 0), 0)
)

const tabs = [
  { key: 'info', label: 'Group Info', icon: Info },
  { key: 'accounts', label: 'Accounts', icon: CreditCard },
  { key: 'loans', label: 'Loans', icon: PieChart },
  { key: 'transactions', label: 'Transactions', icon: CreditCard },
  { key: 'settings', label: 'Settings', icon: Shield },
]

async function fetchGroup() {
  loading.value = true
  try {
    const res = await groupsApi.getMembers(groupId)
    const data = res.data
    // getMembers returns { data: savingsGroup (with members relation), all_members: [...] }
    group.value = data.data
    members.value = Array.isArray(group.value?.members) ? group.value.members : []
  } catch {
    toast.error('Failed to load group details.')
  } finally {
    loading.value = false
  }
}

async function deleteGroup() {
  if (!confirm(`Delete "${group.value?.name}"? This cannot be undone.`)) return
  try {
    await groupsApi.destroy(groupId)
    toast.success('Group deleted.')
    router.push({ name: 'tenant-savings-groups' })
  } catch {
    toast.error('Failed to delete group.')
  }
}

onMounted(fetchGroup)
</script>

<template>
  <div class="min-h-screen bg-[#f4f6f4] dark:bg-neutral-950">

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <Loader2 class="h-8 w-8 animate-spin text-nfuko-primary" />
    </div>

    <template v-else-if="group">
      <!-- ── Dark Header ── -->
      <div class="text-white px-8 py-6" style="background-color: var(--color-nfuko-primary-700);">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-xs text-white/50 mb-5">
          <span>Savings Groups</span>
          <ChevronRight class="h-3 w-3" />
          <span class="font-semibold" style="color: var(--color-nfuko-accent);">{{ group.name }}</span>
        </nav>

        <!-- Header Row -->
        <div class="flex items-start justify-between gap-6">
          <div class="flex items-center gap-5">
            <!-- Avatar -->
            <div class="h-20 w-20 shrink-0 rounded-2xl border-2 border-white/20 bg-white/10 overflow-hidden flex items-center justify-center text-white font-bold text-xl">
              <img v-if="imageUrl" :src="imageUrl" class="h-full w-full object-cover" alt="Group avatar" />
              <span v-else>{{ (group.name || 'SG').substring(0, 2).toUpperCase() }}</span>
            </div>
            <!-- Name & meta -->
            <div>
              <div class="flex items-center gap-3 mb-1">
                <h1 class="text-2xl font-bold tracking-tight">{{ group.name }}</h1>
                <span class="rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider border border-emerald-400 text-emerald-400">
                  {{ group.status }}
                </span>
              </div>
              <div class="flex items-center gap-4 text-sm text-white/60">
                <span class="flex items-center gap-1.5"><Users class="h-4 w-4" /> {{ members.length }} members</span>
                <span class="flex items-center gap-1.5"><span>&#x1F4C5;</span> Joined {{ group.date_created ? new Date(group.date_created).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-3 shrink-0">
            <button
              @click="router.push({ name: 'tenant-savings-group-members', params: { id: groupId } })"
              class="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              <Users class="h-4 w-4" />
              Group Members
              <span class="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{{ members.length }}</span>
            </button>
            <button class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-opacity hover:opacity-90" style="background-color: var(--color-nfuko-accent); color: var(--color-nfuko-primary);">
              <Plus class="h-4 w-4" />
              New Account
            </button>
            <button
              @click="deleteGroup"
              class="flex items-center gap-2 rounded-xl border border-rose-400/50 bg-rose-500/20 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/30 transition-colors"
            >
              <Trash2 class="h-4 w-4" />
              Delete Group
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-4 gap-4 mt-8">
          <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20">
                <Users class="h-4 w-4 text-emerald-400" />
              </div>
              <span class="text-xs font-semibold uppercase tracking-widest text-white/50">Total Members</span>
            </div>
            <p class="text-2xl font-bold">{{ members.length }}</p>
            <p class="text-xs text-white/40 mt-1">{{ members.length === 0 ? 'No members yet' : 'Active participants' }}</p>
          </div>

          <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20">
                <CreditCard class="h-4 w-4 text-amber-400" />
              </div>
              <span class="text-xs font-semibold uppercase tracking-widest text-white/50">Collective Savings</span>
            </div>
            <p class="text-2xl font-bold">{{ currencyStore.currencyCode }} {{ formatMoneyValue(totalSavings, 0) }}</p>
            <p class="text-xs text-white/40 mt-1">All member accounts</p>
          </div>

          <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20">
                <PieChart class="h-4 w-4 text-blue-400" />
              </div>
              <span class="text-xs font-semibold uppercase tracking-widest text-white/50">Group Shares</span>
            </div>
            <p class="text-2xl font-bold">0.0</p>
            <p class="text-xs text-white/40 mt-1">Current period</p>
          </div>

          <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20">
                <Shield class="h-4 w-4 text-purple-400" />
              </div>
              <span class="text-xs font-semibold uppercase tracking-widest text-white/50">Signatories</span>
            </div>
            <p class="text-2xl font-bold">0</p>
            <p class="text-xs text-white/40 mt-1">Awaiting setup</p>
          </div>
        </div>
      </div>

      <!-- ── Body ── -->
      <div class="flex gap-6 p-6">

        <!-- Left Sidebar -->
        <div class="w-56 shrink-0 flex flex-col gap-4">
          <!-- Quick Stats -->
          <div class="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4">
            <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-3">Quick Stats</p>
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"><PieChart class="h-4 w-4" /> Group Shares</span>
                <span class="font-semibold text-amber-500">0.0</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"><Users class="h-4 w-4" /> Members</span>
                <span class="font-semibold text-neutral-800 dark:text-white">{{ members.length }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"><CreditCard class="h-4 w-4" /> Accounts</span>
                <span class="font-semibold text-neutral-800 dark:text-white">0</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"><Shield class="h-4 w-4" /> Signatories</span>
                <span class="font-semibold text-neutral-800 dark:text-white">0</span>
              </div>
            </div>
          </div>

          <!-- Signatories -->
          <div class="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4">
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400">Signatories</p>
              <button class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 flex items-center gap-1 text-xs font-semibold hover:underline" style="color: var(--color-nfuko-primary);">
                <Plus class="h-3 w-3" /> Add
              </button>
            </div>
            <div class="flex flex-col items-center gap-2 py-4 text-center">
              <Shield class="h-8 w-8 text-neutral-200 dark:text-neutral-700" />
              <p class="text-xs text-neutral-400">No signatories registered yet</p>
              <button class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 text-xs font-semibold hover:underline flex items-center gap-1" style="color: var(--color-nfuko-primary);">
                <UserPlus class="h-3 w-3" /> Add first signatory
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 min-w-0">
          <!-- Tab Bar -->
          <div class="flex items-center gap-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-1.5 mb-5">
            <button
              v-for="tab in tabs" :key="tab.key"
              @click="activeTab = tab.key"
              :class="[
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors flex-1 justify-center',
                activeTab === tab.key
                  ? 'text-white shadow'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              ]"
              :style="activeTab === tab.key ? 'background-color: var(--color-nfuko-primary);' : ''"
            >
              <component :is="tab.icon" class="h-4 w-4" />
              {{ tab.label }}
            </button>
          </div>

          <!-- Group Info Tab -->
          <div v-if="activeTab === 'info'" class="space-y-5">
            <!-- Collective Savings Summary -->
            <div class="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5">
              <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                <CreditCard class="h-3.5 w-3.5" /> All Members Collective Savings
              </p>
              <div class="grid grid-cols-2 gap-4">
                <div class="rounded-xl bg-neutral-50 dark:bg-neutral-800 p-4">
                  <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">Number of Members</p>
                  <p class="text-3xl font-bold text-neutral-900 dark:text-white">{{ members.length }}</p>
                  <p class="text-xs text-neutral-400 mt-1">Active participants</p>
                </div>
                <div class="rounded-xl bg-neutral-50 dark:bg-neutral-800 p-4">
                  <p class="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">Total Savings (All Accounts)</p>
                  <p class="text-3xl font-bold text-neutral-900 dark:text-white">{{ formatMoneyValue(totalSavings, 0) }}</p>
                  <p class="text-xs text-neutral-400 mt-1">Uganda Shillings (UGX)</p>
                </div>
              </div>
            </div>

            <!-- Group Information -->
            <div class="rounded-2xl dark:bg-neutral-900 border dark:border-neutral-800 overflow-hidden" style="background-color: var(--color-nfuko-primary-50); border-color: var(--color-nfuko-primary-100);">
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b dark:border-neutral-800" style="border-color: var(--color-nfuko-primary-100);">
                <p class="text-xs font-semibold uppercase tracking-widest dark:text-neutral-400 flex items-center gap-2" style="color: var(--color-nfuko-primary-500);">
                  <Info class="h-3.5 w-3.5" /> Group Information
                </p>
                <button class="rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-[#052659]/90 transition-colors" style="border-color: var(--color-nfuko-primary-200);">
                  Edit Info
                </button>
              </div>

              <!-- Rows -->
              <div class="divide-y dark:divide-neutral-800" style="--tw-divide-opacity: 1;">
                <!-- Name -->
                <div class="flex items-center gap-6 px-6 py-4" style="border-color: var(--color-nfuko-primary-100);">
                  <span class="w-44 shrink-0 text-xs font-semibold uppercase tracking-widest dark:text-neutral-500" style="color: var(--color-nfuko-primary-500);">Name</span>
                  <span class="text-xl font-bold dark:text-white uppercase tracking-wide" style="color: var(--color-nfuko-primary);">{{ group.name }}</span>
                </div>

                <!-- Email -->
                <div class="flex items-center gap-6 px-6 py-4" style="border-color: var(--color-nfuko-primary-100);">
                  <span class="w-44 shrink-0 text-xs font-semibold uppercase tracking-widest dark:text-neutral-500" style="color: var(--color-nfuko-primary-500);">Email Address</span>
                  <span class="italic text-sm text-neutral-400 dark:text-neutral-500">Not provided</span>
                </div>

                <!-- Primary Contact -->
                <div class="flex items-center gap-6 px-6 py-4" style="border-color: var(--color-nfuko-primary-100);">
                  <span class="w-44 shrink-0 text-xs font-semibold uppercase tracking-widest dark:text-neutral-500" style="color: var(--color-nfuko-primary-500);">Primary Contact</span>
                  <span v-if="group.primary_contact_phone" class="italic text-sm text-neutral-700 dark:text-neutral-300">
                    <span v-if="group.primary_contact_country_code">({{ group.primary_contact_country_code }}) </span>{{ group.primary_contact_phone }}
                  </span>
                  <span v-else class="italic text-sm text-neutral-400 dark:text-neutral-500">Not provided</span>
                </div>

                <!-- Other Contact -->
                <div class="flex items-center gap-6 px-6 py-4" style="border-color: var(--color-nfuko-primary-100);">
                  <span class="w-44 shrink-0 text-xs font-semibold uppercase tracking-widest dark:text-neutral-500" style="color: var(--color-nfuko-primary-500);">Other Contact</span>
                  <span v-if="group.other_contact_phone" class="italic text-sm text-neutral-700 dark:text-neutral-300">
                    <span v-if="group.other_contact_country_code">({{ group.other_contact_country_code }}) </span>{{ group.other_contact_phone }}
                  </span>
                  <span v-else class="italic text-sm text-neutral-400 dark:text-neutral-500">Not provided</span>
                </div>

                <!-- Group Status — full width pill -->
                <div class="flex items-center gap-6 px-6 py-4" style="border-color: var(--color-nfuko-primary-100);">
                  <span class="w-44 shrink-0 text-xs font-semibold uppercase tracking-widest dark:text-neutral-500" style="color: var(--color-nfuko-primary-500);">Group Status</span>
                  <span class="flex-1 rounded-full px-4 py-1.5 text-sm font-semibold capitalize bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {{ group.status }}
                  </span>
                </div>

                <!-- Total Members -->
                <div class="flex items-center gap-6 px-6 py-4" style="border-color: var(--color-nfuko-primary-100);">
                  <span class="w-44 shrink-0 text-xs font-semibold uppercase tracking-widest dark:text-neutral-500" style="color: var(--color-nfuko-primary-500);">Total Members</span>
                  <span class="text-3xl font-bold dark:text-white" style="color: var(--color-nfuko-primary); font-family: serif;">{{ members.length }}</span>
                </div>

                <!-- Signatories -->
                <div class="flex items-center gap-6 px-6 py-4" style="border-color: var(--color-nfuko-primary-100);">
                  <span class="w-44 shrink-0 text-xs font-semibold uppercase tracking-widest dark:text-neutral-500" style="color: var(--color-nfuko-primary-500);">Signatories</span>
                  <span class="text-3xl font-bold dark:text-white" style="color: var(--color-nfuko-primary); font-family: serif;">0</span>
                </div>

                <!-- Location -->
                <div class="flex items-center gap-6 px-6 py-4" style="border-color: var(--color-nfuko-primary-100);">
                  <span class="w-44 shrink-0 text-xs font-semibold uppercase tracking-widest dark:text-neutral-500" style="color: var(--color-nfuko-primary-500);">Location</span>
                  <span v-if="group.location" class="italic text-sm text-neutral-700 dark:text-neutral-300">{{ group.location }}</span>
                  <span v-else class="italic text-sm text-neutral-400 dark:text-neutral-500">Not provided</span>
                </div>

                <!-- Group Description -->
                <div class="flex items-center gap-6 px-6 py-4" style="border-color: var(--color-nfuko-primary-100);">
                  <span class="w-44 shrink-0 text-xs font-semibold uppercase tracking-widest dark:text-neutral-500" style="color: var(--color-nfuko-primary-500);">Description</span>
                  <span v-if="group.description" class="italic text-sm text-neutral-600 dark:text-neutral-400">{{ group.description }}</span>
                  <span v-else class="italic text-sm text-neutral-400 dark:text-neutral-500">Not provided</span>
                </div>

                <!-- Date Created -->
                <div class="flex items-center gap-6 px-6 py-4" style="border-color: var(--color-nfuko-primary-100);">
                  <span class="w-44 shrink-0 text-xs font-semibold uppercase tracking-widest dark:text-neutral-500" style="color: var(--color-nfuko-primary-500);">Date Created</span>
                  <span class="text-2xl font-bold dark:text-white" style="color: var(--color-nfuko-primary); font-family: serif;">
                    {{ group.date_created ? new Date(group.date_created).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Other Tabs placeholder -->
          <div v-else class="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-10 text-center text-neutral-400">
            <p class="text-sm">{{ tabs.find(t => t.key === activeTab)?.label }} — coming soon</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <div v-else class="flex items-center justify-center h-64 text-neutral-400">
      Group not found.
    </div>
  </div>
</template>
