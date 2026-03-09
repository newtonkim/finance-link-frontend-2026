<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, Pencil, Trash2, X } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogScrollContent,
  Button,
  Input,
  Label,
  InputError,
  Spinner,
} from '@/Global'
import PhoneInput from '@/Global/PhoneInput.vue'
import { membersApi } from '@/tenant/apis/members/membersApi'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Member {
  id: number
  member_number: string
  name: string
  phone: string
  phone_country: string | null
  email: string | null
  gender: string
  status: string
  joined_at: string | null
  member_type: string
  marital_status: string
  nationality: string
  address: string
  id_number: string | null
  dob: string | null
}

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const router = useRouter()

// ─── State ────────────────────────────────────────────────────────────────────
const members = ref<Member[]>([])
const meta = ref<PaginationMeta>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const loading = ref(false)
const searchQuery = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

// ─── Form state ───────────────────────────────────────────────────────────────
const showForm = ref(false)
const editingId = ref<number | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, string>>({})

const emptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  phone_country: 'KE',
  gender: 'male' as string,
  member_type: 'individual',
  marital_status: 'single' as string,
  nationality: '',
  address: '',
  id_number: '',
  dob: '',
  joined_at: '',
})

const form = ref(emptyForm())

// ─── Delete state ─────────────────────────────────────────────────────────────
const showDeleteDialog = ref(false)
const deleteTarget = ref<Member | null>(null)
const deleteLoading = ref(false)

// ─── Derived ──────────────────────────────────────────────────────────────────
const formTitle = computed(() => (editingId.value ? 'Edit Member' : 'Add New Member'))
const pages = computed(() =>
  Array.from({ length: meta.value.last_page }, (_, i) => i + 1),
)

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchMembers(page = 1) {
  loading.value = true
  try {
    const res = await membersApi.list({ search: searchQuery.value || undefined, page })
    const payload = res.data
    members.value = payload.data ?? []
    if (payload.meta) {
      meta.value = payload.meta
    }
  } finally {
    loading.value = false
  }
}

watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchMembers(1), 400)
})

onMounted(() => fetchMembers(1))

// ─── Open form ────────────────────────────────────────────────────────────────
function openCreate() {
  router.push('/tenant/members/create')
}

function openEdit(member: Member) {
  editingId.value = member.id
  form.value = {
    name: member.name,
    email: member.email ?? '',
    phone: member.phone,
    phone_country: member.phone_country ?? 'KE',
    gender: member.gender,
    member_type: member.member_type,
    marital_status: member.marital_status,
    nationality: member.nationality,
    address: member.address,
    id_number: member.id_number ?? '',
    dob: member.dob ?? '',
    joined_at: member.joined_at ?? '',
  }
  formErrors.value = {}
  showForm.value = true
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submitForm() {
  formLoading.value = true
  formErrors.value = {}
  try {
    const payload = { ...form.value }
    if (editingId.value) {
      await membersApi.update(editingId.value, payload)
    } else {
      await membersApi.store(payload)
    }
    showForm.value = false
    await fetchMembers(meta.value.current_page)
  } catch (err: any) {
    const data = err?.response?.data
    if (data?.errors) {
      Object.entries(data.errors as Record<string, string[]>).forEach(([k, v]) => {
        formErrors.value[k] = v[0]
      })
    } else {
      formErrors.value.form = data?.message ?? 'Something went wrong.'
    }
  } finally {
    formLoading.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
function confirmDelete(member: Member) {
  deleteTarget.value = member
  showDeleteDialog.value = true
}

async function deleteMember() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await membersApi.destroy(deleteTarget.value.id)
    showDeleteDialog.value = false
    await fetchMembers(meta.value.current_page)
  } finally {
    deleteLoading.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusClass(status: string) {
  return status === 'active'
    ? 'bg-green-100 text-green-700'
    : 'bg-neutral-100 text-neutral-500'
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Members</h1>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 rounded-full bg-[#001d22] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#001d22]/90 transition-colors"
      >
        <Plus class="h-4 w-4" />
        Add New Member
      </button>
    </div>

    <!-- Search -->
    <div class="relative max-w-lg">
      <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name, member number, phone, or email..."
        class="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#001d22] focus:ring-1 focus:ring-[#001d22] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
      />
    </div>

    <!-- Table card -->
    <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-neutral-100 dark:border-neutral-800">
              <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Member #</th>
              <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Full Name</th>
              <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Phone</th>
              <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Email</th>
              <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Gender</th>
              <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Status</th>
              <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Joined</th>
              <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            <!-- Loading skeleton -->
            <template v-if="loading">
              <tr v-for="i in 6" :key="i" class="animate-pulse">
                <td v-for="j in 8" :key="j" class="px-6 py-4">
                  <div class="h-4 rounded bg-neutral-100 dark:bg-neutral-800" :class="j === 2 ? 'w-32' : 'w-20'" />
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else-if="members.length === 0">
              <td colspan="8" class="px-6 py-16 text-center text-sm text-neutral-400">
                No members found.
              </td>
            </tr>

            <!-- Rows -->
            <tr
              v-else
              v-for="member in members"
              :key="member.id"
              class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <td class="px-6 py-4 font-mono text-xs text-neutral-500">{{ member.member_number }}</td>
              <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">{{ member.name }}</td>
              <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ member.phone }}</td>
              <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ member.email ?? '—' }}</td>
              <td class="px-6 py-4 capitalize text-neutral-600 dark:text-neutral-400">{{ member.gender }}</td>
              <td class="px-6 py-4">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize" :class="statusClass(member.status)">
                  {{ member.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-neutral-500 dark:text-neutral-400">{{ formatDate(member.joined_at) }}</td>
              <td class="px-6 py-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <button
                    @click="openEdit(member)"
                    class="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 transition-colors"
                    title="Edit"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    @click="confirmDelete(member)"
                    class="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="meta.last_page > 1"
        class="flex items-center justify-between border-t border-neutral-100 px-6 py-3 dark:border-neutral-800"
      >
        <p class="text-xs text-neutral-400">
          Showing page {{ meta.current_page }} of {{ meta.last_page }} ({{ meta.total }} members)
        </p>
        <div class="flex gap-1">
          <button
            v-for="page in pages"
            :key="page"
            @click="fetchMembers(page)"
            class="h-8 w-8 rounded-lg text-xs font-medium transition-colors"
            :class="page === meta.current_page
              ? 'bg-[#001d22] text-white'
              : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Add / Edit Dialog ─────────────────────────────────────────────────── -->
  <Dialog v-model:open="showForm">
    <DialogScrollContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ formTitle }}</DialogTitle>
      </DialogHeader>

      <form @submit.prevent="submitForm" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- Form error -->
        <div v-if="formErrors.form" class="col-span-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
          {{ formErrors.form }}
        </div>

        <!-- Name -->
        <div class="col-span-2 grid gap-1.5">
          <Label for="name">Full Name <span class="text-red-500">*</span></Label>
          <Input id="name" v-model="form.name" placeholder="e.g. Jane Doe" required />
          <InputError :message="formErrors.name" />
        </div>

        <!-- Member Type -->
        <div class="grid gap-1.5">
          <Label for="member_type">Member Type <span class="text-red-500">*</span></Label>
          <select
            id="member_type"
            v-model="form.member_type"
            class="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="individual">Individual</option>
            <option value="corporate">Corporate</option>
            <option value="group">Group</option>
          </select>
          <InputError :message="formErrors.member_type" />
        </div>

        <!-- Gender -->
        <div class="grid gap-1.5">
          <Label for="gender">Gender <span class="text-red-500">*</span></Label>
          <select
            id="gender"
            v-model="form.gender"
            class="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <InputError :message="formErrors.gender" />
        </div>

        <!-- Phone -->
        <div class="grid gap-1.5">
          <Label>Phone <span class="text-red-500">*</span></Label>
          <PhoneInput
            v-model="form.phone"
            v-model:countryCode="form.phone_country"
            placeholder="7XX XXX XXX"
            :error="formErrors.phone"
          />
          <InputError :message="formErrors.phone" />
        </div>

        <!-- Email -->
        <div class="grid gap-1.5">
          <Label for="email">Email</Label>
          <Input id="email" type="email" v-model="form.email" placeholder="jane@example.com" />
          <InputError :message="formErrors.email" />
        </div>

        <!-- Marital Status -->
        <div class="grid gap-1.5">
          <Label for="marital_status">Marital Status <span class="text-red-500">*</span></Label>
          <select
            id="marital_status"
            v-model="form.marital_status"
            class="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
          <InputError :message="formErrors.marital_status" />
        </div>

        <!-- Nationality -->
        <div class="grid gap-1.5">
          <Label for="nationality">Nationality <span class="text-red-500">*</span></Label>
          <Input id="nationality" v-model="form.nationality" placeholder="e.g. Kenyan" />
          <InputError :message="formErrors.nationality" />
        </div>

        <!-- ID Number -->
        <div class="grid gap-1.5">
          <Label for="id_number">ID / Passport Number</Label>
          <Input id="id_number" v-model="form.id_number" placeholder="National ID or Passport" />
          <InputError :message="formErrors.id_number" />
        </div>

        <!-- DOB -->
        <div class="grid gap-1.5">
          <Label for="dob">Date of Birth</Label>
          <Input id="dob" type="date" v-model="form.dob" />
          <InputError :message="formErrors.dob" />
        </div>

        <!-- Joined At -->
        <div class="grid gap-1.5">
          <Label for="joined_at">Date Joined</Label>
          <Input id="joined_at" type="date" v-model="form.joined_at" />
          <InputError :message="formErrors.joined_at" />
        </div>

        <!-- Address -->
        <div class="col-span-2 grid gap-1.5">
          <Label for="address">Address <span class="text-red-500">*</span></Label>
          <textarea
            id="address"
            v-model="form.address"
            rows="2"
            placeholder="Physical address"
            class="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
          <InputError :message="formErrors.address" />
        </div>

        <!-- Footer -->
        <DialogFooter class="col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" @click="showForm = false">Cancel</Button>
          <Button
            type="submit"
            class="bg-[#001d22] text-white hover:bg-[#001d22]/90"
            :disabled="formLoading"
          >
            <Spinner v-if="formLoading" class="mr-2" />
            {{ editingId ? 'Save Changes' : 'Add Member' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogScrollContent>
  </Dialog>

  <!-- ── Delete Confirmation ───────────────────────────────────────────────── -->
  <Dialog v-model:open="showDeleteDialog">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Delete Member</DialogTitle>
      </DialogHeader>
      <p class="text-sm text-neutral-600 dark:text-neutral-400">
        Are you sure you want to delete
        <span class="font-semibold text-neutral-900 dark:text-white">{{ deleteTarget?.name }}</span>?
        This action cannot be undone.
      </p>
      <DialogFooter class="flex justify-end gap-2 pt-2">
        <Button variant="outline" @click="showDeleteDialog = false">Cancel</Button>
        <Button
          class="bg-red-600 text-white hover:bg-red-700"
          :disabled="deleteLoading"
          @click="deleteMember"
        >
          <Spinner v-if="deleteLoading" class="mr-2" />
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
