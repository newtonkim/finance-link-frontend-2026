<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Pencil, Trash2, GitBranch, X } from 'lucide-vue-next'
import { Spinner, Label, InputError } from '@/Global'
import ToggleSwitch from '@/Global/ToggleSwitch.vue'
import ConfirmationDialog from '@/Global/confirmationDialog/confirmationDialog.vue'
import { branchesApi } from '@/tenant/apis/branches/branchesApi'
import type { Branch, BranchForm } from '@/tenant/apis/branches/branchesApi'
import { toast } from 'vue-sonner'

// ─── State ────────────────────────────────────────────────────────────────────
const branches   = ref<Branch[]>([])
const loading    = ref(false)
const toggling   = ref<Record<number, boolean>>({})
const showDrawer = ref(false)
const editing    = ref<Branch | null>(null)
const processing = ref(false)
const errors     = ref<Record<string, string[]>>({})

const showDeleteDialog = ref(false)
const deleteTarget     = ref<{ id: number; name: string }[]>([])
const deleting         = ref(false)

const FIELD = 'w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'

const form = reactive<BranchForm>({
  name: '', code: '', phone: '', email: '', address: '', manager_name: '', is_active: true,
})

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetch() {
  loading.value = true
  try {
    const res = await branchesApi.list()
    branches.value = res.data?.data ?? []
  } catch {
    toast.error('Failed to load branches.')
  } finally {
    loading.value = false
  }
}

onMounted(() => fetch())

// ─── Drawer ───────────────────────────────────────────────────────────────────
function openAdd() {
  editing.value = null
  Object.assign(form, { name: '', code: '', phone: '', email: '', address: '', manager_name: '', is_active: true })
  errors.value = {}
  showDrawer.value = true
}

function openEdit(branch: Branch) {
  editing.value = branch
  Object.assign(form, {
    name: branch.name, code: branch.code ?? '', phone: branch.phone ?? '',
    email: branch.email ?? '', address: branch.address ?? '',
    manager_name: branch.manager_name ?? '', is_active: branch.is_active,
  })
  errors.value = {}
  showDrawer.value = true
}

function closeDrawer() { showDrawer.value = false }

async function submit() {
  processing.value = true
  errors.value = {}
  try {
    if (editing.value) {
      const res = await branchesApi.update(editing.value.id, form)
      const idx = branches.value.findIndex(b => b.id === editing.value!.id)
      if (idx !== -1) branches.value[idx] = res.data.data
      toast.success('Branch updated.')
    } else {
      const res = await branchesApi.store(form)
      branches.value.unshift(res.data.data)
      toast.success('Branch created.')
    }
    closeDrawer()
  } catch (err: any) {
    if (err?.response?.status === 422) {
      errors.value = err.response.data?.errors ?? {}
    } else {
      toast.error(err?.response?.data?.message ?? 'Failed to save branch.')
    }
  } finally {
    processing.value = false
  }
}

// ─── Toggle active ────────────────────────────────────────────────────────────
async function toggleActive(branch: Branch) {
  toggling.value[branch.id] = true
  try {
    const res = await branchesApi.toggleActive(branch.id)
    branch.is_active = res.data.is_active
  } catch {
    toast.error('Failed to update branch status.')
  } finally {
    delete toggling.value[branch.id]
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
function confirmDelete(branch: Branch) {
  deleteTarget.value = [{ id: branch.id, name: branch.name }]
  showDeleteDialog.value = true
}

async function doDelete() {
  const id = deleteTarget.value[0]?.id
  if (!id) return
  deleting.value = true
  try {
    await branchesApi.destroy(id)
    branches.value = branches.value.filter(b => b.id !== id)
    toast.success('Branch deleted.')
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to delete branch.')
  } finally {
    deleting.value = false
    showDeleteDialog.value = false
  }
}
</script>

<template>
  <!-- ─── Card shell ──────────────────────────────────────────────────────── -->
  <div class="rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
      <div>
        <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Branch Management</h3>
        <p class="text-xs text-neutral-500 mt-0.5">Manage branches and physical locations for this Sacco.</p>
      </div>
      <button
        @click="openAdd"
        class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
        style="background-color: var(--color-nfuko-primary);"
      >
        <Plus class="h-4 w-4" />
        Add Branch
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="divide-y divide-neutral-100 dark:divide-neutral-800">
      <div v-for="i in 3" :key="i" class="flex items-center gap-4 px-6 py-4 animate-pulse">
        <div class="h-4 w-40 rounded bg-neutral-100 dark:bg-neutral-800" />
        <div class="h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-800 ml-auto" />
        <div class="h-6 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="branches.length === 0" class="flex flex-col items-center gap-2 py-12 text-center">
      <GitBranch class="h-8 w-8 text-neutral-300" />
      <p class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No branches yet</p>
      <p class="text-xs text-neutral-400">Click "Add Branch" to create your first branch.</p>
    </div>

    <!-- List -->
    <div v-else class="divide-y divide-neutral-50 dark:divide-neutral-800">
      <div
        v-for="branch in branches"
        :key="branch.id"
        class="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
      >
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-neutral-900 dark:text-white truncate">{{ branch.name }}</span>
            <span v-if="branch.code" class="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-500 dark:bg-neutral-800">{{ branch.code }}</span>
          </div>
          <div class="mt-0.5 flex flex-wrap gap-x-3 text-xs text-neutral-400">
            <span v-if="branch.manager_name">{{ branch.manager_name }}</span>
            <span v-if="branch.phone">{{ branch.phone }}</span>
            <span v-if="branch.email">{{ branch.email }}</span>
          </div>
        </div>

        <!-- Toggle active -->
        <ToggleSwitch
          :value="branch.is_active"
          :disabled="!!toggling[branch.id]"
          @toggle="toggleActive(branch)"
        />

        <!-- Actions -->
        <div class="flex items-center gap-1">
          <button @click="openEdit(branch)" class="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 transition-colors">
            <Pencil class="h-4 w-4" />
          </button>
          <button @click="confirmDelete(branch)" class="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ─── Add / Edit Drawer ──────────────────────────────────────────────── -->
  <Transition name="drawer-fade">
    <div v-if="showDrawer" class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" @click.self="closeDrawer" />
  </Transition>
  <Transition name="drawer-slide">
    <aside
      v-if="showDrawer"
      class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-neutral-900"
    >
      <!-- Drawer Header -->
      <div class="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
        <h2 class="text-base font-semibold text-neutral-900 dark:text-white">
          {{ editing ? 'Edit Branch' : 'Add New Branch' }}
        </h2>
        <button @click="closeDrawer" class="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Drawer Body -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <!-- Name -->
        <div class="space-y-1">
          <Label>Branch Name <span class="text-red-500">*</span></Label>
          <input v-model="form.name" type="text" placeholder="e.g. Nax Sacco Branch" :class="FIELD" />
          <InputError :message="errors.name?.[0]" />
        </div>

        <!-- Code -->
        <div class="space-y-1">
          <Label>Branch Code</Label>
          <input v-model="form.code" type="text" placeholder="e.g. NAX-001" :class="FIELD" />
          <InputError :message="errors.code?.[0]" />
        </div>

        <!-- Manager -->
        <div class="space-y-1">
          <Label>Branch Manager</Label>
          <input v-model="form.manager_name" type="text" placeholder="Full name" :class="FIELD" />
          <InputError :message="errors.manager_name?.[0]" />
        </div>

        <!-- Phone -->
        <div class="space-y-1">
          <Label>Phone</Label>
          <input v-model="form.phone" type="tel" placeholder="+254 700 000 000" :class="FIELD" />
          <InputError :message="errors.phone?.[0]" />
        </div>

        <!-- Email -->
        <div class="space-y-1">
          <Label>Email</Label>
          <input v-model="form.email" type="email" placeholder="branch@sacco.co.ke" :class="FIELD" />
          <InputError :message="errors.email?.[0]" />
        </div>

        <!-- Address -->
        <div class="space-y-1">
          <Label>Address</Label>
          <textarea v-model="form.address" rows="2" placeholder="Physical location / address" :class="FIELD" />
          <InputError :message="errors.address?.[0]" />
        </div>

        <!-- Active toggle -->
        <div class="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <div>
            <p class="text-sm font-medium text-neutral-800 dark:text-white">Active</p>
            <p class="text-xs text-neutral-400">Inactive branches are hidden from operations.</p>
          </div>
          <ToggleSwitch :value="form.is_active" @toggle="form.is_active = !form.is_active" />
        </div>
      </div>

      <!-- Drawer Footer -->
      <div class="border-t border-neutral-100 px-6 py-4 dark:border-neutral-800 flex justify-end gap-3">
        <button @click="closeDrawer" class="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Cancel
        </button>
        <button
          @click="submit"
          :disabled="processing"
          class="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          style="background-color: var(--color-nfuko-primary);"
        >
          <Spinner v-if="processing" class="h-4 w-4" />
          {{ editing ? 'Save Changes' : 'Create Branch' }}
        </button>
      </div>
    </aside>
  </Transition>

  <!-- ─── Delete Confirmation ────────────────────────────────────────────── -->
  <ConfirmationDialog
    v-model:show="showDeleteDialog"
    :items="deleteTarget"
    title="Delete Branch"
    @confirm="doDelete"
  />
</template>

<style scoped>
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.2s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.25s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }
</style>
