<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  TrendingDown,
  ClipboardList,
  History,
  CreditCard,
  BookOpen,
  Eye,
  CircleMinus,
  FileText,
  Activity,
  AlertTriangle,
  Wallet,
} from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Global/ui/dropdown-menu'
import { formatMoneyValue } from '@/Global'
import { useTenantUserStore } from '@/stores/tenantUserStore'
import { loanSettingsApi } from '@/tenant/apis/settings/loanSettingsApi'
import { useLoanAccount } from '../composables/useLoanAccount'
import ReceiveCashModal from '../components/ReceiveCashModal.vue'
import LoanDocumentUploader from '../components/LoanDocumentUploader.vue'
import RepayFromSavingsModal from '../components/RepayFromSavingsModal.vue'
import LoanAuditTrail from '../components/LoanAuditTrail.vue'
import { loansApi } from '@/tenant/apis/loans/loansApi'

const route = useRoute()
const router = useRouter()

const parsedLoanId = Number(route.params.id)
const loanId = Number.isFinite(parsedLoanId) && parsedLoanId > 0 ? parsedLoanId : null

if (loanId === null) {
  router.replace({ name: 'tenant-active-loans' })
}

const { loading, loan, schedule, repayments, repaymentsMeta, activeTab, refresh, fetchRepayments, activities } =
  useLoanAccount(loanId)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: number | string | null | undefined) {
  if (v == null || v === '') return '—'
  return formatMoneyValue(v)
}

function toNumber(v: number | string | null | undefined): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const cleaned = String(v)
    .trim()
    .replace(/[^0-9.-]/g, '')
  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function statusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'arrears':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'closed':
      return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
    default:
      return 'bg-neutral-100 text-neutral-500'
  }
}

function generalStatusColor(status: string) {
  if (status === 'closed') {
    return 'bg-nfuko-primary text-white'
  }
  return statusColor(status)
}

function scheduleStatusColor(s: string) {
  switch (s) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'arrears':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'partial':
    case 'partial_pay':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'pending':
      return 'bg-red-900 text-white dark:bg-red-950 dark:text-red-100'
    default:
      return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
  }
}

const tabs = [
  { key: 'schedule', label: 'Payment Schedule', icon: ClipboardList },
  { key: 'transactions', label: 'Transaction History', icon: History },
  { key: 'general', label: 'General Information', icon: CreditCard },
  { key: 'charges', label: 'Charges & Penalties', icon: AlertTriangle },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'activities', label: 'Loan Activities', icon: Activity },
] as const

const showAllSchedule = ref(false)

const scheduleTotals = computed(() => {
  return schedule.value.reduce(
    (acc, row) => {
      acc.principal_due += Number(row.principal_due) || 0
      acc.interest_due += Number(row.interest_due) || 0
      acc.charges_due += Number(row.charges_due) || 0
      acc.penalty_due += Number(row.penalty_due) || 0
      acc.total_due += Number(row.total_due) || 0
      acc.total_paid +=
        (Number(row.principal_paid) || 0) +
        (Number(row.interest_paid) || 0) +
        (Number(row.penalty_paid) || 0) +
        (Number(row.charges_paid) || 0)
      acc.outstanding += Number(row.outstanding_balance) || 0
      return acc
    },
    {
      principal_due: 0,
      interest_due: 0,
      charges_due: 0,
      penalty_due: 0,
      total_due: 0,
      total_paid: 0,
      outstanding: 0,
    },
  )
})

const hasPrevRepayments = computed(() => repaymentsMeta.value.current_page > 1)
const hasNextRepayments = computed(
  () => repaymentsMeta.value.current_page < repaymentsMeta.value.last_page,
)

const currency = computed(() => loan.value?.currency_code || 'PHP')

const principalAmount = computed(() => {
  if (!loan.value) return 0
  return toNumber(loan.value.principal) ?? scheduleTotals.value.principal_due ?? 0
})

const outstandingAmount = computed(() => {
  if (!loan.value) return 0
  const fromLoan = toNumber(loan.value.outstanding_balance)
  if (fromLoan != null) return fromLoan
  const lastScheduleBalance = schedule.value.length
    ? toNumber(schedule.value[schedule.value.length - 1]?.outstanding_balance)
    : null
  return lastScheduleBalance ?? 0
})

const netDisbursedAmount = computed(() => {
  if (!loan.value) return 0
  const fromLoan = toNumber(loan.value.net_disbursed_amount)
  if (fromLoan != null) return fromLoan
  const fee = toNumber(loan.value.processing_fee) ?? 0
  return Math.max(0, principalAmount.value - fee)
})

const principalDisplay = computed(() => formatMoneyValue(principalAmount.value))
const outstandingDisplay = computed(() => formatMoneyValue(outstandingAmount.value))
const netDisbursedDisplay = computed(() => formatMoneyValue(netDisbursedAmount.value))
const totalAmountPaid = computed(() => {
  const schedulePaid = scheduleTotals.value.total_paid
  if (schedulePaid > 0) return schedulePaid
  return Math.max(0, principalAmount.value - outstandingAmount.value)
})
const totalAmountPaidDisplay = computed(() => formatMoneyValue(totalAmountPaid.value))
const interestMethodLabel = computed(() => {
  const method = loan.value?.loan_product?.interest_method
  if (!method) return 'Interest Method'
  return method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
})

// Computed progress for the repayment progress bar
const repaidPercent = computed(() => {
  if (!loan.value) return 0
  if (principalAmount.value <= 0) return 0
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(((principalAmount.value - outstandingAmount.value) / principalAmount.value) * 100),
    ),
  )
})

// ─── Charges & Penalties computed ─────────────────────────────────────────────
const disbursementCharges = computed(() =>
  (loan.value?.applied_charges ?? []).filter((c) => c.application_timing === 'on_disbursement'),
)
const repaymentCharges = computed(() =>
  (loan.value?.applied_charges ?? []).filter((c) => c.application_timing !== 'on_disbursement'),
)
const totalChargesAmount = computed(() =>
  (loan.value?.applied_charges ?? []).reduce((s, c) => s + Number(c.charge_amount), 0),
)
const totalChargesCollected = computed(() =>
  (loan.value?.applied_charges ?? []).reduce((s, c) => s + Number(c.used_amount), 0),
)
const totalChargesRemaining = computed(() =>
  (loan.value?.applied_charges ?? []).reduce((s, c) => s + Number(c.remaining_amount), 0),
)

const arrearsRows = computed(() =>
  schedule.value.filter((r) => r.is_overdue || Number(r.penalty_due) > 0),
)
const totalPenaltyAccrued = computed(() => scheduleTotals.value.penalty_due)
const totalPenaltyPaid = computed(() =>
  schedule.value.reduce((s, r) => s + Number(r.penalty_paid), 0),
)
const totalPenaltyOutstanding = computed(() =>
  Math.max(0, totalPenaltyAccrued.value - totalPenaltyPaid.value),
)
const totalProductCharges = computed(() => {
  return (loan.value?.loan_product?.charges ?? []).reduce((acc, charge) => {
    if (charge.charge_type === 'flat') {
      return acc + (Number(charge.value) || 0)
    }
    return acc
  }, 0)
})

const penaltyRuleLabel = computed(() => {
  const p = loan.value?.loan_product
  if (!p) return null
  if (p.penalty_rules && p.penalty_rules.length > 0) {
    const r = p.penalty_rules[0]
    const type = r.penalty_type ?? 'flat'
    const rate =
      Number(r.penalty_rate) > 0
        ? `${r.penalty_rate}% ${type}`
        : r.amount && Number(r.amount) > 0
          ? `${currency.value} ${r.amount} flat`
          : null
    const grace = Number(r.grace_days) > 0 ? ` after ${r.grace_days} grace days` : ''
    return rate ? `${rate}${grace} on ${r.applies_to ?? 'outstanding balance'}` : null
  }
  if (p.penalty_rate && Number(p.penalty_rate) > 0) {
    const grace =
      Number(p.penalty_grace_days) > 0 ? ` after ${p.penalty_grace_days} grace days` : ''
    return `${p.penalty_rate}% ${p.penalty_type ?? 'monthly'}${grace}`
  }
  return null
})

function canShowMore(row: any, index: number) {
  if (row.status === 'paid') return false
  if (index === 0) return true
  const prevRow = schedule.value[index - 1]
  return prevRow?.status === 'paid'
}

// ─── Receive Cash Flow ────────────────────────────────────────────────────────
const userStore = useTenantUserStore()

onMounted(() => {
  if (!userStore.user) {
    userStore.load()
  }
})

const receiveCashModalRef = ref<any>(null)
const showReceiveCashModal = ref(false)
const isPostingCash = ref(false)
const selectedInstallment = ref<any>(null)
const hasFetchedRepaymentOrder = ref(false)
const repaymentAllocationOrder = ref<
  | 'principal_interest_penalties_charges'
  | 'interest_principal_penalties_charges'
  | 'penalties_charges_interest_principal'
  | 'penalties_charges_principal_interest'
>('penalties_charges_interest_principal')

const allocationOrderDisplay = computed(() => {
  const map = {
    principal_interest_penalties_charges: {
      label: 'Case 1',
      sequence: 'Principal -> Interest -> Penalties & Charges',
    },
    interest_principal_penalties_charges: {
      label: 'Case 2',
      sequence: 'Interest -> Principal -> Penalties & Charges',
    },
    penalties_charges_interest_principal: {
      label: 'Case 3',
      sequence: 'Penalties & Charges -> Interest -> Principal',
    },
    penalties_charges_principal_interest: {
      label: 'Case 4',
      sequence: 'Penalties & Charges -> Principal -> Interest',
    },
  } as const
  return map[repaymentAllocationOrder.value]
})

function openReceiveCash(row: any) {
  selectedInstallment.value = row
  if (!hasFetchedRepaymentOrder.value) {
    void fetchRepaymentAllocationOrder()
  }
  showReceiveCashModal.value = true
  receiveCashModalRef.value?.reset()
}

async function fetchRepaymentAllocationOrder() {
  try {
    const res = await loanSettingsApi.get()
    const order = res.data?.data?.repayment_allocation_order
    if (
      order === 'principal_interest_penalties_charges' ||
      order === 'interest_principal_penalties_charges' ||
      order === 'penalties_charges_interest_principal' ||
      order === 'penalties_charges_principal_interest'
    ) {
      repaymentAllocationOrder.value = order
    }
    hasFetchedRepaymentOrder.value = true
  } catch {
    // Keep fallback default; modal still displays deterministic order.
  }
}

async function handleReceiveCashSubmit(data: any) {
  if (!loan.value) return
  isPostingCash.value = true

  try {
    const payload = {
      amount: data.amount,
      penalty_charges: data.penalty_charges || 0,
      interest: data.interest || 0,
      principal: data.principal || 0,
      payment_method: 'cash',
      payment_date: data.payment_date,
      loan_officer_id: loan.value.loan_officer_id ?? null,
      notes: data.description,
    }

    await loansApi.postRepayment(loan.value.id, payload)

    // Switch to success view in modal
    if (receiveCashModalRef.value) {
      receiveCashModalRef.value.setSuccess()
    }

    // Refresh data in background
    refresh()
  } catch (err) {
    console.error('Failed to post cash repayment:', err)
    // Handle error (maybe show a toast)
  } finally {
    isPostingCash.value = false
  }
}

// ─── Repay from Savings Flow ──────────────────────────────────────────────────
const savingsRepayModalRef = ref<any>(null)
const showSavingsRepayModal = ref(false)
const isPostingSavings = ref(false)
const selectedSavingsInstallment = ref<any>(null)

function openSavingsRepayment(row: any) {
  selectedSavingsInstallment.value = row
  if (!hasFetchedRepaymentOrder.value) {
    void fetchRepaymentAllocationOrder()
  }
  showSavingsRepayModal.value = true
  savingsRepayModalRef.value?.reset()
}

async function handleSavingsRepaySubmit(data: {
  savings_account_id: number
  amount: number
  payment_date: string
  description: string
}) {
  if (!loan.value) return
  isPostingSavings.value = true
  try {
    await loansApi.repayFromSavings(loan.value.id, {
      savings_account_id: data.savings_account_id,
      amount: data.amount,
      payment_date: data.payment_date,
      notes: data.description,
    })
    savingsRepayModalRef.value?.setSuccess()
    refresh()
  } catch (err: any) {
    console.error('Failed to post savings repayment:', err)
  } finally {
    isPostingSavings.value = false
  }
}
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'tenant-active-loans' })
  }
}
</script>

<template>
  <div class="px-4 py-6 sm:px-6 lg:px-8 space-y-5">
    <!-- Back + header -->
    <div class="flex items-center gap-3">
      <button
        class="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="h-4 w-4" />
        Loan Portfolio
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="loading && !loan"
      class="flex items-center justify-center py-16 gap-2 text-neutral-400"
    >
      <Loader2 class="h-5 w-5 animate-spin" />
    </div>

    <template v-else-if="loan">
      <!-- Loan header card -->
      <div
        class="rounded-2xl border border-neutral-200/70 bg-gradient-to-br from-white via-white to-emerald-50/40 p-6 dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800/70"
      >
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="flex items-start gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30"
            >
              <Banknote class="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                  {{ loan.loan_no }}
                </h1>
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                  :class="statusColor(loan.status)"
                >
                  <CheckCircle2 v-if="loan.status === 'closed'" class="h-3 w-3" />
                  <AlertCircle v-else-if="loan.status === 'arrears'" class="h-3 w-3" />
                  {{ loan.status }}
                </span>
              </div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                {{ loan.member?.name }}
                <span v-if="loan.member?.member_number" class="text-neutral-400">
                  · {{ loan.member.member_number }}</span
                >
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                >
                  {{ loan.loan_product?.name ?? 'Loan Product' }}
                </span>
                <span
                  class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-300"
                >
                  {{ loan.interest_rate }}% · {{ interestMethodLabel }}
                </span>
                <span
                  class="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  {{ loan.term_months }} months
                </span>
                <span
                  class="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  Disbursed {{ fmtDate(loan.disbursed_at) }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3"></div>
        </div>

        <!-- Stat row -->
        <div class="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div
            class="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-white p-4 dark:border-blue-800/40 dark:from-blue-900/20 dark:to-neutral-900"
          >
            <div
              class="text-[11px] font-semibold uppercase tracking-wider text-blue-700/80 dark:text-blue-300/80"
            >
              Total Principal
            </div>
            <div class="mt-1 text-2xl font-black leading-tight text-neutral-900 dark:text-white">
              {{ principalDisplay }}
            </div>
            <div class="mt-1 text-[11px] text-blue-700/70 dark:text-blue-300/70">
              Loan amount requested
            </div>
          </div>

          <div
            class="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-800/40 dark:from-emerald-900/20 dark:to-neutral-900"
          >
            <div
              class="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80"
            >
              Net Disbursed
            </div>
            <div
              class="mt-1 text-2xl font-black leading-tight text-emerald-700 dark:text-emerald-400"
            >
              {{ netDisbursedDisplay }}
            </div>
            <div class="mt-1 text-[11px] text-emerald-700/70 dark:text-emerald-300/70">
              Actual amount paid out
            </div>
          </div>

          <div
            class="rounded-xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50 to-white p-4 dark:border-neutral-800/40 dark:from-neutral-900/20 dark:to-neutral-900"
          >
            <div
              class="text-[11px] font-semibold uppercase tracking-wider text-neutral-700/80 dark:text-neutral-300/80"
            >
              Outstanding Balance
            </div>
            <div
              class="mt-1 text-2xl font-black leading-tight"
              :class="
                loan.status === 'arrears'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-neutral-900 dark:text-white'
              "
            >
              {{ outstandingDisplay }}
            </div>
            <div class="mt-1 text-[11px] text-neutral-700/70 dark:text-neutral-300/70">
              Remaining debt
            </div>
          </div>

          <div
            class="rounded-xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50 to-white p-4 dark:border-neutral-800/40 dark:from-neutral-900/20 dark:to-neutral-900"
          >
            <div
              class="text-[11px] font-semibold uppercase tracking-wider text-neutral-700/80 dark:text-neutral-300/80"
            >
              Total Paid
            </div>
            <div class="mt-1 text-2xl font-black leading-tight text-neutral-900 dark:text-white">
              {{ totalAmountPaidDisplay }}
            </div>
            <div class="mt-1 text-[11px] text-neutral-700/70 dark:text-neutral-300/70">
              Collected so far
            </div>
          </div>

          <div
            class="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-800/40 dark:from-emerald-900/20 dark:to-neutral-900"
          >
            <div
              class="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80"
            >
              Repaid %
            </div>
            <div
              class="mt-1 text-2xl font-black leading-tight text-emerald-700 dark:text-emerald-300"
            >
              {{ repaidPercent }}%
            </div>
            <div class="mt-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div
                class="h-1.5 rounded-full bg-emerald-500 transition-all"
                :style="{ width: repaidPercent + '%' }"
              />
            </div>
            <div class="mt-1 text-[11px] text-emerald-700/70 dark:text-emerald-300/70">
              Principal cleared
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div
        class="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20"
      >
        <nav class="-mb-px flex overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200 uppercase tracking-wider"
            :class="
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-700 bg-white dark:text-emerald-400 dark:border-emerald-400 dark:bg-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-200'
            "
            @click="activeTab = tab.key"
          >
            <component :is="tab.icon" class="h-3.5 w-3.5" />
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- ── General Information ── -->
      <div v-if="activeTab === 'general'" class="grid gap-6 lg:grid-cols-2 items-start">
        <!-- ── LEFT COLUMN ── -->
        <div class="space-y-6">
          <!-- Loan Details -->
          <div
            class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
                Loan Details
              </h3>
            </div>
            <div class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800">
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">No.</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.loan_no }}
                </div>
              </div>
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Status</div>
                <div class="font-medium capitalize text-neutral-900 dark:text-white">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                    :class="generalStatusColor(loan.status)"
                  >
                    {{ loan.status === 'active' ? 'Disbursed' : loan.status }}
                  </span>
                </div>
              </div>
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Loan Product</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.loan_product?.name ?? '—' }}
                </div>
              </div>
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">
                  Total Principal
                </div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ principalDisplay }}
                </div>
              </div>
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">
                  Net Cash Disbursed
                </div>
                <div class="font-bold text-emerald-700 dark:text-emerald-400">
                  {{ netDisbursedDisplay }}
                </div>
              </div>
              <div
                v-if="toNumber(loan.processing_fee) > 0"
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Processing Fee</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ currency }} {{ fmt(loan.processing_fee) }}
                </div>
              </div>
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Interest Rate</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.interest_rate }}% ({{ interestMethodLabel }})
                </div>
              </div>
              <div
                v-if="loan.loan_product?.interest_method"
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">
                  Interest Method
                </div>
                <div class="font-medium capitalize text-neutral-900 dark:text-white">
                  {{ loan.loan_product.interest_method.replace(/_/g, ' ') }}
                </div>
              </div>
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Term</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.term_months }} months
                </div>
              </div>
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Grace Period</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{
                    (loan.loan_product?.grace_period ?? 0) > 0
                      ? `${loan.loan_product?.grace_period} days`
                      : 'None'
                  }}
                </div>
              </div>
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Approval Date</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.approved_at ? fmtDate(loan.approved_at) : '—' }}
                </div>
              </div>
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Date Disbursed</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.disbursed_at ? fmtDate(loan.disbursed_at) : '—' }}
                </div>
              </div>
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">
                  Disbursement Method
                </div>
                <div class="font-medium capitalize text-neutral-900 dark:text-white">
                  {{ loan.disbursement_method?.replace(/_/g, ' ') ?? '—' }}
                </div>
              </div>
              <div
                v-if="loan.disbursement_reference"
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Reference</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.disbursement_reference }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── RIGHT COLUMN ── -->
        <div class="space-y-6">
          <!-- People Information -->
          <div
            class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
                People Information
              </h3>
            </div>
            <div class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800">
              <div
                v-if="loan.member"
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Member Name</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.member.name }}
                </div>
              </div>
              <div
                v-if="loan.member?.member_number"
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Member No.</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.member.member_number }}
                </div>
              </div>
              <div
                v-if="loan.disbursed_by_staff"
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">
                  Disbursing Officer
                </div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.disbursed_by_staff.name }}
                </div>
              </div>
              <div
                v-if="loan.loan_officer"
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Loan Officer</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.loan_officer.name }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Schedule ── -->
      <div v-if="activeTab === 'schedule'">
        <div
          v-if="schedule.length"
          class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 flex items-center justify-between">
            <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
              Repayment Schedule
            </h3>
            <span
              class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              {{ schedule.length }} installments
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-[13px]">
              <thead
                class="bg-neutral-50/80 dark:bg-neutral-800/60 font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-100 dark:border-neutral-800"
              >
                <tr>
                  <th class="px-2 py-3 text-left">#ID</th>
                  <th class="px-3 py-3 text-left">Due Date</th>
                  <th class="px-3 py-3 text-right">Principal</th>
                  <th class="px-3 py-3 text-right">Interest</th>
                  <th class="px-3 py-3 text-right">Penalty</th>
                  <th class="px-3 py-3 text-right">Total</th>
                  <th class="px-3 py-3 text-right">Paid</th>
                  <th class="px-3 py-3 text-right">Pending</th>
                  <th class="px-3 py-3 text-left">Status</th>
                  <th class="px-3 py-3 text-right">Arrears Days</th>
                  <th class="px-3 py-3 text-right">Running Balance</th>
                  <th class="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <tr
                    v-for="(row, index) in showAllSchedule ? schedule : schedule.slice(0, 10)"
                    :key="row.id"
                    class="even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                  <td class="px-2 py-3 text-neutral-500">{{ row.installment_no }}</td>
                  <td class="px-3 py-3 text-neutral-700 dark:text-neutral-300">
                    {{ fmtDate(row.due_date) }}
                  </td>
                  <td class="px-3 py-3 text-right">{{ currency }} {{ fmt(row.principal_due) }}</td>
                  <td class="px-3 py-3 text-right">{{ currency }} {{ fmt(row.interest_due) }}</td>
                  <td class="px-3 py-3 text-right">{{ currency }} {{ fmt(row.penalty_due) }}</td>
                  <td class="px-3 py-3 text-right font-semibold">
                    {{ currency }} {{ fmt(Number(row.total_due) + Number(row.penalty_due)) }}
                  </td>
                  <td class="px-3 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {{ currency }}
                    {{
                      fmt(
                        Number(row.principal_paid) +
                          Number(row.interest_paid) +
                          Number(row.charges_paid) +
                          Number(row.penalty_paid),
                      )
                    }}
                  </td>
                  <td class="px-3 py-3 text-right">
                    {{ currency }}
                    {{
                      fmt(
                        Number(row.total_due) +
                          Number(row.penalty_due) -
                          (Number(row.principal_paid) +
                            Number(row.interest_paid) +
                            Number(row.charges_paid) +
                            Number(row.penalty_paid)),
                      )
                    }}
                  </td>
                  <td class="px-3 py-3">
                    <span
                      class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all duration-200"
                      :class="scheduleStatusColor(row.status)"
                    >
                      {{ row.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }}
                    </span>
                  </td>
                  <td class="px-3 py-3 text-right text-neutral-600">
                    {{ row.days_overdue || 0 }}
                  </td>
                  <td class="px-3 py-3 text-right text-neutral-700 dark:text-neutral-300">
                    {{ currency }} {{ fmt(row.outstanding_balance) }}
                  </td>
                  <td class="px-3 py-3 text-center">
                    <DropdownMenu v-if="canShowMore(row, index)">
                      <DropdownMenuTrigger as-child>
                        <button
                          class="inline-flex items-center justify-between gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          More
                          <ChevronDown class="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        class="w-48 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-xl"
                      >
                        <DropdownMenuItem
                          class="cursor-pointer gap-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          @click="openReceiveCash(row)"
                        >
                          <Banknote class="h-4 w-4" />
                          Receive Cash
                        </DropdownMenuItem>
                        <DropdownMenuItem class="cursor-pointer gap-2">
                          <History class="h-4 w-4" />
                          Mobile Money
                        </DropdownMenuItem>
                        <DropdownMenuItem class="cursor-pointer gap-2">
                          <CreditCard class="h-4 w-4" />
                          Card
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          class="cursor-pointer gap-2 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          @click="openSavingsRepayment(row)"
                        >
                          <Wallet class="h-4 w-4" />
                          Receive from Savings
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              </tbody>
              <tfoot
                class="bg-neutral-50 dark:bg-neutral-800/60 font-bold text-neutral-900 dark:text-white border-t border-neutral-200 dark:border-neutral-700"
              >
                <tr>
                  <td colspan="2" class="px-3 py-3 font-semibold text-neutral-700">Total Due</td>
                  <td class="px-3 py-3 text-right">
                    {{ currency }} {{ fmt(scheduleTotals.principal_due) }}
                  </td>
                  <td class="px-3 py-3 text-right">
                    {{ currency }} {{ fmt(scheduleTotals.interest_due) }}
                  </td>
                  <td class="px-3 py-3 text-right">
                    {{ currency }} {{ fmt(scheduleTotals.penalty_due) }}
                  </td>
                  <td class="px-3 py-3 text-right font-bold">
                    {{ currency }} {{ fmt(scheduleTotals.total_due + scheduleTotals.penalty_due) }}
                  </td>
                  <td class="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400">
                    {{ currency }} {{ fmt(scheduleTotals.total_paid) }}
                  </td>
                  <td class="px-3 py-3 text-right font-bold">
                    {{ currency }} {{ fmt(scheduleTotals.total_due + scheduleTotals.penalty_due - scheduleTotals.total_paid) }}
                  </td>
                  <td colspan="4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <button
            v-if="schedule.length > 6"
            class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-100 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50"
            @click="showAllSchedule = !showAllSchedule"
          >
            <template v-if="showAllSchedule">
              <ChevronUp class="h-3.5 w-3.5" /> Show less
            </template>
            <template v-else>
              <ChevronDown class="h-3.5 w-3.5" />
              Show all {{ schedule.length }} installments
            </template>
          </button>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2">
          <ClipboardList class="h-8 w-8" />
          <p class="text-sm">No payment schedule available.</p>
        </div>
      </div>

      <!-- ── Transaction History ── -->
      <div v-if="activeTab === 'transactions'" class="space-y-4">
        <div
          class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 flex items-center justify-between">
            <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
              Transaction History
            </h3>
            <span
              v-if="repayments.length"
              class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              {{ repaymentsMeta.total }} transactions
            </span>
          </div>
          <div
            v-if="!repayments.length"
            class="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2"
          >
            <History class="h-8 w-8" />
            <p class="text-sm">No repayments yet.</p>
          </div>
          <table v-else class="w-full text-sm">
            <thead
              class="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800"
            >
              <tr>
                <th class="px-4 py-3 text-left font-bold text-neutral-900 dark:text-neutral-100">
                  ID
                </th>
                <th class="px-4 py-3 text-left font-bold text-neutral-900 dark:text-neutral-100">
                  Processing Date
                </th>
                <th class="px-4 py-3 text-left font-bold text-neutral-900 dark:text-neutral-100">
                  Transaction Type
                </th>
                <th class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                  Principal Portion
                </th>
                <th class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                  Interest Portion
                </th>
                <th class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                  Penalty Portion
                </th>
                <th class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                  Charge Portion
                </th>
                <th class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                  Amount
                </th>
                <th class="px-4 py-3 text-left font-bold text-neutral-900 dark:text-neutral-100">
                  Officer
                </th>
                <th class="px-4 py-3 text-center font-bold text-neutral-900 dark:text-neutral-100">
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
              <tr
                v-for="txn in repayments"
                :key="txn.id"
                class="even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <td class="px-4 py-3 font-mono text-xs text-neutral-500">
                  {{ txn.receipt_no ?? txn.payment_id }}
                </td>
                <td class="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                  {{ fmtDate(txn.payment_date) }}
                </td>
                <td class="px-4 py-3 capitalize text-neutral-600 dark:text-neutral-400">
                  {{ txn.payment_method?.replace(/_/g, ' ') ?? '—' }}
                </td>
                <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                  {{ currency }} {{ fmt(txn.principal_portion) }}
                </td>
                <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                  {{ currency }} {{ fmt(txn.interest_portion) }}
                </td>
                <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                  {{ currency }} {{ fmt(txn.penalty_portion) }}
                </td>
                <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                  {{ currency }} {{ fmt(txn.charges_portion) }}
                </td>
                <td
                  class="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400"
                >
                  {{ currency }} {{ fmt(txn.amount_paid) }}
                </td>
                <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {{ txn.loan_officer?.name ?? txn.collected_by?.name ?? '—' }}
                </td>
                <td class="px-4 py-3 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <button
                        class="inline-flex items-center rounded-lg border border-nfuko-action bg-white p-0 text-[11px] font-bold text-nfuko-action overflow-hidden hover:bg-nfuko-action/5 transition-colors shadow-sm"
                      >
                        <span class="px-2.5 py-1.2">Action</span>
                        <span
                          class="bg-nfuko-action px-1.5 py-1.5 text-white border-l border-nfuko-action flex items-center justify-center"
                        >
                          <ChevronDown class="h-3 w-3 stroke-[3]" />
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      class="w-40 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-xl rounded-xl p-1"
                    >
                      <DropdownMenuItem
                        class="cursor-pointer gap-2.5 py-2 px-3 text-nfuko-action focus:text-nfuko-action focus:bg-nfuko-action/10 rounded-lg"
                      >
                        <Eye class="h-4 w-4 stroke-[2.5]" />
                        <span class="font-bold">View</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class="cursor-pointer gap-2.5 py-2 px-3 text-nfuko-action focus:text-nfuko-action focus:bg-nfuko-action/10 rounded-lg"
                      >
                        <CircleMinus class="h-4 w-4 stroke-[2.5]" />
                        <span class="font-bold">Reverse</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Repayments pagination -->
        <div
          v-if="repaymentsMeta.last_page > 1"
          class="flex items-center justify-between text-sm text-neutral-500"
        >
          <span>{{ repaymentsMeta.total }} repayments</span>
          <div class="flex gap-2">
            <button
              :disabled="!hasPrevRepayments"
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-neutral-700 dark:hover:bg-neutral-800"
              @click="fetchRepayments(repaymentsMeta.current_page - 1)"
            >
              <ChevronLeft class="h-4 w-4" />
            </button>
            <button
              :disabled="!hasNextRepayments"
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-neutral-700 dark:hover:bg-neutral-800"
              @click="fetchRepayments(repaymentsMeta.current_page + 1)"
            >
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- ── Charges & Penalties ── -->
      <div v-if="activeTab === 'charges'" class="space-y-6">
        <!-- Charge Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            class="rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/40"
          >
            <p class="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Total Applied Charges
            </p>
            <p class="mt-1 text-base font-bold text-neutral-900 dark:text-white">
              {{ currency }} {{ fmt(totalChargesAmount) }}
            </p>
          </div>
          <div
            class="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-900/10"
          >
            <p class="text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
              Charges Collected
            </p>
            <p class="mt-1 text-base font-bold text-emerald-700 dark:text-emerald-400">
              {{ currency }} {{ fmt(totalChargesCollected) }}
            </p>
          </div>
          <div
            class="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-900/10"
          >
            <p class="text-[10px] font-semibold uppercase tracking-wide text-amber-500">
              Charges Outstanding
            </p>
            <p class="mt-1 text-base font-bold text-amber-700 dark:text-amber-400">
              {{ currency }} {{ fmt(totalChargesRemaining) }}
            </p>
          </div>
          <div
            class="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 dark:border-red-900/30 dark:bg-red-900/10"
          >
            <p class="text-[10px] font-semibold uppercase tracking-wide text-red-500">
              Penalty Balance
            </p>
            <p class="mt-1 text-base font-bold text-red-700 dark:text-red-400">
              {{ currency }} {{ fmt(totalPenaltyOutstanding) }}
            </p>
          </div>
        </div>



        <!-- ── Product Charges & Fees ── -->
        <div v-if="loan.loan_product?.charges?.length" class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
              Product Charges & Fees
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-[13px]">
              <thead
                class="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800"
              >
                <tr>
                  <th class="px-4 py-3 text-left font-bold text-neutral-900 dark:text-neutral-100">Charge Name</th>
                  <th class="px-4 py-3 text-left font-bold text-neutral-900 dark:text-neutral-100">Type</th>
                  <th class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="charge in loan.loan_product.charges"
                  :key="charge.id"
                  class="even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td class="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                    {{ charge.name }}
                  </td>
                  <td class="px-4 py-3 capitalize text-neutral-500">
                    {{ charge.charge_type?.replace(/_/g, ' ') }}
                  </td>
                  <td class="px-4 py-2.5 text-right font-medium">
                    <template v-if="charge.charge_type === 'flat'">
                      {{ currency }} {{ fmt(charge.value) }}
                    </template>
                    <template v-else-if="charge.charge_type === 'percentage'">
                      {{ charge.value }}%
                    </template>
                    <template v-else>
                      {{ charge.value }}
                    </template>
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="loan.loan_product?.charges?.length">
                <tr
                  class="bg-neutral-50/50 dark:bg-neutral-800/30 font-bold border-t border-neutral-100 dark:border-neutral-800"
                >
                  <td class="px-4 py-2.5 text-left" colspan="2">Sum Total</td>
                  <td class="px-4 py-2.5 text-right">
                    {{ currency }} {{ fmt(totalProductCharges) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- ── On-Disbursement Charges ── -->
        <div v-if="disbursementCharges.length" class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
              Disbursement Charges
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-[13px]">
              <thead
                class="bg-neutral-50/80 dark:bg-neutral-800/60 font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-100 dark:border-neutral-800"
              >
                <tr>
                  <th class="px-4 py-2.5 text-left">Charge</th>
                  <th class="px-4 py-2.5 text-left">Type</th>
                  <th class="px-4 py-2.5 text-right">Amount</th>
                  <th class="px-4 py-2.5 text-right">Collected</th>
                  <th class="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <tr
                    v-for="charge in disbursementCharges"
                    :key="charge.id"
                    class="even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                    :class="charge.is_waived ? 'opacity-50' : ''"
                  >
                  <td class="px-4 py-2.5 font-medium text-neutral-800 dark:text-neutral-200">
                    {{ charge.name }}
                    <span v-if="charge.is_mandatory" class="ml-1 text-[10px] text-neutral-400"
                      >(mandatory)</span
                    >
                  </td>
                  <td class="px-4 py-2.5 capitalize text-neutral-500">{{ charge.charge_type }}</td>
                  <td class="px-4 py-2.5 text-right">
                    {{ currency }} {{ fmt(charge.charge_amount) }}
                  </td>
                  <td class="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                    {{ currency }} {{ fmt(charge.used_amount) }}
                  </td>
                  <td class="px-4 py-2.5 text-center">
                    <span
                      v-if="charge.is_waived"
                      class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                      >Waived</span
                    >
                    <span
                      v-else
                      class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      >Collected</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p
            v-if="loan?.charge_deduction_mode"
            class="mt-2 text-[11px] text-neutral-400 dark:text-neutral-500"
          >
            Method:
            <span class="font-medium text-neutral-600 dark:text-neutral-300">{{
              loan.charge_deduction_mode === 'deduct_from_principal'
                ? 'Deducted from principal'
                : loan.charge_deduction_mode === 'debit_savings'
                  ? 'Debited from savings account'
                  : loan.charge_deduction_mode === 'pay_cash'
                    ? 'Paid in cash'
                    : loan.charge_deduction_mode === 'capitalize'
                      ? 'Capitalized into loan balance'
                      : loan.charge_deduction_mode
            }}</span>
          </p>
        </div>

        <!-- ── On-Repayment Charges ── -->
        <div v-if="repaymentCharges.length" class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
              Repayment Charges
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-[13px]">
              <thead
                class="bg-neutral-50/80 dark:bg-neutral-800/60 font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-100 dark:border-neutral-800"
              >
                <tr>
                  <th class="px-4 py-2.5 text-left">Charge</th>
                  <th class="px-4 py-2.5 text-left">Type</th>
                  <th class="px-4 py-2.5 text-right">Total Amount</th>
                  <th class="px-4 py-2.5 text-right">Collected</th>
                  <th class="px-4 py-2.5 text-right">Remaining</th>
                  <th class="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <tr
                    v-for="charge in repaymentCharges"
                    :key="charge.id"
                    class="even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                    :class="charge.is_waived ? 'opacity-50' : ''"
                  >
                  <td class="px-4 py-2.5 font-medium text-neutral-800 dark:text-neutral-200">
                    {{ charge.name }}
                  </td>
                  <td class="px-4 py-2.5 capitalize text-neutral-500">{{ charge.charge_type }}</td>
                  <td class="px-4 py-2.5 text-right">
                    {{ currency }} {{ fmt(charge.charge_amount) }}
                  </td>
                  <td class="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                    {{ currency }} {{ fmt(charge.used_amount) }}
                  </td>
                  <td
                    class="px-4 py-2.5 text-right"
                    :class="
                      charge.remaining_amount > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-neutral-400'
                    "
                  >
                    {{
                      charge.remaining_amount > 0
                        ? `${currency} ${fmt(charge.remaining_amount)}`
                        : '—'
                    }}
                  </td>
                  <td class="px-4 py-2.5 text-center">
                    <span
                      v-if="charge.is_waived"
                      class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                      >Waived</span
                    >
                    <span
                      v-else-if="charge.remaining_amount <= 0"
                      class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      >Collected</span
                    >
                    <span
                      v-else
                      class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      >Pending</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ── Empty state for charges ── -->
        <div
          v-if="!loan?.applied_charges?.length"
          class="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 py-10 text-neutral-400 gap-2 dark:border-neutral-700"
        >
          <AlertTriangle class="h-7 w-7" />
          <p class="text-sm">No charges applied to this loan.</p>
        </div>

        <!-- ── Penalty Timeline ── -->
        <div v-if="arrearsRows.length" class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 flex items-center justify-between">
            <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
              Penalty Timeline
            </h3>
            <span
              v-if="penaltyRuleLabel"
              class="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            >
              Arrears Rule: {{ penaltyRuleLabel }}
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-[13px]">
              <thead
                class="bg-neutral-50/80 dark:bg-neutral-800/60 font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-100 dark:border-neutral-800"
              >
                <tr>
                  <th class="px-4 py-3 text-left">#</th>
                  <th class="px-4 py-3 text-left">Due Date</th>
                  <th class="px-4 py-3 text-right">Arrears Days</th>
                  <th class="px-4 py-3 text-right">Principal Outstanding</th>
                  <th class="px-4 py-3 text-right">Penalty Accrued</th>
                  <th class="px-4 py-3 text-right">Penalty Paid</th>
                  <th class="px-4 py-3 text-right">Penalty Due</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="row in arrearsRows"
                  :key="row.id"
                  class="even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td class="px-4 py-2.5 text-neutral-500">{{ row.installment_no }}</td>
                  <td class="px-4 py-2.5 text-neutral-700 dark:text-neutral-300">
                    {{ fmtDate(row.due_date) }}
                  </td>
                  <td class="px-4 py-2.5 text-right">
                    <span class="font-semibold text-red-600 dark:text-red-400">{{
                      row.days_overdue || 0
                    }}</span>
                  </td>
                  <td class="px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-400">
                    {{ currency }} {{ fmt(row.outstanding_balance) }}
                  </td>
                  <td class="px-4 py-2.5 text-right font-medium text-red-600 dark:text-red-400">
                    {{ Number(row.penalty_due) > 0 ? `${currency} ${fmt(row.penalty_due)}` : '—' }}
                  </td>
                  <td class="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                    {{
                      Number(row.penalty_paid) > 0 ? `${currency} ${fmt(row.penalty_paid)}` : '—'
                    }}
                  </td>
                  <td
                    class="px-4 py-2.5 text-right font-semibold"
                    :class="
                      Number(row.penalty_due) - Number(row.penalty_paid) > 0
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-neutral-400'
                    "
                  >
                    {{
                      Number(row.penalty_due) - Number(row.penalty_paid) > 0
                        ? `${currency} ${fmt(Number(row.penalty_due) - Number(row.penalty_paid))}`
                        : '—'
                    }}
                  </td>
                </tr>
              </tbody>
              <tfoot
                class="bg-neutral-50 dark:bg-neutral-800/60 border-t border-neutral-200 dark:border-neutral-700 font-semibold text-xs"
              >
                <tr>
                  <td colspan="4" class="px-4 py-2.5 text-neutral-700 dark:text-neutral-300">
                    Totals
                  </td>
                  <td class="px-4 py-2.5 text-right text-red-600">
                    {{ currency }} {{ fmt(totalPenaltyAccrued) }}
                  </td>
                  <td class="px-4 py-2.5 text-right text-emerald-600">
                    {{ currency }} {{ fmt(totalPenaltyPaid) }}
                  </td>
                  <td class="px-4 py-2.5 text-right text-red-700">
                    {{ currency }} {{ fmt(totalPenaltyOutstanding) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div><div
          v-else
          class="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 py-8 text-neutral-400 gap-2 dark:border-neutral-700"
        >
          <CheckCircle2 class="h-7 w-7 text-emerald-400" />
          <p class="text-sm">No arrears installments — no penalties accrued.</p>
        </div>
      </div>

      <!-- ── Documents tab ── -->
      <div v-if="activeTab === 'documents'" class="p-5">
        <LoanDocumentUploader
          v-if="loan?.loan_application_id"
          :application-id="loan.loan_application_id"
          :editable="false"
          :current-stage="'disbursed'"
          @updated="refresh"
        />
        <div v-else-if="!loading" class="flex flex-col items-center justify-center py-16 text-neutral-400 gap-2">
          <FileText class="h-8 w-8" />
          <p class="text-sm">No linked loan application found.</p>
        </div>
      </div>

      <!-- ── Activities tab ── -->
      <div v-else-if="activeTab === 'activities'" class="p-4">
        <LoanAuditTrail :timeline="activities" :loading="loading" />
      </div>
    </template>
  </div>

  <!-- Repayment modals -->

  <ReceiveCashModal
    ref="receiveCashModalRef"
    :open="showReceiveCashModal"
    :posting="isPostingCash"
    :teller-name="userStore.user?.name ?? '—'"
    :borrower-name="loan?.member?.name ?? '—'"
    :installment-amount="
      selectedInstallment
        ? (Number(selectedInstallment.principal_due || 0) +
           Number(selectedInstallment.interest_due || 0) +
           Number(selectedInstallment.charges_due || 0) +
           Number(selectedInstallment.penalty_due || 0)) -
          (Number(selectedInstallment.principal_paid || 0) +
           Number(selectedInstallment.interest_paid || 0) +
           Number(selectedInstallment.charges_paid || 0) +
           Number(selectedInstallment.penalty_paid || 0))
        : 0
    "
    :currency="currency"
    :allocation-order-label="allocationOrderDisplay.label"
    :allocation-order-sequence="allocationOrderDisplay.sequence"
    :penalty-charges="
      selectedInstallment
        ? Number(selectedInstallment.charges_due || 0) -
          Number(selectedInstallment.charges_paid || 0) +
          (Number(selectedInstallment.penalty_due || 0) -
            Number(selectedInstallment.penalty_paid || 0))
        : 0
    "
    :pending-interest="
      selectedInstallment
        ? Number(selectedInstallment.interest_due || 0) -
          Number(selectedInstallment.interest_paid || 0)
        : 0
    "
    :pending-principal="
      selectedInstallment
        ? Number(selectedInstallment.principal_due || 0) -
          Number(selectedInstallment.principal_paid || 0)
        : 0
    "
    @close="showReceiveCashModal = false"
    @submit="handleReceiveCashSubmit"
  />

  <RepayFromSavingsModal
    ref="savingsRepayModalRef"
    :open="showSavingsRepayModal"
    :posting="isPostingSavings"
    :member-name="loan?.member?.name ?? '—'"
    :currency="currency"
    :installment-amount="
      selectedSavingsInstallment
        ? (Number(selectedSavingsInstallment.principal_due || 0) +
           Number(selectedSavingsInstallment.interest_due || 0) +
           Number(selectedSavingsInstallment.charges_due || 0) +
           Number(selectedSavingsInstallment.penalty_due || 0)) -
          (Number(selectedSavingsInstallment.principal_paid || 0) +
           Number(selectedSavingsInstallment.interest_paid || 0) +
           Number(selectedSavingsInstallment.charges_paid || 0) +
           Number(selectedSavingsInstallment.penalty_paid || 0))
        : 0
    "
    :allocation-order-label="allocationOrderDisplay.label"
    :allocation-order-sequence="allocationOrderDisplay.sequence"
    :penalty-charges="
      selectedSavingsInstallment
        ? Number(selectedSavingsInstallment.charges_due || 0) -
          Number(selectedSavingsInstallment.charges_paid || 0) +
          (Number(selectedSavingsInstallment.penalty_due || 0) -
            Number(selectedSavingsInstallment.penalty_paid || 0))
        : 0
    "
    :pending-interest="
      selectedSavingsInstallment
        ? Number(selectedSavingsInstallment.interest_due || 0) -
          Number(selectedSavingsInstallment.interest_paid || 0)
        : 0
    "
    :pending-principal="
      selectedSavingsInstallment
        ? Number(selectedSavingsInstallment.principal_due || 0) -
          Number(selectedSavingsInstallment.principal_paid || 0)
        : 0
    "
    :member-id="loan?.member_id ?? null"
    @close="showSavingsRepayModal = false"
    @submit="handleSavingsRepaySubmit"
  />
</template>
