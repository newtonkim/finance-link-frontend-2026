<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
    Banknote, Search, ChevronLeft, ChevronRight,
    InboxIcon, Loader2, AlertCircle, CheckCircle2, Clock,
} from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useActiveLoans } from '../composables/useActiveLoans'

const router = useRouter()

const { loading, loans, meta, filters, fetch, applyFilters } = useActiveLoans()

const hasPrev = computed(() => meta.current_page > 1)
const hasNext = computed(() => meta.current_page < meta.last_page)

function prevPage() { if (hasPrev.value) void fetch(meta.current_page - 1) }
function nextPage() { if (hasNext.value) void fetch(meta.current_page + 1) }

function fmt(v: number | string | null | undefined) {
    if (v == null || v === '') return '—'
    return formatMoneyValue(v)
}

function fmtDate(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusColor(status: string) {
    switch (status) {
        case 'active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        case 'arrears': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        case 'closed': return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
        default: return 'bg-neutral-100 text-neutral-500'
    }
}
</script>

<template>
    <div class="px-4 py-6 sm:px-6 lg:px-8 space-y-5">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3">
            <div>
                <h1 class="text-xl font-semibold text-neutral-900 dark:text-white">Loan Portfolio</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Active, arrears, and closed loans</p>
            </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-3">
            <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                    v-model="filters.search"
                    type="text"
                    placeholder="Loan # or member name…"
                    class="pl-9 pr-3 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white w-64"
                    @keyup.enter="applyFilters"
                />
            </div>
            <select
                v-model="filters.status"
                class="py-2 px-3 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                @change="applyFilters">
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="arrears">Arrears</option>
                <option value="closed">Closed</option>
            </select>
        </div>

        <!-- Table -->
        <div class="rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <!-- Loading state -->
            <div v-if="loading" class="flex items-center justify-center py-16 gap-2 text-neutral-400">
                <Loader2 class="h-5 w-5 animate-spin" />
                <span class="text-sm">Loading…</span>
            </div>

            <!-- Empty state -->
            <div v-else-if="!loans.length" class="flex flex-col items-center justify-center py-16 gap-3 text-neutral-400">
                <InboxIcon class="h-10 w-10" />
                <p class="text-sm">No loans found.</p>
            </div>

            <!-- Data table -->
            <table v-else class="w-full text-sm">
                <thead class="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Loan #</th>
                        <th class="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Member</th>
                        <th class="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Product</th>
                        <th class="px-4 py-3 text-right font-medium text-neutral-500 dark:text-neutral-400">Principal</th>
                        <th class="px-4 py-3 text-right font-medium text-neutral-500 dark:text-neutral-400">Outstanding</th>
                        <th class="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Next Due</th>
                        <th class="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Status</th>
                        <th class="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">Disbursed</th>
                        <th class="px-4 py-3"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <tr
                        v-for="loan in loans"
                        :key="loan.id"
                        class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td class="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                            {{ loan.loan_no }}
                        </td>
                        <td class="px-4 py-3">
                            <div class="font-medium text-neutral-900 dark:text-white">{{ loan.member?.name ?? '—' }}</div>
                            <div class="text-xs text-neutral-400">{{ loan.member?.member_number ?? '' }}</div>
                        </td>
                        <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">{{ loan.loan_product?.name ?? '—' }}</td>
                        <td class="px-4 py-3 text-right font-medium text-neutral-900 dark:text-white">{{ fmt(loan.principal_formatted) }}</td>
                        <td class="px-4 py-3 text-right font-semibold"
                            :class="loan.status === 'arrears' ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'">
                            {{ fmt(loan.outstanding_balance_formatted) }}
                        </td>
                        <td class="px-4 py-3">
                            <div v-if="loan.next_due_date" class="flex items-center gap-1.5">
                                <Clock class="h-3.5 w-3.5 text-neutral-400" />
                                <span class="text-xs text-neutral-600 dark:text-neutral-400">{{ fmtDate(loan.next_due_date) }}</span>
                            </div>
                            <span v-else class="text-neutral-400 text-xs">—</span>
                        </td>
                        <td class="px-4 py-3">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                                :class="statusColor(loan.status)">
                                <CheckCircle2 v-if="loan.status === 'closed'" class="h-3 w-3" />
                                <AlertCircle v-else-if="loan.status === 'arrears'" class="h-3 w-3" />
                                {{ loan.status }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">{{ fmtDate(loan.disbursed_at) }}</td>
                        <td class="px-4 py-3">
                            <button
                                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                @click="router.push({ name: 'tenant-loan-account', params: { id: String(loan.id) } })">
                                View
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div v-if="meta.last_page > 1" class="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
            <span>Page {{ meta.current_page }} of {{ meta.last_page }} · {{ meta.total }} loans</span>
            <div class="flex gap-2">
                <button
                    :disabled="!hasPrev"
                    class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-neutral-700 dark:hover:bg-neutral-800"
                    @click="prevPage">
                    <ChevronLeft class="h-4 w-4" /> Prev
                </button>
                <button
                    :disabled="!hasNext"
                    class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-neutral-700 dark:hover:bg-neutral-800"
                    @click="nextPage">
                    Next <ChevronRight class="h-4 w-4" />
                </button>
            </div>
        </div>
    </div>
</template>
