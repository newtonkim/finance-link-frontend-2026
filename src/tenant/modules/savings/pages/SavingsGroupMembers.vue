<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { groupsApi } from '@/tenant/apis/savings'
import { toast } from 'vue-sonner'
import {
  ArrowLeft, Download, Search, Filter, Trash2, Eye,
  UserPlus, Users, ChevronDown, Settings2, Loader2,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const groupId = Number(route.params.id)

const group      = ref<any>(null)
const members    = ref<any[]>([])
const allMembers = ref<any[]>([])
const loading    = ref(true)

const memberSearch     = ref('')
const tableSearch      = ref('')
const roleFilter       = ref('All Roles')
const addMode          = ref<'sacco' | 'external'>('sacco')
const selectedMemberId = ref<number | null>(null)
const newMemberRole    = ref('Member')
const addingMember     = ref(false)

const extName    = ref('')
const extPhone   = ref('')
const extCountry = ref('UG')
const extIdNum   = ref('')
const extRole    = ref('Member')

const selectedMember = computed(() =>
  allMembers.value.find(m => m.id === selectedMemberId.value) ?? null
)

const filteredMemberOptions = computed(() => {
  const q = memberSearch.value.toLowerCase()
  const existingIds = new Set(members.value.map((m: any) => m.id))
  return allMembers.value.filter(m =>
    !existingIds.has(m.id) &&
    (m.name?.toLowerCase().includes(q) || m.member_number?.toLowerCase().includes(q))
  )
})

const roles = computed(() => {
  const set = new Set(['All Roles', ...members.value.map((m: any) => m.pivot?.role ?? 'Member')])
  return [...set]
})

const filteredMembers = computed(() => {
  let list = members.value
  if (roleFilter.value !== 'All Roles') {
    list = list.filter((m: any) => (m.pivot?.role ?? 'Member') === roleFilter.value)
  }
  if (tableSearch.value) {
    const q = tableSearch.value.toLowerCase()
    list = list.filter((m: any) =>
      m.name?.toLowerCase().includes(q) ||
      m.member_number?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    )
  }
  return list
})

async function fetchData() {
  loading.value = true
  try {
    const res = await groupsApi.getMembers(groupId)
    const data = res.data
    group.value      = data.data
    members.value    = group.value?.members ?? []
    allMembers.value = data.all_members ?? []
  } catch {
    toast.error('Failed to load members.')
  } finally {
    loading.value = false
  }
}

async function addMember() {
  addingMember.value = true
  try {
    if (addMode.value === 'sacco') {
      if (!selectedMemberId.value) { toast.error('Please select a member.'); addingMember.value = false; return }
      await groupsApi.addMember(groupId, { mode: 'add_existing', member_id: selectedMemberId.value, role: newMemberRole.value })
    } else {
      if (!extName.value || !extPhone.value) { toast.error('Name and phone are required.'); addingMember.value = false; return }
      await groupsApi.addMember(groupId, { mode: 'create_new', name: extName.value, phone: extPhone.value, phone_country: extCountry.value, id_number: extIdNum.value, role: extRole.value })
      extName.value = ''; extPhone.value = ''; extIdNum.value = ''
    }
    selectedMemberId.value = null
    memberSearch.value = ''
    toast.success('Member added successfully.')
    await fetchData()
  } catch (e: any) {
    toast.error(e?.response?.data?.message ?? 'Failed to add member.')
  } finally {
    addingMember.value = false
  }
}

async function removeMember(memberId: number, memberName: string) {
  if (!confirm(`Remove "${memberName}" from this group?`)) return
  try {
    await groupsApi.removeMember(groupId, memberId)
    members.value = members.value.filter((m: any) => m.id !== memberId)
    toast.success('Member removed.')
  } catch {
    toast.error('Failed to remove member.')
  }
}

function exportMembers() {
  window.open(groupsApi.exportUrl(groupId), '_blank')
}

function initials(name: string) {
  return (name || 'M').split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
}

onMounted(fetchData)
</script>

<template>
  <!-- Full viewport, no horizontal overflow -->
  <div class="flex flex-col w-full overflow-x-hidden" style="min-height: 100vh; background-color: var(--color-nfuko-primary-50);">

    <!-- ── Top bar ── -->
    <div class="flex items-center justify-between px-6 py-3 shrink-0 text-white" style="background-color: var(--color-nfuko-primary-700);">
      <div class="flex items-center gap-3 min-w-0">
        <button
          @click="router.push({ name: 'tenant-savings-group-show', params: { id: groupId } })"
          class="shrink-0 flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition-colors"
        >
          <ArrowLeft class="h-3.5 w-3.5" /> Back
        </button>
        <nav class="flex items-center gap-1.5 text-xs text-white/60 truncate">
          <span class="truncate">{{ group?.name ?? '…' }}</span>
          <span class="text-white/30 shrink-0">&rsaquo;</span>
          <span class="shrink-0">Groups</span>
          <span class="text-white/30 shrink-0">&rsaquo;</span>
          <span class="shrink-0 font-semibold" style="color: var(--color-nfuko-accent);">Members</span>
        </nav>
      </div>
      <div class="flex items-center gap-2 shrink-0 ml-4">
        <div class="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
          TOTAL MEMBERS
          <span class="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold" style="color: var(--color-nfuko-primary);">{{ members.length }}</span>
        </div>
        <button
          @click="exportMembers"
          class="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition-colors"
        >
          <Download class="h-3.5 w-3.5" /> Export Members
        </button>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="flex flex-1 items-center justify-center py-20">
      <Loader2 class="h-7 w-7 animate-spin" style="color: var(--color-nfuko-primary);" />
    </div>

    <!-- ── Main layout: sidebar + content ── -->
    <div v-else class="flex flex-1 min-h-0 w-full overflow-hidden">

      <!-- Left sidebar — fixed width, internally scrollable -->
      <aside class="w-72 shrink-0 flex flex-col bg-white border-r border-neutral-200 overflow-y-auto dark:bg-neutral-900 dark:border-neutral-800">

        <!-- Sidebar header -->
        <div class="px-5 py-4 shrink-0" style="background-color: var(--color-nfuko-primary);">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <UserPlus class="h-4 w-4 text-white" />
            </div>
            <div>
              <p class="text-sm font-bold text-white">Add Member</p>
              <p class="text-xs text-white/60 leading-tight">Link an existing SACCO member or register an external participant</p>
            </div>
          </div>
        </div>

        <!-- Mode toggle -->
        <div class="flex shrink-0 gap-1.5 p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <button
            @click="addMode = 'sacco'"
            class="flex-1 py-2 text-xs font-semibold transition-all"
            :style="addMode === 'sacco'
              ? 'background-color: var(--color-nfuko-primary); color: white; border-radius: 10px;'
              : 'background: white; color: #374151; border: 1px solid #e5e7eb; border-radius: 10px;'"
          >SACCO Member</button>
          <button
            @click="addMode = 'external'"
            class="flex-1 py-2 text-xs font-semibold transition-all"
            :style="addMode === 'external'
              ? 'background-color: var(--color-nfuko-primary); color: white; border-radius: 10px;'
              : 'background: white; color: #374151; border: 1px solid #e5e7eb; border-radius: 10px;'"
          >External Person</button>
        </div>

        <!-- Form area -->
        <div class="flex-1 p-4 space-y-4 overflow-y-auto">

          <!-- SACCO Member fields -->
          <template v-if="addMode === 'sacco'">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-neutral-500">Select Member</label>
              <div class="relative">
                <select
                  v-model="selectedMemberId"
                  class="w-full appearance-none rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 pr-8 text-sm outline-none dark:text-white"
                >
                  <option :value="null">Please select a Member</option>
                  <option v-for="m in filteredMemberOptions" :key="m.id" :value="m.id">{{ m.name }} ({{ m.member_number }})</option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-neutral-500">Search Members</label>
              <div class="relative">
                <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <input v-model="memberSearch" type="text" placeholder="Search by name or ID..." class="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 py-2.5 pl-9 pr-3 text-sm outline-none dark:text-white placeholder:text-neutral-400" />
              </div>
            </div>

            <!-- Member preview -->
            <div class="rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center py-6 text-center">
              <template v-if="selectedMember">
                <div class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold mb-2 bg-neutral-100 text-neutral-700">
                  {{ initials(selectedMember.name) }}
                </div>
                <p class="text-sm font-semibold text-neutral-800 dark:text-white">{{ selectedMember.name }}</p>
                <p class="text-xs text-neutral-400">{{ selectedMember.member_number }}</p>
                <p class="text-xs text-neutral-400">{{ selectedMember.phone }}</p>
              </template>
              <template v-else>
                <Users class="h-7 w-7 text-neutral-300 dark:text-neutral-600 mb-2" />
                <p class="text-xs text-neutral-400">Select a member from the dropdown<br/>to add them to this group</p>
              </template>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-neutral-500">Role</label>
              <input v-model="newMemberRole" type="text" placeholder="e.g. Member, Treasurer..." class="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none dark:text-white placeholder:text-neutral-400" />
            </div>
          </template>

          <!-- External Person fields -->
          <template v-else>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-neutral-500">Full Name</label>
              <input v-model="extName" type="text" placeholder="Enter full name" class="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none dark:text-white placeholder:text-neutral-400" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-neutral-500">Phone</label>
              <input v-model="extPhone" type="text" placeholder="e.g. 788888888" class="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none dark:text-white placeholder:text-neutral-400" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-neutral-500">Country Code</label>
              <input v-model="extCountry" type="text" placeholder="UG" maxlength="5" class="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none dark:text-white placeholder:text-neutral-400" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-neutral-500">ID Number <span class="normal-case font-normal text-neutral-400">(optional)</span></label>
              <input v-model="extIdNum" type="text" placeholder="National ID or passport" class="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none dark:text-white placeholder:text-neutral-400" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-neutral-500">Role</label>
              <input v-model="extRole" type="text" placeholder="e.g. Member, Chairperson..." class="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none dark:text-white placeholder:text-neutral-400" />
            </div>
          </template>
        </div>

        <!-- Add button -->
        <div class="shrink-0 px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
          <button
            @click="addMember"
            :disabled="addingMember"
            class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 text-white"
            style="background-color: var(--color-nfuko-primary);"
          >
            <Loader2 v-if="addingMember" class="h-4 w-4 animate-spin" />
            <UserPlus v-else class="h-4 w-4" />
            Add to Group
          </button>
        </div>

        <!-- Bottom stats -->
        <div class="shrink-0 grid grid-cols-2 divide-x divide-neutral-100 border-t border-neutral-100 dark:border-neutral-800 dark:divide-neutral-800">
          <div class="px-4 py-3 bg-white dark:bg-neutral-900">
            <p class="text-xs font-semibold uppercase tracking-widest mb-0.5 text-neutral-400">Members</p>
            <p class="text-xl font-bold text-neutral-800 dark:text-white">{{ members.length }}</p>
            <p class="text-xs text-neutral-400">Total enrolled</p>
          </div>
          <div class="px-4 py-3 bg-white dark:bg-neutral-900">
            <p class="text-xs font-semibold uppercase tracking-widest mb-0.5 text-neutral-400">Roles</p>
            <p class="text-xl font-bold text-neutral-800 dark:text-white">{{ roles.length - 1 }}</p>
            <p class="text-xs text-neutral-400">Role types</p>
          </div>
        </div>
      </aside>

      <!-- Right content — fills remaining space, scrolls vertically only -->
      <main class="flex-1 min-w-0 flex flex-col overflow-y-auto p-5">

        <!-- Title row -->
        <div class="flex items-center justify-between mb-4 shrink-0">
          <div class="flex items-center gap-2.5">
            <h1 class="text-lg font-bold" style="color: var(--color-nfuko-primary);">Group Members</h1>
            <span class="rounded-full px-3 py-0.5 text-xs font-bold text-white" style="background-color: var(--color-nfuko-primary);">
              {{ members.length }} members
            </span>
          </div>
          <button class="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 transition-colors">
            <Settings2 class="h-3.5 w-3.5" /> Manage Roles
          </button>
        </div>

        <!-- Search + filter -->
        <div class="flex items-center gap-2 mb-4 shrink-0">
          <div class="relative flex-1 min-w-0">
            <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              v-model="tableSearch"
              type="text"
              placeholder="Search by name, contact or email..."
              class="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-2.5 pl-9 pr-3 text-sm outline-none dark:text-white placeholder:text-neutral-400"
            />
          </div>
          <div class="relative shrink-0">
            <select
              v-model="roleFilter"
              class="appearance-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-2.5 pl-3 pr-8 text-sm font-semibold text-neutral-700 dark:text-neutral-300 outline-none"
            >
              <option v-for="r in roles" :key="r">{{ r }}</option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          </div>
          <button class="shrink-0 flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 transition-colors">
            <Filter class="h-3.5 w-3.5" /> Filter
          </button>
        </div>

        <!-- Table card -->
        <div class="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-1">
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse min-w-[640px]">
              <thead>
                <tr style="background-color: var(--color-nfuko-primary);">
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">S/N</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Member</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Account No.</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Contact</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Email Address</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Role</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr v-if="filteredMembers.length === 0">
                  <td colspan="7" class="px-4 py-14 text-center">
                    <div class="flex flex-col items-center gap-2">
                      <Users class="h-7 w-7 text-neutral-300" />
                      <p class="text-sm font-semibold text-neutral-500">No members found</p>
                      <p class="text-xs text-neutral-400">Add a member using the panel on the left.</p>
                    </div>
                  </td>
                </tr>

                <tr
                  v-else
                  v-for="(member, idx) in filteredMembers"
                  :key="member.id"
                  class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <td class="px-4 py-3.5 text-sm text-neutral-400 font-medium">{{ idx + 1 }}.</td>

                  <td class="px-4 py-3.5">
                    <div class="flex items-center gap-2.5">
                      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-neutral-100 text-neutral-600">
                        {{ initials(member.name) }}
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-neutral-800 dark:text-white leading-tight">{{ member.name }}</p>
                        <p class="text-xs text-neutral-400">Since {{ member.pivot?.created_at ? new Date(member.pivot.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' }}</p>
                      </div>
                    </div>
                  </td>

                  <td class="px-4 py-3.5">
                    <span class="inline-flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      {{ member.member_number ?? '—' }}
                    </span>
                  </td>

                  <td class="px-4 py-3.5 text-sm text-neutral-600 dark:text-neutral-300">{{ member.phone ?? '—' }}</td>

                  <td class="px-4 py-3.5 text-sm text-neutral-500 dark:text-neutral-400">{{ member.email ?? '—' }}</td>

                  <td class="px-4 py-3.5">
                    <span class="rounded-md border border-neutral-200 dark:border-neutral-700 px-2.5 py-0.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                      {{ member.pivot?.role ?? 'Member' }}
                    </span>
                  </td>

                  <td class="px-4 py-3.5">
                    <div class="flex items-center justify-end gap-1.5">
                      <button class="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors">
                        <Eye class="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        @click="removeMember(member.id, member.name)"
                        class="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100 transition-colors dark:bg-rose-900/20 dark:border-rose-800"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="filteredMembers.length > 0" class="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
            <p class="text-xs text-neutral-400">Showing 1–{{ filteredMembers.length }} of {{ filteredMembers.length }} members</p>
            <div class="flex items-center gap-1">
              <button class="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-400 hover:bg-neutral-50 transition-colors">&lsaquo;</button>
              <button class="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white" style="background-color: var(--color-nfuko-primary);">1</button>
              <button class="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-400 hover:bg-neutral-50 transition-colors">&rsaquo;</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
