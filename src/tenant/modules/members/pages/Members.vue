<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, Pencil, Trash2, Eye, Printer, FileText, FileSpreadsheet, ChevronDown, Upload, Download, AlertCircle, CheckCircle2, X } from 'lucide-vue-next'
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
import { saccoBrandingApi, saccoBrandingState } from '@/tenant/apis/saccobranding/saccoBrandingApi'
import * as XLSX from 'xlsx'

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
const exporting = ref(false)
const exportMenuOpen = ref(false)
const searchQuery = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null
const printSize = ref<'a4' | 'a5' | 'pos'>('a4')

// ─── Delete state ─────────────────────────────────────────────────────────────
const showDeleteDialog = ref(false)
const deleteTarget = ref<Member | null>(null)
const deleteLoading = ref(false)

// ─── Import state ─────────────────────────────────────────────────────────────
const showImportDialog = ref(false)
const importFile = ref<File | null>(null)
const importLoading = ref(false)
const templateLoading = ref(false)
const importResult = ref<{ imported: number; errors: string[] } | null>(null)

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
onMounted(async () => {
  if (!saccoBrandingState.loaded) {
    try { await saccoBrandingApi.get() } catch { /* ignore */ }
  }
})

// ─── Open form ────────────────────────────────────────────────────────────────
function openCreate() {
  router.push('/tenant/members/create')
}

function printMembers() {
  window.print()
}

function openEdit(member: Member) {
  router.push(`/tenant/members/${member.id}/edit`)
}

function buildMembersRows(rows: Member[]) {
  return rows.map((m) => ({
    'Member Number': m.member_number,
    'Full Name': m.name,
    'Phone': m.phone,
    'Email': m.email ?? '',
    'Gender': m.gender,
    'Status': m.status,
    'Joined': m.joined_at ?? '',
  }))
}

function exportMembersExcelFile(filename: string, rows: Member[]) {
  const worksheet = XLSX.utils.json_to_sheet(buildMembersRows(rows))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Members')
  XLSX.writeFile(workbook, filename)
}

async function exportMembersExcel(scope: 'page' | 'all') {
  if (exporting.value) return
  exporting.value = true
  try {
    if (scope === 'page') {
      exportMembersExcelFile('members-page.xlsx', members.value)
      return
    }
    const allRows: Member[] = []
    const totalPages = Math.max(1, meta.value.last_page)
    for (let page = 1; page <= totalPages; page += 1) {
      const res = await membersApi.list({ search: searchQuery.value || undefined, page })
      const payload = res.data
      allRows.push(...(payload.data ?? []))
    }
    exportMembersExcelFile('members-all.xlsx', allRows)
  } finally {
    exporting.value = false
    exportMenuOpen.value = false
  }
}

// ─── Import / Template ────────────────────────────────────────────────────────
function openImport() {
  importFile.value = null
  importResult.value = null
  showImportDialog.value = true
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  importFile.value = input.files?.[0] ?? null
  importResult.value = null
}

async function downloadTemplate() {
  if (templateLoading.value) return
  templateLoading.value = true
  try {
    const res = await membersApi.downloadTemplate()
    const url = URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = 'members-import-template.xlsx'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } finally {
    templateLoading.value = false
  }
}

async function submitImport() {
  if (!importFile.value || importLoading.value) return
  importLoading.value = true
  importResult.value = null
  try {
    const res = await membersApi.importMembers(importFile.value)
    importResult.value = { imported: res.data.imported, errors: res.data.errors ?? [] }
    if (res.data.imported > 0) {
      await fetchMembers(1)
    }
  } finally {
    importLoading.value = false
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
  if (status === 'active')   return 'bg-green-100 text-green-700'
  if (status === 'pending')  return 'bg-amber-100 text-amber-700'
  if (status === 'rejected') return 'bg-red-100 text-red-600'
  return 'bg-neutral-100 text-neutral-500'
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6" :class="`print-size-${printSize}`">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 no-print">
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Members</h1>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
          <span>Print size</span>
          <select
            v-model="printSize"
            class="rounded-full border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold text-neutral-700 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
          >
            <option value="a4">A4</option>
            <option value="a5">A5</option>
            <option value="pos">POS</option>
          </select>
        </div>
        <button
          @click="printMembers"
          class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          title="Print"
        >
          <Printer class="h-4 w-4" />
          Print
        </button>
        <button
          @click="printMembers"
          class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          title="Export PDF"
        >
          <FileText class="h-4 w-4" />
          Export PDF
        </button>
        <div class="relative">
          <button
            @click="exportMenuOpen = !exportMenuOpen"
            class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            title="Export Excel"
          >
            <FileSpreadsheet class="h-4 w-4" />
            Export Excel
            <ChevronDown class="h-4 w-4" />
          </button>
          <div
            v-if="exportMenuOpen"
            class="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
          >
            <button
              class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
              :disabled="exporting"
              @click="exportMembersExcel('page')"
            >
              Export Excel (Page)
            </button>
            <button
              class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
              :disabled="exporting"
              @click="exportMembersExcel('all')"
            >
              Export Excel (All)
            </button>
          </div>
        </div>
        <button
          @click="openImport"
          class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <Upload class="h-4 w-4" />
          Import
        </button>
        <button @click="openCreate"
          class="inline-flex items-center gap-2 rounded-full bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-nfuko-primary/90 transition-colors">
          <Plus class="h-4 w-4" />
          Add New Member
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="relative max-w-lg no-print">
      <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input v-model="searchQuery" type="text" placeholder="Search by name, member number, phone, or email..."
        class="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition focus: border-nfuko-primary focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
    </div>

    <!-- Print header -->
    <div class="hidden print-only border-b border-neutral-200 pb-3">
      <div class="flex items-center gap-3">
        <div class="h-12 w-12 overflow-hidden rounded-lg bg-neutral-100">
          <img
            v-if="saccoBrandingState.logo_url"
            :src="saccoBrandingState.logo_url"
            alt="Sacco logo"
            class="h-full w-full object-contain"
          />
        </div>
        <div class="min-w-0">
          <div class="text-lg font-bold text-neutral-900">
            {{ saccoBrandingState.sacco_name || 'SACCO' }}
          </div>
          <div v-if="saccoBrandingState.tagline" class="text-xs uppercase tracking-widest text-neutral-500">
            {{ saccoBrandingState.tagline }}
          </div>
          <div class="text-[11px] text-neutral-400">Members List</div>
        </div>
      </div>
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
              <th class="px-6 py-4 text-xs font-medium uppercase tracking-wide text-neutral-400 text-right no-print">Actions</th>
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
                  <div class="h-9 w-9 shrink-0 overflow-hidden rounded-full  bg-nfuko-primary/10">
                    <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.name"
                      class="h-full w-full object-cover" />
                    <div v-else class="flex h-full w-full items-center justify-center text-sm font-bold  text-nfuko-primary">
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
              <td class="px-6 py-4 text-right no-print">
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
        class="flex items-center justify-between border-t border-neutral-100 px-6 py-3 dark:border-neutral-800 no-print">
        <p class="text-xs text-neutral-400">
          Showing page {{ meta.current_page }} of {{ meta.last_page }} ({{ meta.total }} members)
        </p>
        <div class="flex gap-1">
          <button v-for="page in pages" :key="page" @click="fetchMembers(page)"
            class="h-8 w-8 rounded-lg text-xs font-medium transition-colors" :class="page === meta.current_page
              ? ' bg-nfuko-primary text-white'
              : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'">
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Import Members ────────────────────────────────────────────────────── -->
  <Dialog v-model:open="showImportDialog">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Import Members</DialogTitle>
      </DialogHeader>

      <!-- Step 1: Download template -->
      <div class="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
        <p class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Step 1 — Download the Excel template
        </p>
        <button
          :disabled="templateLoading"
          @click="downloadTemplate"
          class="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        >
          <Download class="h-4 w-4" />
          {{ templateLoading ? 'Downloading…' : 'Download Template' }}
        </button>
        <p class="mt-2 text-xs text-neutral-400">
          Fill in your member data then upload the file below.
        </p>
      </div>

      <!-- Step 2: Upload filled file -->
      <div class="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
        <p class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Step 2 — Upload the completed file
        </p>
        <label
          class="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-600 hover:border-nfuko-primary hover:text-nfuko-primary transition-colors dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
        >
          <Upload class="h-5 w-5 shrink-0" />
          <span class="truncate">{{ importFile ? importFile.name : 'Choose .xlsx, .xls or .csv file…' }}</span>
          <input type="file" accept=".xlsx,.xls,.csv" class="sr-only" @change="onFileChange" />
        </label>
      </div>

      <!-- Result -->
      <div v-if="importResult" class="space-y-2">
        <div v-if="importResult.imported > 0" class="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 class="h-4 w-4 shrink-0" />
          {{ importResult.imported }} member(s) imported successfully.
        </div>
        <div v-if="importResult.errors.length" class="rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 dark:border-red-900/30 dark:bg-red-900/10">
          <div class="mb-1 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
            <AlertCircle class="h-4 w-4 shrink-0" />
            {{ importResult.errors.length }} row(s) had errors:
          </div>
          <ul class="ml-6 list-disc space-y-0.5 text-xs text-red-600 dark:text-red-400">
            <li v-for="err in importResult.errors" :key="err">{{ err }}</li>
          </ul>
        </div>
      </div>

      <DialogFooter class="flex justify-end gap-2 pt-2">
        <Button variant="outline" @click="showImportDialog = false">
          <X class="mr-1.5 h-4 w-4" />
          Close
        </Button>
        <Button
          :disabled="!importFile || importLoading"
          class="bg-nfuko-primary text-white hover:bg-nfuko-primary/90 disabled:opacity-60"
          @click="submitImport"
        >
          <Spinner v-if="importLoading" class="mr-2" />
          {{ importLoading ? 'Importing…' : 'Import Members' }}
        </Button>
      </DialogFooter>
    </DialogContent>
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
        <Button class="bg-red-600 text-white hover:bg-red-700" :disabled="deleteLoading" @click="deleteMember">
          <Spinner v-if="deleteLoading" class="mr-2" />
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.print-only {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-only {
    display: block !important;
  }

  .print-size-a4 {
    width: 210mm;
  }

  .print-size-a5 {
    width: 148mm;
  }

  .print-size-pos {
    width: 80mm;
    font-size: 10px;
  }
}
</style>
