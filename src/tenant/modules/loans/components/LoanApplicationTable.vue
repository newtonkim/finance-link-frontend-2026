<script setup lang="ts">
import { Eye, Pencil, RotateCcw, ThumbsUp, ThumbsDown, HandCoins, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import type { LoanApplication } from '../../../apis/loans/loanApplicationsApi'

defineProps<{
    applications: LoanApplication[]
    loading: boolean
    isRecommendedView: boolean
    meta: { total: number; from?: number; to?: number; current_page: number; last_page: number }
    perPage: number
    visiblePages: (number | null)[]
}>()

const emit = defineEmits<{
    view: [app: LoanApplication]
    edit: [app: LoanApplication]
    approve: [app: LoanApplication]
    decline: [app: LoanApplication]
    reopen: [id: number]
    pageChange: [page: number]
    perPageChange: [n: number]
}>()

const { statusBadgeClass, statusLabel, displayAmount, formatDate } = useLoanApplicationHelpers()

function daysPendingClass(days: number) {
    if (days >= 15) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    if (days >= 8) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    if (days >= 4) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    return 'text-neutral-500 dark:text-neutral-400'
}
</script>

<template>
    <div
        class="rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">

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
        </div>

        <!-- Mobile cards -->
        <div v-else class="divide-y divide-neutral-50 dark:divide-neutral-800 sm:hidden">
            <div v-for="app in applications" :key="app.id"
                class="flex flex-col gap-2 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                        <p class="font-mono text-xs font-semibold text-neutral-900 dark:text-white">{{
                            app.application_no ?? '—' }}</p>
                        <p class="mt-0.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{{
                            app.member?.name ?? '—' }}</p>
                        <p v-if="app.member?.member_no" class="text-xs text-neutral-400 dark:text-neutral-500">{{
                            app.member.member_no }}</p>
                    </div>
                    <span
                        class="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                        :class="statusBadgeClass(app.status)">
                        {{ statusLabel(app.status) }}
                    </span>
                </div>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <span>{{ app.loan_product?.name ?? '—' }}</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{
                        displayAmount(app.requested_amount_formatted, app.requested_amount) }}</span>
                    <span v-if="app.requested_term">{{ app.requested_term }}mo</span>
                    <span v-if="app.submitted_at">{{ formatDate(app.submitted_at) }}</span>
                    <span v-if="app.days_pending != null"
                        class="inline-flex items-center rounded-full px-2 py-0.5 font-medium"
                        :class="daysPendingClass(app.days_pending)">{{ app.days_pending }}d</span>
                </div>
                <div class="flex items-center gap-1 pt-1">
                    <button
                        class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        @click="emit('view', app)">
                        <Eye class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                    </button>
                    <template v-if="app.status === 'recommended'">
                        <button
                            class="flex h-8 w-8 items-center justify-center rounded-lg text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
                            @click="emit('approve', app)">
                            <ThumbsUp class="h-4 w-4" />
                        </button>
                        <button
                            class="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                            @click="emit('decline', app)">
                            <ThumbsDown class="h-4 w-4" />
                        </button>
                    </template>
                    <button v-if="app.status === 'draft'"
                        class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        @click="emit('edit', app)">
                        <Pencil class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                    </button>
                    <button v-if="app.status === 'cancelled'"
                        class="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
                        @click="emit('reopen', app.id!)">
                        <RotateCcw class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Desktop table -->
        <table v-if="!loading && applications.length > 0" class="hidden w-full text-sm sm:table">
            <thead class="border-b border-neutral-100 dark:border-neutral-800">
                <tr
                    class="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    <th class="px-6 py-3">Application No</th>
                    <th class="px-6 py-3">Member</th>
                    <th class="px-6 py-3">Product</th>
                    <th class="px-6 py-3 text-right">Requested</th>
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
                <tr v-for="app in applications" :key="app.id"
                    class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td class="px-6 py-4 font-mono text-xs font-medium text-neutral-900 dark:text-white">{{
                        app.application_no
                        ?? '—' }}</td>
                    <td class="px-6 py-4">
                        <div class="font-medium text-neutral-900 dark:text-white">{{ app.member?.name ?? '—' }}</div>
                        <div v-if="app.member?.member_no" class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                            {{
                            app.member.member_no }}</div>
                    </td>
                    <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ app.loan_product?.name ?? '—' }}
                    </td>
                    <td class="px-6 py-4 text-right font-medium text-neutral-900 dark:text-white">
                        {{ displayAmount(app.requested_amount_formatted, app.requested_amount) }}
                        <div v-if="app.requested_term" class="text-xs text-neutral-400">{{ app.requested_term }}mo</div>
                    </td>

                    <template v-if="isRecommendedView">
                        <td class="px-6 py-4 text-right">
                            <span class="font-medium text-purple-700 dark:text-purple-300">{{
                                displayAmount(app.recommended_amount_formatted, app.recommended_amount) }}</span>
                            <div v-if="app.recommended_term" class="text-xs text-neutral-400">{{ app.recommended_term
                                }}mo</div>
                        </td>
                        <td class="px-6 py-4 text-right text-neutral-500 dark:text-neutral-400">{{
                            displayAmount(app.loan_product?.max_amount_formatted, app.loan_product?.max_amount) }}</td>
                        <td class="px-6 py-4 text-center">
                            <span v-if="app.risk_rating"
                                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                                :class="{
                                    'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400': app.risk_rating === 'low',
                                    'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': app.risk_rating === 'medium',
                                    'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': app.risk_rating === 'high',
                                    'bg-red-100 text-red-900 dark:bg-red-900/50 dark:text-red-300': app.risk_rating === 'critical',
                                }">{{ app.risk_rating }}</span>
                            <span v-else class="text-neutral-400">—</span>
                        </td>
                        <td class="px-6 py-4 text-center text-neutral-500 dark:text-neutral-400 text-xs">{{
                            app.approvals_count ?? 0 }} cast</td>
                    </template>
                    <template v-else>
                        <td class="px-6 py-4 text-right text-neutral-600 dark:text-neutral-400">{{
                            displayAmount(app.approved_amount_formatted, app.approved_amount) }}</td>
                        <td class="px-6 py-4">
                            <span
                                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                                :class="statusBadgeClass(app.status)">
                                {{ statusLabel(app.status) }}
                            </span>
                        </td>
                    </template>

                    <td class="px-6 py-4 text-neutral-500 dark:text-neutral-400">{{ formatDate(app.submitted_at) }}</td>
                    <td class="px-6 py-4 text-center">
                        <span v-if="app.days_pending != null"
                            class="inline-flex min-w-[2rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium"
                            :class="daysPendingClass(app.days_pending)">
                            {{ app.days_pending }}
                        </span>
                        <span v-else class="text-neutral-400 dark:text-neutral-500">—</span>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center justify-end gap-1">
                            <button
                                class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                title="View" @click="emit('view', app)">
                                <Eye class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                            </button>
                            <template v-if="app.status === 'recommended'">
                                <button
                                    class="flex h-8 w-8 items-center justify-center rounded-lg text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
                                    title="Approve" @click="emit('approve', app)">
                                    <ThumbsUp class="h-4 w-4" />
                                </button>
                                <button
                                    class="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                                    title="Decline" @click="emit('decline', app)">
                                    <ThumbsDown class="h-4 w-4" />
                                </button>
                            </template>
                            <button v-if="app.status === 'draft'"
                                class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                title="Edit" @click="emit('edit', app)">
                                <Pencil class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                            </button>
                            <button v-if="app.status === 'cancelled'"
                                class="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
                                title="Reopen as Draft" @click="emit('reopen', app.id!)">
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
        <div class="flex items-center gap-3">
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
                <span v-if="meta.from && meta.to">
                    Showing <span class="font-medium text-neutral-700 dark:text-neutral-200">{{ meta.from }}–{{ meta.to
                        }}</span> of
                </span>
                <span class="font-medium text-neutral-700 dark:text-neutral-200">{{ meta.total }}</span>
                {{ meta.total === 1 ? 'application' : 'applications' }}
            </p>
            <div class="flex items-center gap-1.5">
                <label class="text-xs text-neutral-400 dark:text-neutral-500">Rows</label>
                <select :value="perPage"
                    class="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    @change="emit('perPageChange', Number(($event.target as HTMLSelectElement).value))">
                    <option v-for="n in [10, 15, 20, 25, 30, 40, 50]" :key="n" :value="n">{{ n }}</option>
                </select>
            </div>
        </div>

        <div v-if="meta.last_page > 1" class="flex items-center gap-1">
            <button :disabled="meta.current_page === 1"
                class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                @click="emit('pageChange', meta.current_page - 1)">
                <ChevronLeft class="h-4 w-4" />
            </button>
            <template v-for="(p, i) in visiblePages" :key="i">
                <span v-if="p === null"
                    class="flex h-8 w-6 items-end justify-center pb-1 text-sm text-neutral-400 dark:text-neutral-600">…</span>
                <button v-else
                    class="flex h-8 min-w-8 items-center justify-center rounded-lg px-1 text-sm font-medium transition-colors"
                    :class="p === meta.current_page ? 'bg-nfuko-primary text-white shadow-sm dark:bg-bg-nfuko-yellow dark:text-black' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'"
                    @click="emit('pageChange', p)">{{ p }}</button>
            </template>
            <button :disabled="meta.current_page === meta.last_page"
                class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                @click="emit('pageChange', meta.current_page + 1)">
                <ChevronRight class="h-4 w-4" />
            </button>
        </div>
    </div>
</template>
