<script setup lang="ts">
import { onMounted, ref, computed, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'

import { useTenantUserStore } from '@/stores/tenantUserStore'
import { useLoanAccount } from '../composables/useLoanAccount'
import { useLoanDetailHelpers } from '../composables/useLoanDetailHelpers'
import { useLoanScheduleData } from '../composables/useLoanScheduleData'
import { useLoanAmountComputeds } from '../composables/useLoanAmountComputeds'
import { useLoanChargesPenalties } from '../composables/useLoanChargesPenalties'
import { useLoanRepaymentFlows } from '../composables/useLoanRepaymentFlows'
import { useLoanPdfExport } from '../composables/useLoanPdfExport'
import { useGeneralLoanSettings } from '../../settings/composables/useGeneralLoanSettings'

import ReceiveCashModal from '../components/ReceiveCashModal.vue'
import LoanDocumentUploader from '../components/LoanDocumentUploader.vue'
import RepayFromSavingsModal from '../components/RepayFromSavingsModal.vue'
import LoanAuditTrail from '../components/LoanAuditTrail.vue'
import LoanTopupModal from '../components/LoanTopupModal.vue'
import LoanRescheduleDrawer from '../components/LoanRescheduleDrawer.vue'
import LoanScheduleTabPanel from '../components/LoanScheduleTabPanel.vue'
import LoanChargesTabPanel from '../components/LoanChargesTabPanel.vue'
import LoanGeneralInfoTabPanel from '../components/LoanGeneralInfoTabPanel.vue'
import LoanTransactionsTabPanel from '../components/LoanTransactionsTabPanel.vue'
import LoanReschedulesTabPanel from '../components/LoanReschedulesTabPanel.vue'
import LoanBeforeTopupTabPanel from '../components/LoanBeforeTopupTabPanel.vue'
import LoanDetailHeader from '../components/LoanDetailHeader.vue'

const route = useRoute()
const router = useRouter()
const userStore = useTenantUserStore()

const parsedLoanId = Number(route.params.id)
const loanId = Number.isFinite(parsedLoanId) && parsedLoanId > 0 ? parsedLoanId : null

if (loanId === null) {
  router.replace({ name: 'tenant-active-loans' })
}

const {
  loading,
  loan,
  schedule,
  repayments,
  repaymentsMeta,
  activeTab,
  refresh,
  fetchRepayments,
  activities,
  reschedules,
} = useLoanAccount(loanId)

const { fmt, toNumber, fmtDate, statusColor, generalStatusColor, scheduleStatusColor } =
  useLoanDetailHelpers()

const {
  latestReschedule,
  oldStatusLabel,
  oldStatusClass,
  filteredSchedule,
  scheduleTotals,
  canShowMore,
  tabs,
} = useLoanScheduleData(loan, schedule, reschedules)

const {
  currency,
  principalDisplay,
  outstandingDisplay,
  totalOutstandingDisplay,
  netDisbursedDisplay,
  totalAmountPaidDisplay,
  interestMethodLabel,
  repaidPercent,
} = useLoanAmountComputeds(loan, schedule, scheduleTotals)

const {
  disbursementCharges,
  repaymentCharges,
  totalChargesAmount,
  totalChargesCollected,
  totalChargesRemaining,
  arrearsRows,
  totalPenaltyAccrued,
  totalPenaltyPaid,
  totalPenaltyOutstanding,
  totalProductCharges,
  penaltyRuleLabel,
} = useLoanChargesPenalties(loan, schedule, scheduleTotals, currency)

const {
  receiveCashModalRef,
  showReceiveCashModal,
  isPostingCash,
  selectedInstallment,
  allocationOrderDisplay,
  openReceiveCash,
  handleReceiveCashSubmit,
  savingsRepayModalRef,
  showSavingsRepayModal,
  isPostingSavings,
  selectedSavingsInstallment,
  openSavingsRepayment,
  handleSavingsRepaySubmit,
} = useLoanRepaymentFlows(loan, refresh)

const { form: settings, fetchSettings: fetchLoanSettings } = useGeneralLoanSettings()

const { printGeneralInfo, exportGeneralInfoPdf } = useLoanPdfExport(
  loan,
  latestReschedule,
  oldStatusLabel,
  principalDisplay,
  netDisbursedDisplay,
  outstandingDisplay,
)

onMounted(() => {
  if (!userStore.user) userStore.load()
  void fetchLoanSettings()
})

const rescheduleDrawerOpen = ref(false)
const topupModalRef = ref<null | { show: () => void }>(null)

const handleTopup = () => topupModalRef.value?.show()
const handleReschedule = () => (rescheduleDrawerOpen.value = true)

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'tenant-active-loans' })
}

const productCharges = computed(() => loan.value?.loan_product?.charges ?? [])

const panelMap = {
  general: markRaw(LoanGeneralInfoTabPanel),
  schedule: markRaw(LoanScheduleTabPanel),
  reschedules: markRaw(LoanReschedulesTabPanel),
  'before-topup': markRaw(LoanBeforeTopupTabPanel),
  transactions: markRaw(LoanTransactionsTabPanel),
  charges: markRaw(LoanChargesTabPanel),
}

const activeComponent = computed(() => {
  return panelMap[activeTab.value as keyof typeof panelMap] || null
})
</script>

<template>
  <div class="px-4 py-6 sm:px-6 lg:px-8 space-y-5">
    <div class="flex items-center gap-3">
      <button
        class="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="h-4 w-4" />
        Loan Portfolio
      </button>
    </div>

    <div v-if="loading && !loan" class="flex items-center justify-center py-16 gap-2 text-neutral-400">
      <Loader2 class="h-5 w-5 animate-spin" />
    </div>

    <template v-else-if="loan">
      <LoanDetailHeader
        v-if="loan"
        :loan="loan"
        :status-color="statusColor"
        :fmt-date="fmtDate"
        :interest-method-label="interestMethodLabel"
        :principal-display="principalDisplay"
        :net-disbursed-display="netDisbursedDisplay"
        :outstanding-display="outstandingDisplay"
        :total-outstanding-display="totalOutstandingDisplay"
        :total-amount-paid-display="totalAmountPaidDisplay"
        :repaid-percent="repaidPercent"
        :can-topup="settings.allow_top_up"
        @topup="handleTopup"
        @reschedule="handleReschedule"
      />

      <div class="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
        <nav class="-mb-px flex overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 uppercase tracking-wider whitespace-nowrap"
            :class="activeTab === tab.key ? 'border-emerald-600 text-emerald-700 bg-white dark:text-emerald-400 dark:border-emerald-400 dark:bg-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-200'"
            @click="activeTab = tab.key"
          >
            <component :is="tab.icon" class="h-3.5 w-3.5" />
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <div class="mt-4">
        <transition mode="out-in">
          <component
            :is="activeComponent"
            :key="activeTab"
            v-if="activeComponent"
            :loan="loan"
            :schedule="schedule"
            :filtered-schedule="filteredSchedule"
            :schedule-totals="scheduleTotals"
            :reschedules="reschedules"
            :repayments="repayments"
            :repayments-meta="repaymentsMeta"
            :latest-reschedule="latestReschedule"
            :old-status-label="oldStatusLabel"
            :old-status-class="oldStatusClass"
            :principal-display="principalDisplay"
            :net-disbursed-display="netDisbursedDisplay"
            :outstanding-display="outstandingDisplay"
            :interest-method-label="interestMethodLabel"
            :currency="currency"
            :fmt="fmt"
            :fmt-date="fmtDate"
            :to-number="toNumber"
            :general-status-color="generalStatusColor"
            :schedule-status-color="scheduleStatusColor"
            :print-general-info="printGeneralInfo"
            :export-general-info-pdf="exportGeneralInfoPdf"
            :refresh="refresh"
            :can-show-more="canShowMore"
            :disbursement-charges="disbursementCharges"
            :repayment-charges="repaymentCharges"
            :total-charges-amount="totalChargesAmount"
            :total-charges-collected="totalChargesCollected"
            :total-charges-remaining="totalChargesRemaining"
            :arrears-rows="arrearsRows"
            :total-penalty-accrued="totalPenaltyAccrued"
            :total-penalty-paid="totalPenaltyPaid"
            :total-penalty-outstanding="totalPenaltyOutstanding"
            :total-product-charges="totalProductCharges"
            :penalty-rule-label="penaltyRuleLabel"
            :charge-deduction-mode="loan?.charge_deduction_mode"
            :applied-charges-length="loan?.applied_charges?.length ?? 0"
            :product-charges="productCharges"
            @open-receive-cash="openReceiveCash"
            @open-savings-repayment="openSavingsRepayment"
            @fetch-repayments="fetchRepayments"
          />
          <div v-else-if="activeTab === 'documents'" key="documents" class="p-5">
            <LoanDocumentUploader
              v-if="loan?.loan_application_id"
              :application-id="loan.loan_application_id"
              :editable="false"
              :current-stage="'disbursed'"
              @updated="refresh"
            />
          </div>

          <div v-else-if="activeTab === 'activities'" key="activities" class="p-4">
            <LoanAuditTrail :timeline="activities" :loading="loading" />
          </div>
        </transition>
      </div>
    </template>
  </div>

  <ReceiveCashModal
    ref="receiveCashModalRef"
    :open="showReceiveCashModal"
    :posting="isPostingCash"
    :teller-name="userStore.user?.name ?? '—'"
    :borrower-name="loan?.member?.name ?? '—'"
    :installment-amount="selectedInstallment ? (Number(selectedInstallment.principal_due || 0) + Number(selectedInstallment.interest_due || 0) + Number(selectedInstallment.charges_due || 0) + Number(selectedInstallment.penalty_due || 0)) - (Number(selectedInstallment.principal_paid || 0) + Number(selectedInstallment.interest_paid || 0) + Number(selectedInstallment.charges_paid || 0) + Number(selectedInstallment.penalty_paid || 0)) : 0"
    :currency="currency"
    :allocation-order-label="allocationOrderDisplay.label"
    :allocation-order-sequence="allocationOrderDisplay.sequence"
    :penalty-charges="selectedInstallment ? Number(selectedInstallment.charges_due || 0) - Number(selectedInstallment.charges_paid || 0) + (Number(selectedInstallment.penalty_due || 0) - Number(selectedInstallment.penalty_paid || 0)) : 0"
    :pending-interest="selectedInstallment ? Number(selectedInstallment.interest_due || 0) - Number(selectedInstallment.interest_paid || 0) : 0"
    :pending-principal="selectedInstallment ? Number(selectedInstallment.principal_due || 0) - Number(selectedInstallment.principal_paid || 0) : 0"
    @close="showReceiveCashModal = false"
    @submit="handleReceiveCashSubmit"
  />

  <RepayFromSavingsModal
    ref="savingsRepayModalRef"
    :open="showSavingsRepayModal"
    :posting="isPostingSavings"
    :member-name="loan?.member?.name ?? '—'"
    :currency="currency"
    :installment-amount="selectedSavingsInstallment ? (Number(selectedSavingsInstallment.principal_due || 0) + Number(selectedSavingsInstallment.interest_due || 0) + Number(selectedSavingsInstallment.charges_due || 0) + Number(selectedSavingsInstallment.penalty_due || 0)) - (Number(selectedSavingsInstallment.principal_paid || 0) + Number(selectedSavingsInstallment.interest_paid || 0) + Number(selectedSavingsInstallment.charges_paid || 0) + Number(selectedSavingsInstallment.penalty_paid || 0)) : 0"
    :allocation-order-label="allocationOrderDisplay.label"
    :allocation-order-sequence="allocationOrderDisplay.sequence"
    :penalty-charges="selectedSavingsInstallment ? Number(selectedSavingsInstallment.charges_due || 0) - Number(selectedSavingsInstallment.charges_paid || 0) + (Number(selectedSavingsInstallment.penalty_due || 0) - Number(selectedSavingsInstallment.penalty_paid || 0)) : 0"
    :pending-interest="selectedSavingsInstallment ? Number(selectedSavingsInstallment.interest_due || 0) - Number(selectedSavingsInstallment.interest_paid || 0) : 0"
    :pending-principal="selectedSavingsInstallment ? Number(selectedSavingsInstallment.principal_due || 0) - Number(selectedSavingsInstallment.principal_paid || 0) : 0"
    :member-id="loan?.member_id ?? null"
    @close="showSavingsRepayModal = false"
    @submit="handleSavingsRepaySubmit"
  />

  <LoanTopupModal ref="topupModalRef" :loan="loan" />
  <LoanRescheduleDrawer v-model:open="rescheduleDrawerOpen" :loan="loan" @success="refresh" />
</template>
