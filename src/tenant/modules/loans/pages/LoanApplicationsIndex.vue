<script setup lang="ts">
import { ref, computed } from 'vue'
import { HandCoins, Plus, Eye, Pencil, Search, X, Filter, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useRouter } from 'vue-router'
import { useLoanApplications } from '../composables/useLoanApplications'

const router = useRouter()

const {
    applications, loading, filters, meta, visiblePages, perPage, products, branches,
    fetch,
    handleSearch, handleFilter, handlePageChange, changePerPage, clearFilters,
    openCreate, openEdit,
} = useLoanApplications()

async function reopenApplication(id: number) {
    try {
        const { loanApplicationsApi } = await import('../../../apis/loans/loanApplicationsApi')
        await loanApplicationsApi.reopen(id)
        const { toast } = await import('vue-sonner')
        toast.success('Application reopened as draft.')
        fetch(meta.value.current_page)
    } catch (err: any) {
        const { toast } = await import('vue-sonner')
        toast.error(err?.response?.data?.message ?? 'Failed to reopen application.')
    }
}

// ─── Product filter (client-side search over loaded list) ─────────────────────
const productFilterSearch       = ref('')
const showProductFilter         = ref(false)
const selectedProductName       = ref('')

const filteredProductOptions = computed(() => {
    const q = productFilterSearch.value.trim().toLowerCase()
    if (!q) return products.value
    return products.value.filter(p =>
        p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)
    )
})

function selectProductFilter(p: { id: number; name: string; code?: string }) {
    filters.value.loan_product_id = p.id
    selectedProductName.value     = p.code ? `${p.name} (${p.code})` : p.name
    productFilterSearch.value     = ''
    showProductFilter.value       = false
    handleFilter()
}

function clearProductFilter() {
    filters.value.loan_product_id = ''
    selectedProductName.value     = ''
    productFilterSearch.value     = ''
    handleFilter()
}

function closeProductFilter() {
    setTimeout(() => { showProductFilter.value = false }, 200)
}

// ─── Member search debounce ───────────────────────────────────────────────────
let memberFilterTimer: ReturnType<typeof setTimeout> | null = null
function onMemberFilterInput() {
    if (memberFilterTimer) clearTimeout(memberFilterTimer)
    memberFilterTimer = setTimeout(() => handleSearch(), 400)
}

const statusOptions = [
    { value: '',             label: 'All Statuses' },
    { value: 'draft',        label: 'Draft' },
    { value: 'submitted',    label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'recommended',  label: 'Recommended' },
    { value: 'approved',     label: 'Approved' },
    { value: 'rejected',     label: 'Rejected' },
    { value: 'disbursed',    label: 'Disbursed' },
    { value: 'cancelled',    label: 'Cancelled' },
]

function statusBadgeClass(status: string | undefined) {
    switch (status) {
        case 'draft':        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
        case 'submitted':    return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        case 'under_review': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        case 'recommended':  return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
        case 'approved':     return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        case 'rejected':     return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        case 'disbursed':    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        case 'cancelled':    return 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
        default:             return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
    }
}

function statusLabel(status: string | undefined) {
    if (!status) return '—'
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatAmount(amount: number | string | null | undefined) {
    if (amount == null || amount === '') return '—'
    return formatMoneyValue(amount)
}

function displayAmount(formatted: string | null | undefined, raw: number | string | null | undefined) {
    return formatted || formatAmount(raw)
}

function formatDate(date: string | null | undefined) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const hasActiveFilters = () => {
    return filters.value.status || filters.value.member_search || filters.value.loan_product_id || filters.value.branch_id || filters.value.date_from || filters.value.date_to
}
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">

        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <HandCoins class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Loan Applications</h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage and track member loan applications</p>
                </div>
            </div>
            <button
                class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:bg-nfuko-primary/90 transition-colors dark:bg-bg-nfuko-yellow dark:text-black"
                @click="openCreate"
            >
                <Plus class="h-4 w-4" />
                New Application
            </button>
        </div>

        <!-- Filters -->
        <div class="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div class="flex flex-wrap items-end gap-3">
                <div class="flex items-center gap-2">
                    <Filter class="h-4 w-4 text-neutral-400" />
                    <span class="text-sm font-medium text-neutral-600 dark:text-neutral-400">Filters</span>
                </div>

                <!-- Status filter -->
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Status</label>
                    <select
                        v-model="filters.status"
                        class="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        @change="handleFilter"
                    >
                        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                </div>

                <!-- Member search -->
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Member</label>
                    <div class="relative">
                        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                            v-model="filters.member_search"
                            type="text"
                            placeholder="Search member…"
                            class="w-48 rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                            @input="onMemberFilterInput"
                            @keyup.enter="handleSearch"
                        />
                    </div>
                </div>

                <!-- Loan Product filter -->
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Product</label>
                    <div class="relative">
                        <div class="flex w-44 items-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm gap-1.5 dark:border-neutral-700 dark:bg-neutral-800">
                            <input
                                v-model="productFilterSearch"
                                :placeholder="selectedProductName || 'All products…'"
                                :class="selectedProductName && !productFilterSearch ? 'text-neutral-900 dark:text-white' : ''"
                                class="flex-1 min-w-0 bg-transparent text-sm text-neutral-500 outline-none dark:placeholder-neutral-500 dark:text-neutral-400"
                                @focus="showProductFilter = true"
                                @blur="closeProductFilter"
                            />
                            <button v-if="filters.loan_product_id" type="button" class="shrink-0 text-neutral-400 hover:text-neutral-600" @mousedown.prevent="clearProductFilter">
                                <X class="h-3 w-3" />
                            </button>
                        </div>
                        <div v-if="showProductFilter" class="absolute z-20 mt-1 w-56 rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                            <ul v-if="filteredProductOptions.length" class="max-h-48 overflow-y-auto">
                                <li
                                    v-for="p in filteredProductOptions" :key="p.id"
                                    class="cursor-pointer px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                                    @mousedown.prevent="selectProductFilter(p)"
                                >
                                    <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ p.name }}</p>
                                    <p class="text-xs text-neutral-400">{{ p.code }}</p>
                                </li>
                            </ul>
                            <p v-else class="px-3 py-2 text-sm text-neutral-400">No products found.</p>
                        </div>
                    </div>
                </div>

                <!-- Branch filter -->
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Branch</label>
                    <select
                        v-model="filters.branch_id"
                        class="w-40 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        @change="handleFilter"
                    >
                        <option value="">All Branches</option>
                        <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
                    </select>
                </div>

                <!-- Date from -->
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">From</label>
                    <input
                        v-model="filters.date_from"
                        type="date"
                        class="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        @change="handleFilter"
                    />
                </div>

                <!-- Date to -->
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">To</label>
                    <input
                        v-model="filters.date_to"
                        type="date"
                        class="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        @change="handleFilter"
                    />
                </div>

                <!-- Apply & Clear -->
                <div class="flex items-end gap-2">
                    <button
                        class="rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:bg-nfuko-primary/90 transition-colors dark:bg-bg-nfuko-yellow dark:text-black"
                        @click="handleFilter"
                    >
                        Apply
                    </button>
                    <button
                        v-if="hasActiveFilters()"
                        class="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                        @click="clearFilters"
                    >
                        <X class="h-3.5 w-3.5" />
                        Clear
                    </button>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">

            <!-- Loading skeleton -->
            <div v-if="loading" class="divide-y divide-neutral-50 dark:divide-neutral-800">
                <div v-for="n in 8" :key="n" class="flex items-center gap-4 px-6 py-4">
                    <div class="h-4 w-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                    <div class="h-4 w-32 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                    <div class="h-4 w-20 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                    <div class="ml-auto h-6 w-16 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
                </div>
            </div>

            <!-- Empty state -->
            <div v-else-if="applications.length === 0" class="flex flex-col items-center justify-center py-16 gap-2">
                <HandCoins class="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                <p class="text-sm text-neutral-500 dark:text-neutral-400">No loan applications found.</p>
                <button
                    class="mt-2 text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline"
                    @click="openCreate"
                >
                    Create your first loan application
                </button>
            </div>

            <!-- Table data -->
            <table v-else class="w-full text-sm">
                <thead class="border-b border-neutral-100 dark:border-neutral-800">
                    <tr class="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        <th class="px-6 py-3">Application No</th>
                        <th class="px-6 py-3">Member</th>
                        <th class="px-6 py-3">Product</th>
                        <th class="px-6 py-3 text-right">Requested</th>
                        <th class="px-6 py-3 text-right">Approved</th>
                        <th class="px-6 py-3">Status</th>
                        <th class="px-6 py-3">Submitted</th>
                        <th class="px-6 py-3 text-center">Days Pending</th>
                        <th class="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                    <tr
                        v-for="app in applications"
                        :key="app.id"
                        class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                        <td class="px-6 py-4 font-mono text-xs font-medium text-neutral-900 dark:text-white">
                            {{ app.application_no ?? '—' }}
                        </td>
                        <td class="px-6 py-4">
                            <div class="font-medium text-neutral-900 dark:text-white">
                                {{ app.member?.name ?? '—' }}
                            </div>
                            <div v-if="app.member?.member_no" class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                                {{ app.member.member_no }}
                            </div>
                        </td>
                        <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                            {{ app.loan_product?.name ?? '—' }}
                        </td>
                        <td class="px-6 py-4 text-right font-medium text-neutral-900 dark:text-white">
                            {{ displayAmount(app.requested_amount_formatted, app.requested_amount) }}
                        </td>
                        <td class="px-6 py-4 text-right text-neutral-600 dark:text-neutral-400">
                            {{ displayAmount(app.approved_amount_formatted, app.approved_amount) }}
                        </td>
                        <td class="px-6 py-4">
                            <span
                                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                                :class="statusBadgeClass(app.status)"
                            >
                                {{ statusLabel(app.status) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-neutral-500 dark:text-neutral-400">
                            {{ formatDate(app.submitted_at) }}
                        </td>
                        <td class="px-6 py-4 text-center text-neutral-500 dark:text-neutral-400">
                            {{ app.days_pending != null ? app.days_pending : '—' }}
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex items-center justify-end gap-1">
                                <button
                                    class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    title="View"
                                    @click="router.push({ name: 'tenant-loans-show', params: { id: app.id } })"
                                >
                                    <Eye class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                </button>
                                <button
                                    v-if="app.status === 'draft'"
                                    class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    title="Edit"
                                    @click="openEdit(app)"
                                >
                                    <Pencil class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                </button>
                                <button
                                    v-if="app.status === 'cancelled'"
                                    class="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
                                    title="Reopen as Draft"
                                    @click="reopenApplication(app.id!)"
                                >
                                    <RotateCcw class="h-4 w-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div v-if="meta.total > 0" class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <!-- Left: summary + per-page -->
            <div class="flex items-center gap-3">
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    <span v-if="meta.from && meta.to">
                        Showing <span class="font-medium text-neutral-700 dark:text-neutral-200">{{ meta.from }}–{{ meta.to }}</span> of
                    </span>
                    <span class="font-medium text-neutral-700 dark:text-neutral-200">{{ meta.total }}</span>
                    {{ meta.total === 1 ? 'application' : 'applications' }}
                </p>
                <div class="flex items-center gap-1.5">
                    <label class="text-xs text-neutral-400 dark:text-neutral-500">Rows</label>
                    <select
                        :value="perPage"
                        class="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                        @change="changePerPage(Number(($event.target as HTMLSelectElement).value))"
                    >
                        <option v-for="n in [10, 15, 20, 25, 30, 40, 50]" :key="n" :value="n">{{ n }}</option>
                    </select>
                </div>
            </div>

            <!-- Right: page controls -->
            <div v-if="meta.last_page > 1" class="flex items-center gap-1">
                <!-- Prev -->
                <button
                    :disabled="meta.current_page === 1"
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    @click="handlePageChange(meta.current_page - 1)"
                >
                    <ChevronLeft class="h-4 w-4" />
                </button>

                <!-- Page buttons / ellipsis -->
                <template v-for="(p, i) in visiblePages" :key="i">
                    <span
                        v-if="p === null"
                        class="flex h-8 w-6 items-end justify-center pb-1 text-sm text-neutral-400 dark:text-neutral-600"
                    >…</span>
                    <button
                        v-else
                        class="flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-1 text-sm font-medium transition-colors"
                        :class="p === meta.current_page
                            ? 'bg-nfuko-primary text-white shadow-sm dark:bg-bg-nfuko-yellow dark:text-black'
                            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'"
                        @click="handlePageChange(p)"
                    >
                        {{ p }}
                    </button>
                </template>

                <!-- Next -->
                <button
                    :disabled="meta.current_page === meta.last_page"
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    @click="handlePageChange(meta.current_page + 1)"
                >
                    <ChevronRight class="h-4 w-4" />
                </button>
            </div>
        </div>

    </div>
</template>
