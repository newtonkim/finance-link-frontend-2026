<script setup lang="ts">
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import type { LoanApplication } from '../../../apis/loans/loanApplicationsApi'

defineProps<{ application: LoanApplication }>()

const { displayAmount } = useLoanApplicationHelpers()
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Application Details</h2>
        <dl class="grid gap-4 sm:grid-cols-2">
            <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Member</dt>
                <dd class="mt-1 font-medium text-neutral-900 dark:text-white">{{ application.member?.name ?? '—' }}</dd>
                <dd v-if="application.member?.member_no" class="text-xs text-neutral-400 dark:text-neutral-500">{{ application.member.member_no }}</dd>
            </div>
            <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Loan Product</dt>
                <dd class="mt-1 font-medium text-neutral-900 dark:text-white">{{ application.loan_product?.name ?? '—' }}</dd>
                <dd v-if="application.loan_product?.code" class="text-xs text-neutral-400 dark:text-neutral-500">{{ application.loan_product.code }}</dd>
            </div>
            <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Requested Amount</dt>
                <dd class="mt-1 text-lg font-bold text-neutral-900 dark:text-white">{{ displayAmount(application.requested_amount_formatted, application.requested_amount) }}</dd>
            </div>
            <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Requested Term</dt>
                <dd class="mt-1 font-medium text-neutral-900 dark:text-white">{{ application.requested_term ?? '—' }} months</dd>
            </div>
            <div v-if="application.purpose" class="sm:col-span-2">
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Purpose</dt>
                <dd class="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{{ application.purpose }}</dd>
            </div>
            <div v-if="application.repayment_source" class="sm:col-span-2">
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Repayment Source</dt>
                <dd class="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{{ application.repayment_source }}</dd>
            </div>
            <div v-if="application.rejection_reason" class="sm:col-span-2">
                <dt class="text-xs font-medium uppercase tracking-wide text-red-400">Rejection Reason</dt>
                <dd class="mt-1 text-sm text-red-600 dark:text-red-400">{{ application.rejection_reason }}</dd>
            </div>
        </dl>
    </div>
</template>
