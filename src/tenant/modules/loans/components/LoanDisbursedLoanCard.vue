<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import type { DisbursedLoan } from '../../../apis/loans/loanApplicationsApi'

const props = defineProps<{
    loan: DisbursedLoan
    loanApplicationId: number | null | undefined
}>()

const router = useRouter()
const { formatAmount, formatDate } = useLoanApplicationHelpers()
const showAllSchedule = ref(false)
</script>

<template>
    <div class="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-900/10">
        <div class="mb-4 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
                <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                    <CreditCard class="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                    <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Loan Account</h2>
                    <p class="text-xs text-emerald-600 dark:text-emerald-400">{{ loan.loan_no }}</p>
                </div>
            </div>
            <button
                class="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                @click="router.push({ name: 'tenant-loan-account', params: { id: loan.id } })">
                <CreditCard class="h-3.5 w-3.5" />
                View Loan Account
            </button>
        </div>
        <dl class="grid gap-4 sm:grid-cols-2">
            <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Principal</dt>
                <dd class="mt-1 text-lg font-bold text-neutral-900 dark:text-white">
                    {{ loan.principal_formatted ?? formatAmount(loan.principal) }}
                </dd>
            </div>
            <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Net Disbursed</dt>
                <dd class="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {{ loan.net_disbursed_amount_formatted ?? formatAmount(loan.net_disbursed_amount) }}
                </dd>
            </div>
            <div v-if="Number(loan.processing_fee) > 0">
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Processing Fee</dt>
                <dd class="mt-1 font-medium text-neutral-700 dark:text-neutral-300">
                    {{ loan.processing_fee_formatted ?? formatAmount(loan.processing_fee) }}
                </dd>
            </div>
            <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Interest Rate</dt>
                <dd class="mt-1 font-medium text-neutral-700 dark:text-neutral-300">{{ loan.interest_rate }}%</dd>
            </div>
            <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Term</dt>
                <dd class="mt-1 font-medium text-neutral-700 dark:text-neutral-300">{{ loan.term_months }} months</dd>
            </div>
            <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Disbursement Method</dt>
                <dd class="mt-1 font-medium capitalize text-neutral-700 dark:text-neutral-300">
                    {{ loan.disbursement_method?.replace(/_/g, ' ') ?? '—' }}
                </dd>
            </div>
            <div v-if="loan.disbursement_reference">
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Reference</dt>
                <dd class="mt-1 font-medium text-neutral-700 dark:text-neutral-300">{{ loan.disbursement_reference }}</dd>
            </div>
            <div v-if="loan.disbursed_by_staff">
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Disbursed By</dt>
                <dd class="mt-1 font-medium text-neutral-700 dark:text-neutral-300">{{ loan.disbursed_by_staff.name }}</dd>
            </div>
        </dl>

        <!-- Repayment Schedule -->
        <div v-if="loan.schedules?.length" class="mt-5">
            <div class="mb-3 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Repayment Schedule</h3>
                <span class="text-xs text-neutral-400 dark:text-neutral-500">{{ loan.schedules.length }} installments</span>
            </div>
            <div class="overflow-x-auto rounded-xl border border-neutral-100 dark:border-neutral-800">
                <table class="w-full text-xs">
                    <thead class="bg-neutral-50 dark:bg-neutral-800/60">
                        <tr>
                            <th class="px-3 py-2.5 text-left font-medium text-neutral-500 dark:text-neutral-400">#</th>
                            <th class="px-3 py-2.5 text-left font-medium text-neutral-500 dark:text-neutral-400">Due Date</th>
                            <th class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400">Principal</th>
                            <th class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400">Interest</th>
                            <th class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400">Total</th>
                            <th class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400">Balance</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                        <tr v-for="row in (showAllSchedule ? loan.schedules : loan.schedules.slice(0, 6))"
                            :key="row.installment_no"
                            class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                            <td class="px-3 py-2 text-neutral-500 dark:text-neutral-400">{{ row.installment_no }}</td>
                            <td class="px-3 py-2 text-neutral-700 dark:text-neutral-300">{{ formatDate(row.due_date) }}</td>
                            <td class="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">{{ formatAmount(row.principal_due) }}</td>
                            <td class="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">{{ formatAmount(row.interest_due) }}</td>
                            <td class="px-3 py-2 text-right font-medium text-neutral-900 dark:text-white">{{ formatAmount(row.total_due) }}</td>
                            <td class="px-3 py-2 text-right text-neutral-500 dark:text-neutral-400">{{ formatAmount(row.outstanding_balance) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <button v-if="loan.schedules.length > 6"
                class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-100 py-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50"
                @click="showAllSchedule = !showAllSchedule">
                <template v-if="showAllSchedule">
                    <ChevronUp class="h-3.5 w-3.5" /> Show less
                </template>
                <template v-else>
                    <ChevronDown class="h-3.5 w-3.5" />
                    Show all {{ loan.schedules.length }} installments
                </template>
            </button>
        </div>
    </div>
</template>
