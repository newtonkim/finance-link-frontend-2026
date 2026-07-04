<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Printer, FileText, FileSpreadsheet, ChevronDown, Upload, X, Loader2 } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Spinner } from '@/Global'
import { saccoBrandingApi, saccoBrandingState } from '@/tenant/apis/saccobranding/saccoBrandingApi'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTenantContextStore } from '@/stores/tenantContext'
import { useMembers } from '../composables/useMembers'
import MembersTable from '../components/MembersTable.vue'
import MemberImportDialog from '../components/MemberImportDialog.vue'

const settingsStore = useSettingsStore()
const tenantStore = useTenantContextStore()
const tenant = computed(() => tenantStore.currentTenant as any)
const tenantPhone = computed(() =>
  tenant.value?.settings?.phone || tenant.value?.settings?.phone_number ||
  tenant.value?.settings?.tel || tenant.value?.settings?.contact_phone || ''
)

const {
  members, meta, pages, loading, exporting, searchQuery, searching, clearSearch,
  showDeleteDialog, deleteTarget, deleteLoading,
  fetchMembers, openCreate, openEdit, viewMember,
  confirmDelete, deleteMember, exportMembersExcel,
} = useMembers()

const showImportDialog = ref(false)
const exportMenuOpen = ref(false)
const printSize = ref<'a4' | 'a5' | 'pos'>('a4')
const print = () => window.print()

onMounted(async () => {
  if (!saccoBrandingState.loaded) {
    try { await saccoBrandingApi.get() } catch { /* ignore */ }
  }
  if (!settingsStore.onboardingSettingsLoaded) {
    settingsStore.fetchOnboardingSettings()
  }
})
</script>

<template>
  <div class="flex flex-col gap-6 p-6" :class="`print-size-${printSize}`">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 no-print">
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Members</h1>
      <div class="flex items-center gap-2">
        <!-- Print size -->
        <div class="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
          <span>Print size</span>
          <select v-model="printSize" class="rounded-full border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold text-neutral-700 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
            <option value="a4">A4</option><option value="a5">A5</option><option value="pos">POS</option>
          </select>
        </div>
        <button @click="() => print()" class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">
          <Printer class="h-4 w-4" /> Print
        </button>
        <button @click="() => print()" class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">
          <FileText class="h-4 w-4" /> Export PDF
        </button>
        <!-- Export Excel dropdown -->
        <div class="relative">
          <button @click="exportMenuOpen = !exportMenuOpen" class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">
            <FileSpreadsheet class="h-4 w-4" /> Export Excel <ChevronDown class="h-4 w-4" />
          </button>
          <div v-if="exportMenuOpen" class="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            <button class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800" :disabled="exporting" @click="exportMembersExcel('page')">Export Excel (Page)</button>
            <button class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800" :disabled="exporting" @click="exportMembersExcel('all')">Export Excel (All)</button>
          </div>
        </div>
        <button @click="showImportDialog = true" class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">
          <Upload class="h-4 w-4" /> Import
        </button>
        <button @click="openCreate" class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 inline-flex items-center gap-2 rounded-full  px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:/90 transition-colors">
          <Plus class="h-4 w-4" /> Add New Member
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="no-print w-full max-w-2xl">
      <div class="group relative">
        <!-- Leading icon: spinner while a search is pending, magnifier otherwise -->
        <Loader2 v-if="searching" class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-nfuko-primary" />
        <Search v-else class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 transition-colors group-focus-within:text-nfuko-primary" />

        <input v-model="searchQuery" type="search" enterkeyhint="search" autocomplete="off"
          aria-label="Search members"
          placeholder="Search by name, member number, phone, or email"
          @keydown.esc="clearSearch"
          class="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-11 pr-11 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white [&::-webkit-search-cancel-button]:hidden" />

        <!-- Clear button -->
        <button v-if="searchQuery" type="button" @click="clearSearch"
          aria-label="Clear search"
          class="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Result hint -->
      <p class="mt-2 pl-4 text-xs font-medium text-neutral-500" aria-live="polite">
        <template v-if="searching">Searching…</template>
        <template v-else-if="searchQuery.trim()">
          {{ meta.total }} {{ meta.total === 1 ? 'result' : 'results' }} for “{{ searchQuery.trim() }}”
        </template>
        <template v-else>&nbsp;</template>
      </p>
    </div>

    <!-- Print header -->
    <div class="hidden print-only border-b border-neutral-200 pb-3 print-header">
      <div class="flex items-center gap-3 print-header-row">
        <div class="h-12 w-12 overflow-hidden rounded-lg bg-neutral-100 print-logo">
          <img v-if="saccoBrandingState.logo_url" :src="saccoBrandingState.logo_url" alt="Sacco logo" class="h-full w-full object-contain" />
        </div>
        <div class="min-w-0 print-header-text">
          <div class="text-lg font-bold text-neutral-900">{{ saccoBrandingState.sacco_name || 'SACCO' }}</div>
          <div v-if="saccoBrandingState.tagline" class="text-xs uppercase tracking-widest text-neutral-500">{{ saccoBrandingState.tagline }}</div>
          <div v-if="tenantPhone" class="text-[11px] text-neutral-500">Tel: {{ tenantPhone }}</div>
          <div class="text-[11px] text-neutral-400">Members List</div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <MembersTable
      :members="members" :loading="loading" :meta="meta" :pages="pages"
      @view="viewMember" @edit="openEdit" @delete="confirmDelete" @paginate="fetchMembers"
    />

    <div class="hidden print-only mt-4 text-center text-xs text-neutral-500 print-footer">
      Thank you for saving with us.
    </div>
  </div>

  <!-- Import Dialog -->
  <MemberImportDialog v-model:open="showImportDialog" @imported="fetchMembers(1)" />

  <!-- Delete Confirmation -->
  <Dialog v-model:open="showDeleteDialog">
    <DialogContent class="max-w-sm">
      <DialogHeader><DialogTitle>Delete Member</DialogTitle></DialogHeader>
      <p class="text-sm text-neutral-600 dark:text-neutral-400">
        Are you sure you want to delete
        <span class="font-semibold text-neutral-900 dark:text-white">{{ deleteTarget?.name }}</span>?
        This action cannot be undone.
      </p>
      <DialogFooter class="flex justify-end gap-2 pt-2">
        <Button variant="outline" @click="showDeleteDialog = false">Cancel</Button>
        <Button class="bg-red-600 text-white hover:bg-red-700" :disabled="deleteLoading" @click="deleteMember">
          <Spinner v-if="deleteLoading" class="mr-2" />Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.print-only { display: none; }
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  .print-size-a4 { width: 210mm; }
  .print-size-a5 { width: 148mm; }
  .print-size-pos { width: 80mm; font-size: 10px; }
  .print-size-pos .print-header { text-align: center; }
  .print-size-pos .print-header-row { flex-direction: column; align-items: center; gap: 6px; }
  .print-size-pos .print-logo { height: 48px; width: 48px; }
  .print-size-pos .print-header-text { text-align: center; }
  .print-size-pos table { font-size: 9px; }
  .print-size-pos .col-email,
  .print-size-pos .col-gender,
  .print-size-pos .col-status,
  .print-size-pos .col-joined,
  .print-size-pos .col-actions,
  .print-size-pos .member-avatar { display: none !important; }
}
</style>
