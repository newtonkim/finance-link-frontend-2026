<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
    Banknote, ChevronLeft, ChevronRight, ExternalLink,
    InboxIcon, Loader2,
} from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useLoanDisbursementQueue } from '../composables/useLoanDisbursementQueue'
import { useLoanDisbursement } from '../composables/useLoanDisbursement'
import LoanDisbursementDrawer from '../components/LoanDisbursementDrawer.vue'

const router = useRouter()

const {
    loading, items, meta,
    activeApplication, showDrawer,
    openDrawer, closeDrawer, onDisbursed,
    fetch,
} = useLoanDisbursementQueue()

const {
    disbursing, disburseForm, disburseErrors,
    submitDisburse,
} = useLoanDisbursement(activeApplication, onDisbursed)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatAmount(v: number | string | null | undefined) {
    if (v == null || v === '') return '—'
    return formatMoneyValue(v)
}

function formatDate(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function calcProcessingFee(app: typeof items.value[0]): number {
    const principal = Number(app.approved_amount ?? 0)
    const type = app.loan_product?.processing_fee_type ?? 'flat'
    const value = Number(app.loan_product?.processing_fee_value ?? 0)
    if (value <= 0) return 0
    return type === 'percentage' ? Math.round((principal * value / 100) * 100) / 100 : value
}

function calcNetDisbursement(app: typeof items.value[0]): number {
    return Math.round((Number(app.approved_amount ?? 0) - calcProcessingFee(app)) * 100) / 100
}

const hasPrev = computed(() => meta.current_page > 1)
const hasNext = computed(() => meta.current_page < meta.last_page)
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 md:p-6 dark:bg-[#0a0a0a]">

        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Banknote class="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Disbursement Queue</h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">
                        Approved applications awaiting finance disbursement.
                        <span v-if="!loading" class="font-medium text-emerald-700 dark:text-emerald-400">{{ meta.total }} pending</span>
                    </p>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center gap-2 py-16 text-sm text-neutral-400">
            <Loader2 class="h-5 w-5 animate-spin" />
            Loading queue…
        </div>

        <!-- Empty -->
        <div v-else-if="!items.length"
            class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-white py-20 dark:border-neutral-700 dark:bg-neutral-900">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                <InboxIcon class="h-7 w-7 text-emerald-400" />
            </div>
            <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">No applications pending disbursement</p>
            <p class="text-xs text-neutral-400 dark:text-neutral-500">Approved applications will appear here once the credit committee has voted.</p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="border-b border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/60">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Application</th>
                            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Member</th>
                            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Product</th>
                            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Approved</th>
                            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Deductions</th>
                            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Net to Member</th>
                            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Approved On</th>
                            <th class="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                        <tr v-for="app in items" :key="app.id"
                            class="group hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-2">
                                    <span class="font-mono text-xs font-medium text-neutral-700 dark:text-neutral-300">{{ app.application_no }}</span>
                                    <button
                                        class="opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Open application"
                                        @click="router.push({ name: 'tenant-loans-show', params: { id: app.id } })">
                                        <ExternalLink class="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" />
                                    </button>
                                </div>
                            </td>
                            <td class="px-4 py-3">
                                <p class="font-medium text-neutral-900 dark:text-white">{{ app.member?.name ?? '—' }}</p>
                                <p v-if="app.member?.member_no" class="text-xs text-neutral-400 dark:text-neutral-500">{{ app.member.member_no }}</p>
                            </td>
                            <td class="px-4 py-3 text-neutral-700 dark:text-neutral-300">{{ app.loan_product?.name ?? '—' }}</td>
                            <td class="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-white">
                                {{ app.approved_amount_formatted ?? formatAmount(app.approved_amount) }}
                            </td>
                            <td class="px-4 py-3 text-right text-neutral-500 dark:text-neutral-400">
                                <template v-if="calcProcessingFee(app) > 0">
                                    <span class="text-amber-600 dark:text-amber-400">−{{ formatAmount(calcProcessingFee(app)) }}</span>
                                    <p class="text-xs text-neutral-400 dark:text-neutral-500">processing fee</p>
                                </template>
                                <span v-else class="text-neutral-400">—</span>
                            </td>
                            <td class="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                {{ formatAmount(calcNetDisbursement(app)) }}
                            </td>
                            <td class="px-4 py-3 text-neutral-500 dark:text-neutral-400">{{ formatDate(app.approved_at) }}</td>
                            <td class="px-4 py-3 text-right">
                                <button
                                    class="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                                    @click="openDrawer(app)">
                                    <Banknote class="h-3.5 w-3.5" />
                                    Disburse
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div v-if="meta.last_page > 1"
                class="flex items-center justify-between border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                    Page {{ meta.current_page }} of {{ meta.last_page }} · {{ meta.total }} total
                </p>
                <div class="flex gap-1">
                    <button :disabled="!hasPrev"
                        class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                        @click="fetch(meta.current_page - 1)">
                        <ChevronLeft class="h-4 w-4" />
                    </button>
                    <button :disabled="!hasNext"
                        class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                        @click="fetch(meta.current_page + 1)">
                        <ChevronRight class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Confirmation drawer (teleported) -->
    <LoanDisbursementDrawer
        :application="activeApplication"
        :open="showDrawer"
        :disbursing="disbursing"
        v-model:form="disburseForm"
        :errors="disburseErrors"
        @close="closeDrawer"
        @submit="submitDisburse"
    />
</template>
