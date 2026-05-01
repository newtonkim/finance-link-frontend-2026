<script setup lang="ts">
import type { LoanApplication } from '../../../apis/loans/loanApplicationsApi'
import { formatCurrency, setLocalValues, } from '@/Global';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
defineProps<{ application: LoanApplication }>()
const columns = [
    { key: 'code', label: 'Code', copy: true, width: "20em" },
    { key: 'type', label: 'Type' },
    { key: 'name', label: 'Name' },
    { key: 'contribution', label: 'Amount' },
]
const myGroupsColumns = [
    { key: 'member_code', label: 'Member Code', copy: true, sticky: 'left' },
    { key: 'member_name', label: 'Member Name', sticky: 'left' },
    { key: 'group_code', label: 'Group Code', copy: true, sticky: 'left', width: "14em" },
    { key: 'group_name', label: 'Group Name', },
    { key: 'member_has_active_loan', label: 'Running Loan Balance', type: "money", width: "13em" },
    { key: 'actions', label: 'Actions', },
]
function navigateIntoLoanDetails(item: any) {
    router.push(`/tenant/loans/${item?.loan_id}`)
}
function navigateInGroupDetails(item: any) {
    router.push(`/tenant/group-savings/profile`)
    setLocalValues('groupProfile' as any, item)
}
function navigateToMemberProfile(item: any) {
    router.push(`/tenant/member/profile`)
    setLocalValues('memberProfile', { ...item, id: item?.member_id })
}
const filters = ["my group members", "Guarantors"], statusFilter = ref('my group members')
</script>

<template>
    <StatusButtonsHorizontal :filters="filters" v-model="statusFilter" />

    <template v-if="Object.values(application?.loan_guarantors ?? {}).length && statusFilter === 'Guarantors'">

        <Table :dataFilter="Object.values(application?.loan_guarantors ?? {})" :columns="columns" />
    </template>
    <template v-if="Object.values(application?.my_groups_member ?? {}).length && statusFilter === 'my group members'">

        <Table :dataFilter="Object.values(application?.my_groups_member ?? {})" :columns="myGroupsColumns">

            <template #member_has_active_loan="{ item }">
                <div class="text-sm text-neutral-800 dark:text-neutral-200 truncate flex items-center flex-wrap"
                    :class="item.loandetails?.length ? 'text-nfuko-danger/70' : 'text-nfuko-action'">
                    {{ item?.loandetails?.length ? "Active Loan :=>" : "No Active Loan" }}
                    {{ item?.loandetails?.length&&item?.loandetails.map((x: any) =>x.member_has_active_loan).join(", ") }}
                </div>
            </template>
            <template #actions="{ item }">
                <TabelActionButtons v-if="item?.loandetails?.length" @action="() => navigateIntoLoanDetails(item?.loandetails[0])"
                    title="loan details" color="danger" icon="CirclePile" />
                <TabelActionButtons v-else title="loan details" color="default" icon="CirclePile" />
            </template>

        </Table>
    </template>

    <div
        class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">

        <!-- Header -->
        <div class="flex items-center justify-between mb-4 border-b border-neutral-200 pb-2 dark:border-neutral-800">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">
                Application Details
            </h2>
        </div>

        <!-- Content -->
        <dl class="grid gap-3 sm:grid-cols-2">

            <!-- Member -->
            <div class="space-y-1">
                <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Member
                </dt>
                <dd class="text-sm font-semibold text-neutral-900 dark:text-white">
                    {{ application.member?.name ?? '—' }}
                </dd>
                <dd v-if="application.member?.member_no" class="text-xs text-neutral-500 dark:text-neutral-400">
                    {{ application.member.member_no }}
                </dd>
            </div>

            <!-- Loan Product -->
            <div class="space-y-1">
                <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Loan Product
                </dt>
                <dd class="text-sm font-semibold text-neutral-900 dark:text-white">
                    {{ application.loan_product?.name ?? '—' }}
                </dd>
                <dd v-if="application.loan_product?.code" class="text-xs text-neutral-500 dark:text-neutral-400">
                    {{ application.loan_product.code }}
                </dd>
            </div>

            <!-- Requested Amount -->
            <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Requested Amount
                </dt>
                <dd class="mt-1 text-[14px] font-bold text-primary-600 dark:text-primary-400">
                    {{ formatCurrency(application.requested_amount) }}
                    <!-- {{ formatCurrency(application.requested_amount_formatted, application.requested_amount) }} -->
                </dd>
            </div>

            <!-- Requested Term -->
            <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Requested Term
                </dt>
                <dd class="mt-1 text-base font-semibold text-neutral-900 dark:text-white">
                    {{ application.requested_term ?? '—' }}
                    <span class="text-sm text-neutral-500">months</span>
                </dd>
            </div>

            <!-- Purpose -->
            <div v-if="application.purpose" class="sm:col-span-2 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Purpose
                </dt>
                <dd class="mt-1 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {{ application.purpose }}
                </dd>
            </div>

            <!-- Repayment Source -->
            <div v-if="application.repayment_source"
                class="sm:col-span-2 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Repayment Source
                </dt>
                <dd class="mt-1 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {{ application.repayment_source }}
                </dd>
            </div>

            <!-- Rejection Reason -->
            <div v-if="application.rejection_reason"
                class="sm:col-span-2 p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <dt class="text-xs font-semibold uppercase tracking-wide text-red-500">
                    Rejection Reason
                </dt>
                <dd class="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
                    {{ application.rejection_reason }}
                </dd>
            </div>

        </dl>
    </div>


</template>
