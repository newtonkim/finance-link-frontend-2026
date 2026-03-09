<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, Pencil, Trash2, Eye } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Spinner,
} from '@/Global'
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
  avatar_url: string | null
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

// ─── Delete state ─────────────────────────────────────────────────────────────
const showDeleteDialog = ref(false)
const deleteTarget = ref<Member | null>(null)
const deleteLoading = ref(false)

// ─── Derived ──────────────────────────────────────────────────────────────────
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
  router.push(`/tenant/members/${member.id}/edit`)
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
      <button @click="openCreate"
        class="inline-flex items-center gap-2 rounded-full bg-[#001d22] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#001d22]/90 transition-colors">
        <Plus class="h-4 w-4" />
        Add New Member
      </button>
    </div>

    <!-- Search -->
    <div class="relative max-w-lg">
      <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input v-model="searchQuery" type="text" placeholder="Search by name, member number, phone, or email..."
        class="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#001d22] focus:ring-1 focus:ring-[#001d22] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
    </div>

    <!-- Table card -->
    <div
      class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
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
            <tr v-else v-for="member in members" :key="member.id"
              class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
              <td class="px-6 py-4 font-mono text-xs text-neutral-500">{{ member.member_number }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <!-- Avatar -->
                  <div class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#001d22]/10">
                    <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.name"
                      class="h-full w-full object-cover" />
                    <div v-else class="flex h-full w-full items-center justify-center text-sm font-bold text-[#001d22]">
                      {{ member.name.charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <span class="font-medium text-neutral-900 dark:text-white">{{ member.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ member.phone }}</td>
              <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ member.email ?? '—' }}</td>
              <td class="px-6 py-4 capitalize text-neutral-600 dark:text-neutral-400">{{ member.gender }}</td>
              <td class="px-6 py-4">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                  :class="statusClass(member.status)">
                  {{ member.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-neutral-500 dark:text-neutral-400">{{ formatDate(member.joined_at) }}</td>
              <td class="px-6 py-4 text-right">
                <div class="inline-flex items-center gap-1.5">
                  <button @click="router.push(`/tenant/members/${member.id}`)"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-[#c7d7f5] bg-[#eef3fd] px-3 py-1.5 text-xs font-semibold text-[#4f6cad] hover:bg-[#dce8fb] transition-colors"
                    title="View">
                    <Eye class="h-3.5 w-3.5" />
                    View
                  </button>
                  <button @click="openEdit(member)"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-[#c7d7f5] bg-[#eef3fd] px-3 py-1.5 text-xs font-semibold text-[#4f6cad] hover:bg-[#dce8fb] transition-colors"
                    title="Edit">
                    <Pencil class="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button @click="confirmDelete(member)"
                    class="flex items-center justify-center rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors"
                    title="Delete">
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.last_page > 1"
        class="flex items-center justify-between border-t border-neutral-100 px-6 py-3 dark:border-neutral-800">
        <p class="text-xs text-neutral-400">
          Showing page {{ meta.current_page }} of {{ meta.last_page }} ({{ meta.total }} members)
        </p>
        <div class="flex gap-1">
          <button v-for="page in pages" :key="page" @click="fetchMembers(page)"
            class="h-8 w-8 rounded-lg text-xs font-medium transition-colors" :class="page === meta.current_page
              ? 'bg-[#001d22] text-white'
              : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'">
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  </div>

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
        <Button class="bg-red-600 text-white hover:bg-red-700" :disabled="deleteLoading" @click="deleteMember">
          <Spinner v-if="deleteLoading" class="mr-2" />
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
