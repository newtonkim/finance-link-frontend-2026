<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UserCog, Plus, Search, X, Check, Pencil, Vote, GitBranch, CheckSquare, Eye, Trash2 } from 'lucide-vue-next'
import { useStaffStore } from '@/stores/staffStore'
import type { Staff } from '@/tenant/apis/staff/api'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { branchesApi } from '@/tenant/apis/branches/branchesApi'
import type { Branch } from '@/tenant/apis/branches/branchesApi'
import { toast } from 'vue-sonner'

const router = useRouter()
const staffStore = useStaffStore()

const search = ref('')
const branches = ref<Branch[]>([])
const roles = ref<{ id: number; name: string }[]>([])

// ─── Delete confirm ────────────────────────────────────────────────────────────
const deleteTarget = ref<Staff | null>(null)
const deleting = ref(false)

// ─── Drawer state ─────────────────────────────────────────────────────────────
const drawerOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const currentId = ref<number | null>(null)

const defaultForm = () => ({
  name: '',
  email: '',
  role: 'Staff',
  password: '',
  status: 'active' as 'active' | 'inactive',
  is_tenant_admin: false,
  branch_id: null as number | null,
  can_vote_on_loans: false,
  can_manage_branch: false,
  can_finalise_loan: false,
})

const form = ref(defaultForm())

onMounted(async () => {
  await staffStore.fetchStaffList()
  try {
    const [branchRes, roleRes] = await Promise.all([
      branchesApi.list(),
      tenantClient.post('/staff/roles-drop-down'),
    ])
    branches.value = (branchRes.data?.data ?? []).filter((b: Branch) => b.is_active)
    roles.value = roleRes.data?.payload?.data ?? roleRes.data?.payload ?? []
  } catch {}
})

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return (staffStore.staffList as Staff[])
    .filter((s) => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
})

function openCreate() {
  isEditing.value = false
  currentId.value = null
  form.value = defaultForm()
  drawerOpen.value = true
}

function openEdit(staff: Staff) {
  isEditing.value = true
  currentId.value = staff.id!
  form.value = {
    name: staff.name,
    email: staff.email,
    role: staff.role,
    password: '',
    status: staff.status,
    is_tenant_admin: staff.is_tenant_admin ?? false,
    branch_id: staff.branch_id ?? null,
    can_vote_on_loans: staff.can_vote_on_loans ?? false,
    can_manage_branch: staff.can_manage_branch ?? false,
    can_finalise_loan: staff.can_finalise_loan ?? false,
  }
  drawerOpen.value = true
}

async function save() {
  if (!form.value.name || !form.value.email) {
    toast.error('Name and email are required.')
    return
  }
  if (!isEditing.value && !form.value.password) {
    toast.error('Password is required for new staff.')
    return
  }
  saving.value = true
  try {
    if (isEditing.value && currentId.value) {
      const payload: Partial<Staff> = { ...form.value }
      if (!payload.password) delete payload.password
      await staffStore.updateStaff(currentId.value, payload)
    } else {
      await staffStore.createStaff(form.value as Staff)
    }
    drawerOpen.value = false
    await staffStore.fetchStaffList()
  } catch {
    // error shown by store
  } finally {
    saving.value = false
  }
}

function viewStaff(staff: Staff) {
  router.push({ name: 'tenant-settings-staff-profile', params: { id: staff.id } })
}

async function confirmDelete() {
  if (!deleteTarget.value?.id) return
  deleting.value = true
  try {
    await staffStore.deleteStaff(deleteTarget.value.id)
    deleteTarget.value = null
  } catch {
    // error shown by store
  } finally {
    deleting.value = false
  }
}

function branchName(id: number | null | undefined) {
  if (!id) return '—'
  return branches.value.find((b) => b.id === id)?.name ?? '—'
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const loanPermissions = [
  { field: 'can_vote_on_loans' as const, icon: Vote, label: 'Vote on loan applications', description: 'Can cast approve/decline votes in committee rounds.', color: 'violet' },
  { field: 'can_manage_branch' as const, icon: GitBranch, label: 'Manage branch (Branch Manager)', description: 'Can recommend applications and return for correction.', color: 'indigo' },
  { field: 'can_finalise_loan' as const, icon: CheckSquare, label: 'Finalise loan terms', description: 'Can confirm and lock repayment schedules before disbursement.', color: 'emerald' },
]
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 md:p-6 dark:bg-[#0a0a0a]">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
          <UserCog class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Staff list</h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage SACCO staff accounts and permissions.</p>
        </div>
      </div>
      <button
        class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Staff
      </button>
    </div>

    <!-- Search -->
    <div class="relative max-w-sm">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        v-model="search"
        type="text"
        placeholder="Search by name or email…"
        class="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-nfuko-primary/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
      />
    </div>

    <!-- Loading -->
    <div v-if="staffStore.isLoading && !staffStore.staffList.length" class="flex items-center justify-center py-20 text-sm text-neutral-400">
      Loading…
    </div>

    <!-- Table -->
    <div v-else class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <table class="w-full text-sm">
        <thead class="border-b border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
          <tr class="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3 hidden sm:table-cell">Email</th>
            <th class="px-4 py-3 hidden md:table-cell">Role</th>
            <th class="px-4 py-3 hidden lg:table-cell">Branch</th>
            <th class="px-4 py-3">Permissions</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3 hidden xl:table-cell">Joined</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
          <tr v-if="!filtered.length">
            <td colspan="8" class="px-4 py-10 text-center text-sm text-neutral-400">No staff found.</td>
          </tr>
          <tr
            v-for="staff in filtered"
            :key="staff.id"
            class="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
          >
            <!-- Name -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nfuko-primary/10 text-sm font-bold text-nfuko-primary dark:bg-bg-nfuko-yellow/10 dark:text-bg-nfuko-yellow">
                  {{ staff.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="font-medium text-neutral-900 dark:text-white">{{ staff.name }}</p>
                  <p v-if="staff.is_tenant_admin" class="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Admin</p>
                </div>
              </div>
            </td>
            <!-- Email -->
            <td class="hidden sm:table-cell px-4 py-3 text-neutral-600 dark:text-neutral-400">{{ staff.email }}</td>
            <!-- Role -->
            <td class="hidden md:table-cell px-4 py-3 text-neutral-600 dark:text-neutral-400 capitalize">{{ staff.role }}</td>
            <!-- Branch -->
            <td class="hidden lg:table-cell px-4 py-3 text-neutral-500 dark:text-neutral-400">{{ branchName(staff.branch_id) }}</td>
            <!-- Permissions badges -->
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-if="staff.can_vote_on_loans"
                  class="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                >
                  <Vote class="h-2.5 w-2.5" /> Vote
                </span>
                <span
                  v-if="staff.can_manage_branch"
                  class="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                  <GitBranch class="h-2.5 w-2.5" /> BM
                </span>
                <span
                  v-if="staff.can_finalise_loan"
                  class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                >
                  <CheckSquare class="h-2.5 w-2.5" /> Finalise
                </span>
                <span v-if="!staff.can_vote_on_loans && !staff.can_manage_branch && !staff.can_finalise_loan"
                  class="text-xs text-neutral-400">—</span>
              </div>
            </td>
            <!-- Status -->
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                :class="staff.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'"
              >
                {{ staff.status }}
              </span>
            </td>
            <!-- Joined -->
            <td class="hidden xl:table-cell px-4 py-3 text-neutral-500 dark:text-neutral-400">{{ formatDate(staff.created_at) }}</td>
            <!-- Actions -->
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button
                  class="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-100 transition-colors dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-violet-900/40"
                  title="View profile"
                  @click="viewStaff(staff)"
                >
                  <Eye class="h-3.5 w-3.5" />
                  View
                </button>
                <button
                  class="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                  title="Edit staff"
                  @click="openEdit(staff)"
                >
                  <Pencil class="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  class="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                  title="Delete staff"
                  @click="deleteTarget = staff"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ─── Drawer overlay ─────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="drawerOpen" class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 dark:bg-black/60" @click="drawerOpen = false" />

      <!-- Panel -->
      <div class="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-neutral-900">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div>
            <h2 class="text-base font-semibold text-neutral-900 dark:text-white">
              {{ isEditing ? 'Edit Staff Member' : 'Add Staff Member' }}
            </h2>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ isEditing ? 'Update details and permissions.' : 'Create a new staff account.' }}</p>
          </div>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            @click="drawerOpen = false"
          >
            <X class="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <!-- Name -->
          <div>
            <label class="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Name <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" placeholder="John Doe"
              class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
          </div>

          <!-- Email -->
          <div>
            <label class="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Email <span class="text-red-500">*</span></label>
            <input v-model="form.email" type="email" placeholder="john@sacco.com"
              class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
          </div>

          <!-- Password -->
          <div>
            <label class="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Password
              <span v-if="isEditing" class="font-normal text-neutral-400">(leave blank to keep current)</span>
              <span v-else class="text-red-500"> *</span>
            </label>
            <input v-model="form.password" type="password" placeholder="••••••••"
              class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
          </div>

          <!-- Role + Status in 2 cols -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Role</label>
              <select v-model="form.role"
                class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                <option value="" disabled>— Select role —</option>
                <option v-for="r in roles" :key="r.id" :value="r.name">{{ r.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Status</label>
              <select v-model="form.status"
                class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <!-- Branch -->
          <div>
            <label class="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Branch</label>
            <select v-model="form.branch_id"
              class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
              <option :value="null">— No Branch —</option>
              <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>

          <!-- System Admin toggle -->
          <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/30">
            <input type="checkbox" v-model="form.is_tenant_admin" class="mt-0.5 h-4 w-4 rounded accent-nfuko-primary cursor-pointer" />
            <div>
              <p class="text-sm font-semibold text-neutral-900 dark:text-white">System Administrator</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">Grants full override permissions within this workspace.</p>
            </div>
          </label>

          <!-- Loan Workflow Permissions -->
          <div>
            <p class="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Loan Workflow Permissions</p>
            <div class="space-y-2">
              <div
                v-for="perm in loanPermissions"
                :key="perm.field"
                class="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/30"
              >
                <div class="flex items-center gap-3">
                  <component
                    :is="perm.icon"
                    class="h-4 w-4 shrink-0"
                    :class="{
                      'text-violet-500': perm.color === 'violet',
                      'text-indigo-500': perm.color === 'indigo',
                      'text-emerald-500': perm.color === 'emerald',
                    }"
                  />
                  <div>
                    <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ perm.label }}</p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ perm.description }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                  :class="form[perm.field]
                    ? { violet: 'bg-violet-600 text-white', indigo: 'bg-indigo-600 text-white', emerald: 'bg-emerald-600 text-white' }[perm.color]
                    : 'border border-neutral-200 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400'"
                  @click="form[perm.field] = !form[perm.field]"
                >
                  <Check v-if="form[perm.field]" class="h-3 w-3" />
                  {{ form[perm.field] ? 'Enabled' : 'Disabled' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 border-t border-neutral-100 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <button
            class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            @click="drawerOpen = false"
          >
            Cancel
          </button>
          <button
            :disabled="saving"
            class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            @click="save"
          >
            <span v-if="saving" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {{ saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Staff' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
  <!-- ─── Delete confirmation modal ──────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="deleteTarget" class="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/50" @click="deleteTarget = null" />
      <div class="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <Trash2 class="h-5 w-5 text-red-500" />
        </div>
        <h3 class="mb-1 text-base font-semibold text-neutral-900 dark:text-white">Remove staff member?</h3>
        <p class="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          <span class="font-medium text-neutral-700 dark:text-neutral-200">{{ deleteTarget.name }}</span> will be permanently removed and lose access to this workspace.
        </p>
        <div class="flex items-center justify-end gap-3">
          <button
            class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            @click="deleteTarget = null"
          >Cancel</button>
          <button
            :disabled="deleting"
            class="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            @click="confirmDelete"
          >
            <span v-if="deleting" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {{ deleting ? 'Removing…' : 'Remove' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
