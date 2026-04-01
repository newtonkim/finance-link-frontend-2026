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
  MoreHorizontal,
  Pencil,
} from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Global/ui/dropdown-menu'
import { formatMoneyValue } from '@/Global'
import { useTenantUserStore } from '@/stores/tenantUserStore'
import { useLoanAccount } from '../composables/useLoanAccount'
import { useRepaymentAllocation } from '../composables/useRepaymentAllocation'
import PostRepaymentModal from '../components/PostRepaymentModal.vue'
import ReceiveCashModal from '../components/ReceiveCashModal.vue'
import { loansApi } from '@/tenant/apis/loans/loansApi'

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
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'overdue':
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

const currency = computed(() => loan.value?.currency_code || 'PHP')

function canShowMore(row: any, index: number) {
  if (row.status === 'paid') return false
  if (index === 0) return true
  return schedule.value[index - 1].status === 'paid'
}

// ─── Receive Cash Flow ────────────────────────────────────────────────────────
const userStore = useTenantUserStore()
const receiveCashModalRef = ref<any>(null)
const showReceiveCashModal = ref(false)
const isPostingCash = ref(false)
const selectedInstallment = ref<any>(null)

function openReceiveCash(row: any) {
  selectedInstallment.value = row
  showReceiveCashModal.value = true
  if (receiveCashModalRef.value) {
    receiveCashModalRef.value.reset()
  }
}

async function handleReceiveCashSubmit(data: any) {
  if (!loan.value) return
  isPostingCash.value = true

  try {
    const payload = {
      amount: data.amount,
      payment_method: 'cash',
      payment_date: data.payment_date,
      notes: [data.non_borrower ? `Non-Borrower: ${data.non_borrower}` : '', data.description]
        .filter(Boolean)
        .join('. '),
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
              <thead
                class="bg-neutral-50 dark:bg-neutral-800/60 font-semibold text-neutral-600 dark:text-neutral-400"
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
                  class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <td class="px-2 py-3 text-neutral-500">{{ row.installment_no }}</td>
                  <td class="px-3 py-3 text-neutral-700 dark:text-neutral-300">
                    {{ fmtDate(row.due_date) }}
                  </td>
                  <td class="px-3 py-3 text-right">
                    {{ currency }} {{ row.principal_due_formatted }}
                  </td>
                  <td class="px-3 py-3 text-right">
                    {{ currency }} {{ row.interest_due_formatted }}
                  </td>
                  <td class="px-3 py-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <span>{{ currency }} {{ fmt(row.penalty_due) }}</span>
                      <Pencil class="h-3 w-3 text-amber-500 cursor-pointer" />
                    </div>
                  </td>
                  <td class="px-3 py-3 text-right font-semibold">
                    {{ currency }} {{ row.total_due_formatted }}
                  </td>
                  <td class="px-3 py-3 text-right">
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
                        Number(row.total_due) -
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
                    {{ currency }} {{ row.outstanding_balance_formatted }}
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
                          class="cursor-pointer gap-2"
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
                        <DropdownMenuItem class="cursor-pointer gap-2">
                          <BookOpen class="h-4 w-4" />
                          Savings Account
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
                    {{ currency }} {{ fmt(scheduleTotals.total_due) }}
                  </td>
                  <td class="px-3 py-3 text-right">
                    {{ currency }} {{ fmt(scheduleTotals.total_paid) }}
                  </td>
                  <td class="px-3 py-3 text-right">
                    {{ currency }} {{ fmt(scheduleTotals.total_due - scheduleTotals.total_paid) }}
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
                <th class="px-4 py-3 text-left font-medium text-neutral-500">ID</th>
                <th class="px-4 py-3 text-left font-medium text-neutral-500">Processing Date</th>
                <th class="px-4 py-3 text-left font-medium text-neutral-500">Transaction Type</th>
                <th class="px-4 py-3 text-right font-medium text-neutral-500">Amount</th>
                <th class="px-4 py-3 text-left font-medium text-neutral-500">Officer</th>
                <th class="px-4 py-3 text-center font-medium text-neutral-500">Action</th>
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
                <td class="px-4 py-3 capitalize text-neutral-600 dark:text-neutral-400">
                  {{ txn.payment_method?.replace(/_/g, ' ') ?? '—' }}
                </td>
                <td
                  class="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400"
                >
                  {{ fmt(txn.amount_paid_formatted) }}
                </td>
                <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {{ txn.collected_by?.name ?? '—' }}
                </td>
                <td class="px-4 py-3 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <button
                        class="inline-flex items-center justify-center rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <MoreHorizontal class="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      class="w-40 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-xl"
                    >
                      <DropdownMenuItem class="cursor-pointer gap-2">
                        <FileText class="h-4 w-4" />
                        View Details
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

  <!-- Repayment modals -->
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

  <ReceiveCashModal
    ref="receiveCashModalRef"
    :open="showReceiveCashModal"
    :posting="isPostingCash"
    :teller-name="userStore.user?.name ?? 'Newton Kimathi'"
    :borrower-name="loan?.member?.name ?? 'Borrower'"
    :installment-amount="
      selectedInstallment
        ? Number(selectedInstallment.total_due) -
          (Number(selectedInstallment.principal_paid) +
            Number(selectedInstallment.interest_paid) +
            Number(selectedInstallment.charges_paid) +
            Number(selectedInstallment.penalty_paid))
        : 0
    "
    :currency="currency"
    @close="showReceiveCashModal = false"
    @submit="handleReceiveCashSubmit"
  />
</template>
