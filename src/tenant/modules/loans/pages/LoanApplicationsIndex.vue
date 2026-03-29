<script setup lang="ts">
import { ref, computed } from 'vue'
import { HandCoins, Plus, Eye, Pencil, Search, X, Filter, ChevronLeft, ChevronRight, RotateCcw, ClipboardList, Clock, FileSearch, Users, ThumbsUp, ThumbsDown, FileWarning } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useRouter } from 'vue-router'
import { useLoanApplications } from '../composables/useLoanApplications'
import { useLoanAppraisalActions } from '../composables/useLoanAppraisalActions'
import type { LoanApplication } from '../../../apis/loans/loanApplicationsApi'

const router = useRouter()

const {
    applications, loading, filters, meta, visiblePages, perPage, products, branches,
    summary,
    fetch, fetchSummary,
    handleSearch, handleFilter, handlePageChange, changePerPage, clearFilters,
    openCreate, openEdit,
} = useLoanApplications()

// Stub application ref for inline approve/decline — swapped per row action
const activeApplication = ref<LoanApplication | null>(null)

async function reloadList() {
    await fetch(meta.value.current_page)
    void fetchSummary()
}

const {
    showApproveModal, approving, approveComments, openApproveModal, submitApprove,
    showDeclineModal, declining, declineReason, declineError, openDeclineModal, submitDecline,
} = useLoanAppraisalActions(activeApplication, reloadList)

function openInlineApprove(app: LoanApplication) {
    activeApplication.value = app
    openApproveModal()
}

function openInlineDecline(app: LoanApplication) {
    activeApplication.value = app
    openDeclineModal()
}

const isRecommendedView = computed(() => filters.value.status === 'recommended')

function filterByStatus(status: string) {
    filters.value.status = status
    void fetch(1)
    void fetchSummary()
}

async function reopenApplication(id: number) {
    try {
        const { loanApplicationsApi } = await import('../../../apis/loans/loanApplicationsApi')
        await loanApplicationsApi.reopen(id)
        const { toast } = await import('vue-sonner')
        toast.success('Application reopened as draft.')
        fetch(meta.value.current_page)
        void fetchSummary()
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
    { value: 'awaiting_documents',  label: 'Awaiting Documents' },
    { value: 'awaiting_guarantors', label: 'Awaiting Guarantors' },
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

        <!-- Status Summary Cards -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            <!-- Total Active -->
            <button
                class="group flex flex-col gap-1.5 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600"
                :class="filters.status === '' ? 'ring-2 ring-nfuko-primary dark:ring-bg-nfuko-yellow' : ''"
                @click="filterByStatus('')"
            >
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Active</span>
                    <ClipboardList class="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                </div>
                <span class="text-2xl font-bold text-neutral-900 dark:text-white">{{ summary.total_active }}</span>
            </button>

            <!-- Submitted -->
            <button
                class="group flex flex-col gap-1.5 rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm transition-colors hover:border-blue-300 dark:border-blue-900/50 dark:bg-blue-900/20 dark:hover:border-blue-700"
                :class="filters.status === 'submitted' ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''"
                @click="filterByStatus('submitted')"
            >
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-blue-600 dark:text-blue-400">Submitted</span>
                    <Clock class="h-4 w-4 text-blue-400 dark:text-blue-500" />
                </div>
                <span class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{ summary.submitted }}</span>
            </button>

            <!-- Under Review -->
            <button
                class="group flex flex-col gap-1.5 rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm transition-colors hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-900/20 dark:hover:border-amber-700"
                :class="filters.status === 'under_review' ? 'ring-2 ring-amber-500 dark:ring-amber-400' : ''"
                @click="filterByStatus('under_review')"
            >
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-amber-600 dark:text-amber-400">Under Review</span>
                    <FileSearch class="h-4 w-4 text-amber-400 dark:text-amber-500" />
                </div>
                <span class="text-2xl font-bold text-amber-700 dark:text-amber-300">{{ summary.under_review }}</span>
            </button>

            <!-- Awaiting Documents -->
            <button
                class="group flex flex-col gap-1.5 rounded-2xl border border-orange-100 bg-orange-50 p-4 shadow-sm transition-colors hover:border-orange-300 dark:border-orange-900/50 dark:bg-orange-900/20 dark:hover:border-orange-700"
                :class="filters.status === 'awaiting_documents' ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''"
                @click="filterByStatus('awaiting_documents')"
            >
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-orange-600 dark:text-orange-400">Awaiting Docs</span>
                    <FileWarning class="h-4 w-4 text-orange-400 dark:text-orange-500" />
                </div>
                <span class="text-2xl font-bold text-orange-700 dark:text-orange-300">{{ summary.awaiting_documents }}</span>
            </button>

            <!-- Awaiting Guarantors -->
            <button
                class="group flex flex-col gap-1.5 rounded-2xl border border-yellow-100 bg-yellow-50 p-4 shadow-sm transition-colors hover:border-yellow-300 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:hover:border-yellow-700"
                :class="filters.status === 'awaiting_guarantors' ? 'ring-2 ring-yellow-500 dark:ring-yellow-400' : ''"
                @click="filterByStatus('awaiting_guarantors')"
            >
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-yellow-600 dark:text-yellow-400">Awaiting Guarantors</span>
                    <Users class="h-4 w-4 text-yellow-400 dark:text-yellow-500" />
                </div>
                <span class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{{ summary.awaiting_guarantors }}</span>
            </button>

            <!-- Recommended -->
            <button
                class="group flex flex-col gap-1.5 rounded-2xl border border-purple-100 bg-purple-50 p-4 shadow-sm transition-colors hover:border-purple-300 dark:border-purple-900/50 dark:bg-purple-900/20 dark:hover:border-purple-700"
                :class="filters.status === 'recommended' ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''"
                @click="filterByStatus('recommended')"
            >
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-purple-600 dark:text-purple-400">Pending Approval</span>
                    <ThumbsUp class="h-4 w-4 text-purple-400 dark:text-purple-500" />
                </div>
                <span class="text-2xl font-bold text-purple-700 dark:text-purple-300">{{ summary.recommended }}</span>
            </button>

            <!-- Approved -->
            <button
                class="group flex flex-col gap-1.5 rounded-2xl border border-green-100 bg-green-50 p-4 shadow-sm transition-colors hover:border-green-300 dark:border-green-900/50 dark:bg-green-900/20 dark:hover:border-green-700"
                :class="filters.status === 'approved' ? 'ring-2 ring-green-500 dark:ring-green-400' : ''"
                @click="filterByStatus('approved')"
            >
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-green-600 dark:text-green-400">Approved</span>
                    <HandCoins class="h-4 w-4 text-green-400 dark:text-green-500" />
                </div>
                <span class="text-2xl font-bold text-green-700 dark:text-green-300">{{ summary.approved }}</span>
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
                        <!-- Recommended view: swap Approved col for Recommended + Ceiling -->
                        <template v-if="isRecommendedView">
                            <th class="px-6 py-3 text-right">Recommended</th>
                            <th class="px-6 py-3 text-right">Ceiling</th>
                            <th class="px-6 py-3 text-center">Risk</th>
                            <th class="px-6 py-3 text-center">Votes</th>
                        </template>
                        <template v-else>
                            <th class="px-6 py-3 text-right">Approved</th>
                            <th class="px-6 py-3">Status</th>
                        </template>
                        <th class="px-6 py-3">Submitted</th>
                        <th class="px-6 py-3 text-center">Days</th>
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
                            <div v-if="app.requested_term" class="text-xs text-neutral-400">{{ app.requested_term }}mo</div>
                        </td>

                        <!-- Recommended view columns -->
                        <template v-if="isRecommendedView">
                            <td class="px-6 py-4 text-right">
                                <span class="font-medium text-purple-700 dark:text-purple-300">
                                    {{ displayAmount(app.recommended_amount_formatted, app.recommended_amount) }}
                                </span>
                                <div v-if="app.recommended_term" class="text-xs text-neutral-400">{{ app.recommended_term }}mo</div>
                            </td>
                            <td class="px-6 py-4 text-right text-neutral-500 dark:text-neutral-400">
                                {{ displayAmount(app.loan_product?.max_amount_formatted, app.loan_product?.max_amount) }}
                            </td>
                            <td class="px-6 py-4 text-center">
                                <span
                                    v-if="app.risk_rating"
                                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                                    :class="{
                                        'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400': app.risk_rating === 'low',
                                        'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': app.risk_rating === 'medium',
                                        'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': app.risk_rating === 'high',
                                        'bg-red-100 text-red-900 dark:bg-red-900/50 dark:text-red-300': app.risk_rating === 'critical',
                                    }"
                                >{{ app.risk_rating }}</span>
                                <span v-else class="text-neutral-400">—</span>
                            </td>
                            <td class="px-6 py-4 text-center text-neutral-500 dark:text-neutral-400 text-xs">
                                {{ app.approvals_count ?? 0 }} cast
                            </td>
                        </template>

                        <!-- Default columns -->
                        <template v-else>
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
                        </template>

                        <td class="px-6 py-4 text-neutral-500 dark:text-neutral-400">
                            {{ formatDate(app.submitted_at) }}
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span v-if="app.days_pending != null"
                                class="inline-flex min-w-[2rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium"
                                :class="app.days_pending >= 15
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : app.days_pending >= 8
                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                        : app.days_pending >= 4
                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            : 'text-neutral-500 dark:text-neutral-400'">
                                {{ app.days_pending }}
                            </span>
                            <span v-else class="text-neutral-400 dark:text-neutral-500">—</span>
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
                                <!-- Inline approve/decline for recommended -->
                                <template v-if="app.status === 'recommended'">
                                    <button
                                        class="flex h-8 w-8 items-center justify-center rounded-lg text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
                                        title="Approve"
                                        @click="openInlineApprove(app)"
                                    >
                                        <ThumbsUp class="h-4 w-4" />
                                    </button>
                                    <button
                                        class="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                                        title="Decline"
                                        @click="openInlineDecline(app)"
                                    >
                                        <ThumbsDown class="h-4 w-4" />
                                    </button>
                                </template>
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
                        class="flex h-8 min-w-8 items-center justify-center rounded-lg px-1 text-sm font-medium transition-colors"
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

    <!-- ─── Inline Approve Modal ─────────────────────────────────────────────── -->
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showApproveModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                <div class="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-neutral-900" @click.stop>
                    <div class="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Approve Application</h3>
                        <p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{{ activeApplication?.application_no }}</p>
                    </div>
                    <div class="px-6 py-4">
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Comments <span class="text-neutral-400">(optional)</span></label>
                        <textarea
                            v-model="approveComments"
                            rows="3"
                            placeholder="Add any comments…"
                            class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                        />
                    </div>
                    <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800" @click="showApproveModal = false">Cancel</button>
                        <button
                            class="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            :disabled="approving"
                            @click="submitApprove"
                        >
                            <ThumbsUp v-if="!approving" class="h-4 w-4" />
                            <span>{{ approving ? 'Approving…' : 'Approve' }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>

    <!-- ─── Inline Decline Modal ─────────────────────────────────────────────── -->
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showDeclineModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                <div class="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-neutral-900" @click.stop>
                    <div class="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Decline Application</h3>
                        <p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{{ activeApplication?.application_no }}</p>
                    </div>
                    <div class="px-6 py-4">
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Reason <span class="text-red-500">*</span></label>
                        <textarea
                            v-model="declineReason"
                            rows="3"
                            placeholder="State the reason for declining…"
                            class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                            :class="declineError ? 'border-red-400' : ''"
                        />
                        <p v-if="declineError" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ declineError }}</p>
                    </div>
                    <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                        <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800" @click="showDeclineModal = false">Cancel</button>
                        <button
                            class="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            :disabled="declining"
                            @click="submitDecline"
                        >
                            <ThumbsDown v-if="!declining" class="h-4 w-4" />
                            <span>{{ declining ? 'Declining…' : 'Decline' }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
