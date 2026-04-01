<script setup lang="ts">
import { computed, ref } from 'vue'
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
  FileText,
  Activity,
  AlertTriangle,
} from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useLoanAccount } from '../composables/useLoanAccount'
import { useRepaymentAllocation } from '../composables/useRepaymentAllocation'
import PostRepaymentModal from '../components/PostRepaymentModal.vue'

const route = useRoute()
const router = useRouter()

const loanId = Number(route.params.id)
const { loading, loan, schedule, repayments, repaymentsMeta, activeTab, refresh, fetchRepayments } =
  useLoanAccount(loanId)

const {
  showModal,
  posting,
  previewing,
  form,
  errors,
  preview,
  openModal,
  closeModal,
  loadPreview,
  submit,
  errMsg: previewErrMsg,
} = useRepaymentAllocation(loanId)

function onRepaymentSubmit() {
  void submit(() => refresh())
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: number | string | null | undefined) {
  if (v == null || v === '') return '—'
  return formatMoneyValue(v)
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

function scheduleStatusColor(s: string) {
  switch (s) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'overdue':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'partial':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    default:
      return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
  }
}

const tabs = [
  { key: 'general', label: 'General Information', icon: CreditCard },
  { key: 'transactions', label: 'Transaction History', icon: History },
  { key: 'schedule', label: 'Payment Schedule', icon: ClipboardList },
  { key: 'charges', label: 'Charges & Penalties', icon: AlertTriangle },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'activities', label: 'Loan Activities', icon: Activity },
] as const

// Computed progress for the repayment progress bar
const repaidPercent = computed(() => {
  if (!loan.value) return 0
  const principal = parseFloat(String(loan.value.principal)) || 0
  const outstanding = parseFloat(String(loan.value.outstanding_balance)) || 0
  if (principal <= 0) return 0
  return Math.round(((principal - outstanding) / principal) * 100)
})

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
</script>

<template>
  <div class="px-4 py-6 sm:px-6 lg:px-8 space-y-5">
    <!-- Back + header -->
    <div class="flex items-center gap-3">
      <button
        class="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
        @click="router.push({ name: 'tenant-active-loans' })"
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
        class="rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6"
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
              <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                {{ loan.loan_product?.name }} · {{ loan.interest_rate }}% interest ·
                {{ loan.term_months }} months · Disbursed {{ fmtDate(loan.disbursed_at) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              v-if="loan.status !== 'closed'"
              class="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              @click="openModal"
            >
              <Banknote class="h-4 w-4" />
              Post Repayment
            </button>
          </div>
        </div>

        <!-- Stat row -->
        <div class="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="rounded-xl bg-neutral-50 dark:bg-neutral-800/40 p-4">
            <div class="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Principal</div>
            <div class="font-bold text-neutral-900 dark:text-white">
              {{ fmt(loan.principal_formatted) }}
            </div>
          </div>
          <div class="rounded-xl bg-neutral-50 dark:bg-neutral-800/40 p-4">
            <div class="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Outstanding</div>
            <div
              class="font-bold"
              :class="
                loan.status === 'arrears'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-neutral-900 dark:text-white'
              "
            >
              {{ fmt(loan.outstanding_balance_formatted) }}
            </div>
          </div>
          <div class="rounded-xl bg-neutral-50 dark:bg-neutral-800/40 p-4">
            <div class="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Net Disbursed</div>
            <div class="font-bold text-neutral-900 dark:text-white">
              {{ fmt(loan.net_disbursed_amount_formatted) }}
            </div>
          </div>
          <div class="rounded-xl bg-neutral-50 dark:bg-neutral-800/40 p-4">
            <div class="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Repaid</div>
            <div class="font-bold text-emerald-600 dark:text-emerald-400">{{ repaidPercent }}%</div>
            <div class="mt-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div
                class="h-1.5 rounded-full bg-emerald-500 transition-all"
                :style="{ width: repaidPercent + '%' }"
              />
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
                    :class="statusColor(loan.status)"
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
                  Principal Amount
                </div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.principal_formatted ?? fmt(loan.principal) }}
                </div>
              </div>
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Net Disbursed</div>
                <div class="font-medium text-emerald-700 dark:text-emerald-400">
                  {{ loan.net_disbursed_amount_formatted ?? fmt(loan.net_disbursed_amount) }}
                </div>
              </div>
              <div
                v-if="Number(loan.processing_fee) > 0"
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Processing Fee</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.processing_fee_formatted ?? fmt(loan.processing_fee) }}
                </div>
              </div>
              <div
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Interest Rate</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.interest_rate }}%
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
        <div v-if="schedule.length">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Repayment Schedule
            </h3>
            <span
              class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              {{ schedule.length }} installments
            </span>
          </div>
          <div class="overflow-x-auto rounded-xl border border-neutral-100 dark:border-neutral-800">
            <table class="w-full text-xs">
              <thead class="bg-neutral-50 dark:bg-neutral-800/60">
                <tr>
                  <th
                    class="px-3 py-2.5 text-left font-medium text-neutral-500 dark:text-neutral-400"
                  >
                    #
                  </th>
                  <th
                    class="px-3 py-2.5 text-left font-medium text-neutral-500 dark:text-neutral-400"
                  >
                    Due Date
                  </th>
                  <th
                    class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400"
                  >
                    Principal
                  </th>
                  <th
                    class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400"
                  >
                    Interest
                  </th>
                  <th
                    class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400"
                  >
                    Charges
                  </th>
                  <th
                    class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400"
                  >
                    Penalty
                  </th>
                  <th
                    class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400"
                  >
                    Total Due
                  </th>
                  <th
                    class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400"
                  >
                    Paid
                  </th>
                  <th
                    class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400"
                  >
                    Balance
                  </th>
                  <th
                    class="px-3 py-2.5 text-left font-medium text-neutral-500 dark:text-neutral-400"
                  >
                    Paid Date
                  </th>
                  <th
                    class="px-3 py-2.5 text-left font-medium text-neutral-500 dark:text-neutral-400"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="row in showAllSchedule ? schedule : schedule.slice(0, 6)"
                  :key="row.id"
                  class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <td class="px-3 py-2 text-neutral-500 dark:text-neutral-400">
                    {{ row.installment_no }}
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-1.5">
                      <Calendar class="h-3.5 w-3.5 text-neutral-400" />
                      <span class="text-neutral-700 dark:text-neutral-300">{{
                        fmtDate(row.due_date)
                      }}</span>
                    </div>
                    <p v-if="row.is_overdue" class="text-xs text-red-500 mt-0.5">
                      {{ row.days_overdue }}d overdue
                    </p>
                  </td>
                  <td class="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">
                    {{ fmt(row.principal_due_formatted) }}
                  </td>
                  <td class="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">
                    {{ fmt(row.interest_due_formatted) }}
                  </td>
                  <td class="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">
                    {{ Number(row.charges_due) > 0 ? fmt(row.charges_due) : '—' }}
                  </td>
                  <td
                    class="px-3 py-2 text-right"
                    :class="
                      Number(row.penalty_due) > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-neutral-700 dark:text-neutral-300'
                    "
                  >
                    {{ Number(row.penalty_due) > 0 ? fmt(row.penalty_due) : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right font-medium text-neutral-900 dark:text-white">
                    {{ fmt(row.total_due_formatted) }}
                  </td>
                  <td class="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">
                    {{
                      fmt(
                        Number(row.principal_paid) +
                          Number(row.interest_paid) +
                          Number(row.penalty_paid) +
                          Number(row.charges_paid),
                      )
                    }}
                  </td>
                  <td class="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">
                    {{ fmt(row.outstanding_balance_formatted) }}
                  </td>
                  <td class="px-3 py-2 text-neutral-500 dark:text-neutral-400">
                    {{ row.paid_date ? fmtDate(row.paid_date) : '—' }}
                  </td>
                  <td class="px-3 py-2">
                    <span
                      class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                      :class="scheduleStatusColor(row.status)"
                    >
                      {{ row.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
              <!-- Totals row -->
              <tfoot
                class="bg-neutral-50 dark:bg-neutral-800/60 border-t border-neutral-200 dark:border-neutral-700"
              >
                <tr class="font-semibold">
                  <td colspan="2" class="px-3 py-2.5 text-neutral-700 dark:text-neutral-300">
                    Total
                  </td>
                  <td class="px-3 py-2.5 text-right text-neutral-900 dark:text-white">
                    {{ fmt(scheduleTotals.principal_due) }}
                  </td>
                  <td class="px-3 py-2.5 text-right text-neutral-900 dark:text-white">
                    {{ fmt(scheduleTotals.interest_due) }}
                  </td>
                  <td class="px-3 py-2.5 text-right text-neutral-900 dark:text-white">
                    {{ fmt(scheduleTotals.charges_due) }}
                  </td>
                  <td class="px-3 py-2.5 text-right text-neutral-900 dark:text-white">
                    {{ fmt(scheduleTotals.penalty_due) }}
                  </td>
                  <td class="px-3 py-2.5 text-right text-neutral-900 dark:text-white">
                    {{ fmt(scheduleTotals.total_due) }}
                  </td>
                  <td class="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                    {{ fmt(scheduleTotals.total_paid) }}
                  </td>
                  <td class="px-3 py-2.5 text-right text-neutral-900 dark:text-white">
                    {{ fmt(scheduleTotals.outstanding) }}
                  </td>
                  <td colspan="2"></td>
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
          class="rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden"
        >
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
                <th class="px-4 py-3 text-left font-medium text-neutral-500">Receipt</th>
                <th class="px-4 py-3 text-left font-medium text-neutral-500">Date</th>
                <th class="px-4 py-3 text-right font-medium text-neutral-500">Amount</th>
                <th class="px-4 py-3 text-right font-medium text-neutral-500">Principal</th>
                <th class="px-4 py-3 text-right font-medium text-neutral-500">Interest</th>
                <th class="px-4 py-3 text-right font-medium text-neutral-500">Penalty</th>
                <th class="px-4 py-3 text-left font-medium text-neutral-500">Method</th>
                <th class="px-4 py-3 text-left font-medium text-neutral-500">Collected By</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
              <tr
                v-for="txn in repayments"
                :key="txn.id"
                class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
              >
                <td class="px-4 py-3 font-mono text-xs text-neutral-500">
                  {{ txn.receipt_no ?? txn.payment_id }}
                </td>
                <td class="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                  {{ fmtDate(txn.payment_date) }}
                </td>
                <td
                  class="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400"
                >
                  {{ fmt(txn.amount_paid_formatted) }}
                </td>
                <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                  {{
                    Number(txn.principal_portion) > 0 ? fmt(txn.principal_portion_formatted) : '—'
                  }}
                </td>
                <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                  {{ Number(txn.interest_portion) > 0 ? fmt(txn.interest_portion_formatted) : '—' }}
                </td>
                <td class="px-4 py-3 text-right text-red-500">
                  {{ Number(txn.penalty_portion) > 0 ? fmt(txn.penalty_portion_formatted) : '—' }}
                </td>
                <td class="px-4 py-3 capitalize text-neutral-600 dark:text-neutral-400">
                  {{ txn.payment_method?.replace(/_/g, ' ') }}
                </td>
                <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {{ txn.collected_by?.name ?? '—' }}
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

      <!-- ── Documents, Activities — placeholder tabs ── -->
      <div
        v-if="activeTab === 'documents' || activeTab === 'activities'"
        class="flex flex-col items-center justify-center py-16 text-neutral-400 gap-2"
      >
        <component :is="tabs.find((t) => t.key === activeTab)?.icon" class="h-8 w-8" />
        <p class="text-sm capitalize">
          {{ activeTab === 'documents' ? 'Documents' : 'Loan Activities' }} — coming soon
        </p>
      </div>
    </template>
  </div>

  <!-- Repayment modal -->
  <PostRepaymentModal
    :open="showModal"
    :posting="posting"
    :previewing="previewing"
    :form="form"
    :preview="preview"
    :errors="errors"
    :outstanding-balance="loan?.outstanding_balance_formatted"
    @close="closeModal"
    @submit="onRepaymentSubmit"
    @preview-request="loadPreview"
  />
</template>
