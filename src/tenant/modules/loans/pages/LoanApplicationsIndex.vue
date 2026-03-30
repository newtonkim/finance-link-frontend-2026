<script setup lang="ts">
import { ref, computed } from 'vue'
import { HandCoins, Plus } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useLoanApplications } from '../composables/useLoanApplications'
import { useLoanAppraisalActions } from '../composables/useLoanAppraisalActions'
import type { LoanApplication } from '../../../apis/loans/loanApplicationsApi'
import LoanApplicationSummaryCards from '../components/LoanApplicationSummaryCards.vue'
import LoanApplicationFilters from '../components/LoanApplicationFilters.vue'
import LoanApplicationTable from '../components/LoanApplicationTable.vue'
import LoanInlineApprovalModals from '../components/LoanInlineApprovalModals.vue'

const router = useRouter()

const {
    applications, loading, filters, meta, visiblePages, perPage, products, branches, summary,
    fetch, fetchSummary, handleSearch, handleFilter, handlePageChange, changePerPage, clearFilters,
    openCreate, openEdit,
} = useLoanApplications()

const activeApplication = ref<LoanApplication | null>(null)

async function reloadList() {
    await fetch(meta.value.current_page)
    void fetchSummary()
}

const {
    showApproveModal, approving, approveComments, openApproveModal, submitApprove,
    showDeclineModal, declining, declineReason, declineError, openDeclineModal, submitDecline,
} = useLoanAppraisalActions(activeApplication, reloadList)

function openInlineApprove(app: LoanApplication) { activeApplication.value = app; openApproveModal() }
function openInlineDecline(app: LoanApplication) { activeApplication.value = app; openDeclineModal() }

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

        <LoanApplicationSummaryCards
            :summary="summary"
            :active-status="filters.status"
            @filter="filterByStatus"
        />

        <LoanApplicationFilters
            :filters="filters"
            :branches="branches"
            :products="products"
            @filter="handleFilter"
            @search="handleSearch"
            @clear="clearFilters"
        />

        <LoanApplicationTable
            :applications="applications"
            :loading="loading"
            :is-recommended-view="isRecommendedView"
            :meta="meta"
            :per-page="perPage"
            :visible-pages="visiblePages"
            @view="(app) => router.push({ name: 'tenant-loans-show', params: { id: app.id } })"
            @edit="openEdit"
            @approve="openInlineApprove"
            @decline="openInlineDecline"
            @reopen="reopenApplication"
            @page-change="handlePageChange"
            @per-page-change="changePerPage"
        />
    </div>

    <LoanInlineApprovalModals
        v-model:show-approve-modal="showApproveModal"
        v-model:approve-comments="approveComments"
        v-model:show-decline-modal="showDeclineModal"
        v-model:decline-reason="declineReason"
        :approving="approving"
        :declining="declining"
        :decline-error="declineError"
        :application-no="activeApplication?.application_no"
        @approve-submit="submitApprove"
        @decline-submit="submitDecline"
    />
</template>
