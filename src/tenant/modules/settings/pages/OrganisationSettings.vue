<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Building2, Search, Plus, Pencil, Trash2, X, Calendar, ArrowLeft } from 'lucide-vue-next'
import { Spinner, InputError, Label } from '@/Global'
import ConfirmationDialog from '@/Global/confirmationDialog/confirmationDialog.vue'
import { fiscalYearsApi } from '@/tenant/apis/fiscalYears/fiscalYearsApi'
import { toast } from 'vue-sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FiscalYear {
  id: number
  name: string
  start_date: string
  end_date: string
}
interface Meta { current_page: number; last_page: number; total: number }

// ─── Fiscal Year List Drawer ─────────────────────────────────────────────────
const showFiscalDrawer = ref(false)
const fiscalYears = ref<FiscalYear[]>([])
const fiscalMeta = ref<Meta>({ current_page: 1, last_page: 1, total: 0 })
const fiscalLoading = ref(false)
const fiscalSearch = ref('')
let fiscalSearchTimer: ReturnType<typeof setTimeout> | null = null

async function fetchFiscalYears(page = 1) {
  fiscalLoading.value = true
  try {
    const res = await fiscalYearsApi.list({ search: fiscalSearch.value || undefined, page })
    fiscalYears.value = res.data?.data ?? []
    if (res.data?.meta) fiscalMeta.value = res.data.meta
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to load financial years.')
  } finally {
    fiscalLoading.value = false
  }
}

watch(fiscalSearch, () => {
  if (fiscalSearchTimer) clearTimeout(fiscalSearchTimer)
  fiscalSearchTimer = setTimeout(() => fetchFiscalYears(1), 400)
})

function openFiscalDrawer() {
  showFiscalDrawer.value = true
  fetchFiscalYears(1)
}

function closeFiscalDrawer() {
  showFiscalDrawer.value = false
  fiscalSearch.value = ''
}

const fiscalPages = computed(() =>
  Array.from({ length: fiscalMeta.value.last_page }, (_, i) => i + 1)
)

// ─── Add / Edit Fiscal Year Form Drawer ──────────────────────────────────────
const showFiscalForm = ref(false)
const fiscalFormMode = ref<'add' | 'edit'>('add')
const fiscalEditId = ref<number>(0)
const fiscalProcessing = ref(false)
const fiscalErrors = ref<Record<string, any>>({})
const fiscalForm = ref({
  name: '',
  start_date: '',
  end_date: '',
})

// Auto-calculate end date based on known fiscal year patterns
watch(() => fiscalForm.value.start_date, (val) => {
  if (!val) { fiscalForm.value.end_date = ''; return }
  try {
    const start = new Date(val)
    const month = start.getMonth() // 0-indexed: 0=Jan, 5=Jun
    const day = start.getDate()
    const year = start.getFullYear()

    if (month === 0 && day === 1) {
      // Jan 1 → Dec 31 of the same year
      fiscalForm.value.end_date = `${year}-12-31`
    } else if (month === 5 && day === 1) {
      // Jun 1 → Jul 31 of the same year
      fiscalForm.value.end_date = `${year}-07-31`
    } else {
      // For other dates, don't auto-populate
      fiscalForm.value.end_date = ''
    }
  } catch {
    fiscalForm.value.end_date = ''
  }
})

function openAddFiscal() {
  fiscalFormMode.value = 'add'
  fiscalEditId.value = 0
  fiscalErrors.value = {}
  fiscalForm.value = { name: '', start_date: '', end_date: '' }
  showFiscalForm.value = true
}

function openEditFiscal(fy: FiscalYear) {
  fiscalFormMode.value = 'edit'
  fiscalEditId.value = fy.id
  fiscalErrors.value = {}
  fiscalForm.value = {
    name: fy.name,
    start_date: fy.start_date,
    end_date: fy.end_date,
  }
  showFiscalForm.value = true
}

function closeFiscalForm() {
  showFiscalForm.value = false
  fiscalErrors.value = {}
}

async function submitFiscalForm() {
  fiscalProcessing.value = true
  fiscalErrors.value = {}

  // Check for duplicate date range in existing fiscal years
  const duplicate = fiscalYears.value.find((fy) => {
    if (fiscalFormMode.value === 'edit' && fy.id === fiscalEditId.value) return false
    return fy.start_date === fiscalForm.value.start_date && fy.end_date === fiscalForm.value.end_date
  })
  if (duplicate) {
    toast.error(`Financial year with this date range already exists (${duplicate.name}).`)
    fiscalProcessing.value = false
    return
  }

  try {
    if (fiscalFormMode.value === 'edit') {
      await fiscalYearsApi.update(fiscalEditId.value, fiscalForm.value)
      toast.success('Financial year updated successfully.')
    } else {
      await fiscalYearsApi.store(fiscalForm.value)
      toast.success('Financial year created successfully.')
    }
    showFiscalForm.value = false
    await fetchFiscalYears(fiscalMeta.value.current_page)
  } catch (err: any) {
    if (err?.response?.status === 422) {
      fiscalErrors.value = err.response.data.errors || {}
    } else {
      toast.error(err?.response?.data?.message ?? 'Failed to save financial year.')
    }
  } finally {
    fiscalProcessing.value = false
  }
}

function formatDate(d: string) {
  if (!d) return '—'
  return d
}

// ─── Delete Fiscal Year ──────────────────────────────────────────────────────
const showDeleteDialog = ref(false)
const deleteTarget = ref<FiscalYear | null>(null)

function deleteFiscalYear(fy: FiscalYear) {
  deleteTarget.value = fy
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await fiscalYearsApi.destroy(deleteTarget.value.id)
    toast.success('Financial year deleted successfully.')
    await fetchFiscalYears(fiscalMeta.value.current_page)
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to delete financial year.')
  } finally {
    showDeleteDialog.value = false
    deleteTarget.value = null
  }
}
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Building2 class="h-5 w-5 text-[#001d22] dark:text-[#C9A84C]" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Organisation Settings
                </h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage your organisation's identity and
                    structure</p>
            </div>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">General Settings</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Configure basic organisation information
                    and settings.</p>
                <button class="text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline">Configure
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Branch Management</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Manage branches and physical locations.
                </p>
                <button class="text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline">Manage Branches
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Fiscal Year</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define and manage your organisation's
                    financial periods.</p>
                <button
                    @click="openFiscalDrawer"
                    :disabled="fiscalLoading"
                    class="inline-flex items-center gap-1.5 text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline disabled:opacity-60"
                >
                    <Spinner v-if="fiscalLoading" class="h-3.5 w-3.5" />
                    {{ fiscalLoading ? 'Loading…' : 'Set Fiscal Year →' }}
                </button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Workflow & Approvals</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Setup approval workflows for various
                    processes.</p>
                <button class="text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline">Configure
                    Workflows →</button>
            </div>
        </div>
    </div>

    <!-- ═══ Fiscal Year List Drawer ═════════════════════════════════════════ -->
    <Transition name="drawer-fade">
        <div v-if="showFiscalDrawer" class="fixed inset-0 z-50">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeFiscalDrawer"></div>

            <Transition name="drawer-slide">
                <aside
                    class="absolute right-0 top-0 h-full w-full max-w-[680px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
                    role="dialog"
                    aria-label="Financial Years"
                >
                    <div class="flex h-full flex-col">
                        <!-- Header -->
                        <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                                        <Calendar class="h-4.5 w-4.5 text-[#001d22] dark:text-[#C9A84C]" />
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-bold tracking-tight text-neutral-900 uppercase dark:text-white">
                                            Financial Years
                                        </h3>
                                        <p class="text-xs text-neutral-500">Manage your organisation's fiscal periods</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    @click="closeFiscalDrawer"
                                    class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white"
                                >
                                    <X class="h-4 w-4" />
                                </button>
                            </div>

                            <!-- Search + Add button -->
                            <div class="mt-4 flex items-center gap-3">
                                <div class="relative flex-1">
                                    <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        v-model="fiscalSearch"
                                        type="text"
                                        placeholder="Search for financial year"
                                        class="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#001d22] focus:ring-1 focus:ring-[#001d22] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    />
                                </div>
                                <button
                                    @click="openAddFiscal"
                                    class="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#001d22] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#002d32] transition-colors shadow-sm dark:bg-[#C9A84C] dark:text-[#001d22] dark:hover:bg-[#b8973b]"
                                >
                                    <Plus class="h-4 w-4" />
                                    Add financial year
                                </button>
                            </div>
                        </div>

                        <!-- Table Body -->
                        <div class="flex-1 overflow-y-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="border-b border-neutral-100 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-800/30">
                                        <th class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">S/N</th>
                                        <th class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Financial year</th>
                                        <th class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Start</th>
                                        <th class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">End</th>
                                        <th class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    <!-- Loading -->
                                    <template v-if="fiscalLoading">
                                        <tr v-for="i in 4" :key="i" class="animate-pulse">
                                            <td v-for="j in 5" :key="j" class="px-6 py-4">
                                                <div class="h-4 rounded bg-neutral-100 dark:bg-neutral-800" :class="j === 2 ? 'w-28' : 'w-20'" />
                                            </td>
                                        </tr>
                                    </template>

                                    <!-- Empty -->
                                    <tr v-else-if="fiscalYears.length === 0">
                                        <td colspan="5" class="px-6 py-16 text-center text-sm text-neutral-400">
                                            No financial years found.
                                        </td>
                                    </tr>

                                    <!-- Rows -->
                                    <tr
                                        v-else
                                        v-for="(fy, idx) in fiscalYears"
                                        :key="fy.id"
                                        class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
                                    >
                                        <td class="px-6 py-4 text-neutral-500">{{ idx + 1 + (fiscalMeta.current_page - 1) * 15 }}</td>
                                        <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">{{ fy.name }}</td>
                                        <td class="px-6 py-4 text-neutral-600 dark:text-neutral-300">{{ formatDate(fy.start_date) }}</td>
                                        <td class="px-6 py-4 text-neutral-600 dark:text-neutral-300">{{ formatDate(fy.end_date) }}</td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-2">
                                                <button
                                                    @click="openEditFiscal(fy)"
                                                    class="inline-flex items-center gap-1.5 rounded-lg bg-[#001d22] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#002d32] transition-colors shadow-sm dark:bg-[#C9A84C] dark:text-[#001d22] dark:hover:bg-[#b8973b]"
                                                >
                                                    <Pencil class="h-3 w-3" />
                                                    Edit
                                                </button>
                                                <button
                                                    @click="deleteFiscalYear(fy)"
                                                    class="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors shadow-sm"
                                                >
                                                    <Trash2 class="h-3 w-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <div v-if="fiscalMeta.last_page > 1" class="flex items-center justify-between border-t border-neutral-100 px-6 py-3 dark:border-neutral-800">
                            <p class="text-xs text-neutral-400">
                                Page {{ fiscalMeta.current_page }} of {{ fiscalMeta.last_page }} ({{ fiscalMeta.total }} records)
                            </p>
                            <div class="flex gap-1">
                                <button
                                    v-for="page in fiscalPages"
                                    :key="page"
                                    @click="fetchFiscalYears(page)"
                                    class="h-8 w-8 rounded-lg text-xs font-medium transition-colors"
                                    :class="page === fiscalMeta.current_page ? 'bg-[#001d22] text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
                                >
                                    {{ page }}
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </Transition>
        </div>
    </Transition>

    <!-- ═══ Add / Edit Fiscal Year Form Drawer ═════════════════════════════ -->
    <Transition name="drawer-fade">
        <div v-if="showFiscalForm" class="fixed inset-0 z-[60]">
            <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px]" @click="closeFiscalForm"></div>

            <Transition name="drawer-slide">
                <aside
                    class="absolute right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
                    role="dialog"
                    :aria-label="fiscalFormMode === 'edit' ? 'Edit financial year' : 'Add financial year'"
                >
                    <div class="flex h-full flex-col">
                        <!-- Header -->
                        <div class="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                            <div class="flex items-center gap-3">
                                <button
                                    type="button"
                                    @click="closeFiscalForm"
                                    class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white"
                                >
                                    <ArrowLeft class="h-4 w-4" />
                                </button>
                                <h3 class="text-[15px] font-bold text-neutral-900 dark:text-white">
                                    {{ fiscalFormMode === 'edit' ? 'Edit financial year' : 'Add financial year' }}
                                </h3>
                            </div>
                            <button
                                type="button"
                                @click="closeFiscalForm"
                                class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white"
                            >
                                <X class="h-4 w-4" />
                            </button>
                        </div>

                        <!-- Form Body -->
                        <form @submit.prevent="submitFiscalForm" class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            <!-- Name -->
                            <div class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Financial year name <span class="text-red-500">*</span></Label>
                                <input
                                    v-model="fiscalForm.name"
                                    type="text"
                                    placeholder="e.g. 2026"
                                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#001d22] focus:ring-2 focus:ring-[#001d22]/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                />
                                <InputError v-if="fiscalErrors.name" :message="fiscalErrors.name?.[0] ?? fiscalErrors.name" />
                            </div>

                            <!-- Start Date -->
                            <div class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Start date</Label>
                                <input
                                    v-model="fiscalForm.start_date"
                                    type="date"
                                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#001d22] focus:ring-2 focus:ring-[#001d22]/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                />
                                <InputError v-if="fiscalErrors.start_date" :message="fiscalErrors.start_date?.[0] ?? fiscalErrors.start_date" />
                            </div>

                            <!-- End Date (auto-calculated, read-only) -->
                            <div class="space-y-2">
                                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">End date <span class="text-red-500">*</span></Label>
                                <input
                                    v-model="fiscalForm.end_date"
                                    type="date"
                                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#001d22] focus:ring-2 focus:ring-[#001d22]/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                />
                                <InputError v-if="fiscalErrors.end_date" :message="fiscalErrors.end_date?.[0] ?? fiscalErrors.end_date" />
                            </div>
                        </form>

                        <!-- Footer -->
                        <div class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
                            <button
                                type="button"
                                @click="closeFiscalForm"
                                class="rounded-lg bg-neutral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-600 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                @click="submitFiscalForm"
                                :disabled="fiscalProcessing"
                                class="inline-flex items-center gap-2 rounded-lg bg-[#001d22] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002d32] transition-colors disabled:opacity-60 shadow-sm dark:bg-[#C9A84C] dark:text-[#001d22] dark:hover:bg-[#b8973b]"
                            >
                                <Spinner v-if="fiscalProcessing" class="h-4 w-4" />
                                {{ fiscalFormMode === 'edit' ? 'Update financial year' : 'Save financial year' }}
                            </button>
                        </div>
                    </div>
                </aside>
            </Transition>
        </div>
    </Transition>

    <!-- ═══ Delete Confirmation Dialog ════════════════════════════════════ -->
    <ConfirmationDialog
        v-model:show="showDeleteDialog"
        :items="deleteTarget"
        title="Delete Financial Year"
        @confirm="confirmDelete"
    />
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
    transition: opacity 0.2s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
    opacity: 0;
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
    transition: transform 0.25s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
    transform: translateX(100%);
}
</style>

