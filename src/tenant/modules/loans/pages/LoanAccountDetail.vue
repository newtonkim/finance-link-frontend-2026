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
  Printer,
  FileDown,
} from 'lucide-vue-next'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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
import LoanTopupModal from '../components/LoanTopupModal.vue'
import LoanRescheduleModal from '../components/LoanRescheduleModal.vue'

const route = useRoute()
const router = useRouter()

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
    case 'rescheduled':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    default:
      return 'bg-neutral-100 text-neutral-500'
  }
}

function generalStatusColor(status: string) {
  if (status === 'closed') {
    return 'bg-nfuko-primary text-white'
  }
  if (status === 'rescheduled') {
    return 'bg-amber-500 text-white'
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
    case 'superseded':
      return 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 opacity-60'
    default:
      return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
  }
}

type LoanDetailTabKey = 'schedule' | 'reschedules' | 'transactions' | 'general' | 'charges' | 'documents' | 'activities'

const allTabs: Array<{ key: LoanDetailTabKey; label: string; icon: any }> = [
  { key: 'schedule', label: 'Payment Schedule', icon: ClipboardList },
  { key: 'reschedules', label: 'Reschedule History', icon: History },
  { key: 'transactions', label: 'Transaction History', icon: History },
  { key: 'general', label: 'General Information', icon: CreditCard },
  { key: 'charges', label: 'Charges & Penalties', icon: AlertTriangle },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'activities', label: 'Loan Activities', icon: Activity },
]

const tabs = computed(() =>
  allTabs.filter((t) => t.key !== 'reschedules' || !!loan.value?.is_rescheduled),
)

const showAllSchedule = ref(false)

const latestRescheduleId = computed(() => {
  if (!reschedules.value || reschedules.value.length === 0) return null
  // We use the integer .id here because that's what's stored in the schedule's reschedule_id column
  return reschedules.value[0]?.id ?? null
})

const latestReschedule = computed(() =>
  reschedules.value && reschedules.value.length > 0 ? reschedules.value[0] : null
)

const oldStatusLabel = computed(() => {
  const s = latestReschedule.value?.old_status
  if (!s) return null
  if (s === 'active') return 'Disbursed'
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
})

const oldStatusClass = computed(() => {
  const s = latestReschedule.value?.old_status
  switch (s) {
    case 'active':
    case 'disbursed':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'arrears':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
  }
})

const filteredSchedule = computed(() => {
  if (!schedule.value.length) return []

  return schedule.value.filter((row) => {
    // 1. Never show superseded rows here
    if (row.status?.toLowerCase() === 'superseded') return false

    // 2. If the loan has been rescheduled, only show rows belonging to the latest version.
    // This hides old paid installments from previous versions.
    if (loan.value?.is_rescheduled) {
      if (latestRescheduleId.value) {
        return String(row.reschedule_id) === String(latestRescheduleId.value)
      }
      // If no reschedules in history but is_rescheduled is true (edge case),
      // or if we are still fetching, default to showing what we have.
      return true
    }

    return true
  })
})

const scheduleTotals = computed(() => {
  // Totals should only sum active installments
  return filteredSchedule.value.reduce(
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

function canShowMore(row: any) {
  // Only show the 'More' button for the first installment that is NOT fully paid.
  // This ensures the user follows a strict chronological repayment sequence.
  const firstUnpaid = filteredSchedule.value.find((r) => r.status?.toLowerCase() !== 'paid')
  return row.id === firstUnpaid?.id
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

const rescheduleModalRef = ref<any>(null)
const topupModalRef = ref<any>(null)

function handleTopup() {
  if (topupModalRef.value) {
    topupModalRef.value.show()
  }
}

function handleReschedule() {
  if (rescheduleModalRef.value) {
    rescheduleModalRef.value.show()
  }
}

// ─── General Information Print / PDF ─────────────────────────────────────────

function buildGeneralInfoRows(): Array<[string, string]> {
  if (!loan.value) return []
  const l = loan.value
  const rows: Array<[string, string]> = []

  // Current Loan Details
  rows.push(['Loan Number', l.loan_no])
  rows.push(['Status', l.status === 'active' ? 'Disbursed' : l.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())])
  rows.push(['Loan Product', l.loan_product?.name ?? '—'])
  rows.push([l.is_rescheduled ? 'Current Principal' : 'Total Principal',
    l.is_rescheduled && latestReschedule.value ? fmt(latestReschedule.value.new_principal) : principalDisplay.value])
  rows.push(['Net Disbursed', netDisbursedDisplay.value])
  rows.push(['Outstanding Balance', outstandingDisplay.value])
  rows.push([l.is_rescheduled ? 'Current Interest Rate' : 'Interest Rate',
    l.is_rescheduled && latestReschedule.value ? `${latestReschedule.value.new_rate}%` : `${l.interest_rate}%`])
  if (l.loan_product?.interest_method) {
    rows.push(['Interest Method', l.loan_product.interest_method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())])
  }
  rows.push([l.is_rescheduled ? 'Current Term' : 'Term',
    `${l.is_rescheduled && latestReschedule.value ? latestReschedule.value.new_duration : l.term_months} months`])
  rows.push(['Grace Period', (l.loan_product?.grace_period ?? 0) > 0 ? `${l.loan_product?.grace_period} days` : 'None'])
  if (l.approved_at) rows.push(['Approval Date', fmtDate(l.approved_at)])
  rows.push(['Date Disbursed', l.disbursed_at ? fmtDate(l.disbursed_at) : '—'])
  if (l.is_rescheduled && latestReschedule.value) {
    rows.push(['Rescheduled On', latestReschedule.value.reschedule_date ? fmtDate(latestReschedule.value.reschedule_date) : '—'])
    rows.push(['Reschedule Type', latestReschedule.value.reschedule_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—'])
  }
  rows.push(['Disbursement Method', l.disbursement_method?.replace(/_/g, ' ') ?? '—'])
  if (l.disbursement_reference) rows.push(['Reference', l.disbursement_reference])

  // People
  if (l.member) rows.push(['Member Name', l.member.name])
  if (l.member?.member_number) rows.push(['Member No.', l.member.member_number])
  if (l.disbursed_by_staff) rows.push(['Disbursing Officer', l.disbursed_by_staff.name])
  if (l.loan_officer) rows.push(['Loan Officer', l.loan_officer.name])

  // Original loan (if rescheduled)
  if (l.is_rescheduled) {
    rows.push(['— Original Loan Details (Before Rescheduling) —', ''])
    rows.push(['Initial Status', oldStatusLabel.value ?? '—'])
    rows.push(['Original Principal', principalDisplay.value])
    rows.push(['Original Term', `${l.original_term_months || l.term_months} months`])
    rows.push(['Original Rate', `${l.original_interest_rate || l.interest_rate}%`])
  }

  return rows
}

function printGeneralInfo() {
  if (!loan.value) return
  const rows = buildGeneralInfoRows()
    .map(([label, value]) =>
      label.startsWith('—')
        ? `<tr class="section-header"><td colspan="2">${label.replace(/^— | —$/g, '')}</td></tr>`
        : `<tr><td>${label}</td><td>${value}</td></tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Loan General Information – ${loan.value.loan_no}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 24px; }
  h2 { font-size: 16px; margin-bottom: 2px; }
  .sub { font-size: 11px; color: #666; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; max-width: 600px; }
  tr { border-bottom: 1px solid #eee; }
  td { padding: 6px 10px; }
  td:first-child { color: #555; font-size: 11px; width: 45%; }
  td:last-child { font-weight: 600; }
  tr.section-header td { background: #f0f0f0; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #444; padding: 8px 10px; border-bottom: 2px solid #ddd; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h2>Loan General Information</h2>
<div class="sub">${loan.value.loan_no} · ${loan.value.member?.name ?? ''}</div>
<table><tbody>${rows}</tbody></table>
</body>
</html>`

  const win = window.open('', '_blank', 'width=700,height=600')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

function exportGeneralInfoPdf() {
  if (!loan.value) return
  const l = loan.value
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Loan General Information', 14, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`${l.loan_no}  ·  ${l.member?.name ?? ''}`, 14, 25)
  doc.setTextColor(0)

  const rows = buildGeneralInfoRows()
  const tableRows: Array<[string, string] | { isSection: true; label: string }> = []

  const body: Array<any[]> = []
  const sectionIndexes: number[] = []

  rows.forEach(([label, value]) => {
    if (label.startsWith('—')) {
      sectionIndexes.push(body.length)
      body.push([label.replace(/^— | —$/g, ''), ''])
    } else {
      body.push([label, value])
    }
  })

  autoTable(doc, {
    startY: 30,
    head: [['Field', 'Value']],
    body,
    headStyles: { fillColor: [30, 100, 60], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 65, textColor: [80, 80, 80] },
      1: { fontStyle: 'bold' },
    },
    didParseCell(data) {
      if (data.section === 'body' && sectionIndexes.includes(data.row.index)) {
        data.cell.styles.fillColor = [240, 240, 240]
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.textColor = [60, 60, 60]
        data.cell.styles.fontSize = 7.5
      }
    },
    alternateRowStyles: { fillColor: [248, 250, 248] },
  })

  doc.save(`loan-info-${l.loan_no}.pdf`)
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
                  <History v-else-if="loan.status === 'rescheduled'" class="h-3 w-3" />
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
          <div class="flex items-center gap-3">
            <template v-if="['active', 'disbursed', 'running', 'arrears'].includes(loan.status)">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button
                    class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-white"
                  >
                    <span>Manage Loan</span>
                    <ChevronDown class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" class="w-48">
                  <DropdownMenuItem class="flex items-center gap-2 cursor-pointer font-medium text-blue-600 dark:text-blue-400 focus:text-blue-700 focus:bg-blue-50 dark:focus:bg-blue-900/30" @click="handleTopup">
                    <TrendingDown class="h-4 w-4 rotate-180" />
                    <span>Loan Topup</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem class="flex items-center gap-2 cursor-pointer" @click="handleReschedule">
                    <Calendar class="h-4 w-4 text-neutral-500" />
                    <span>Reschedule Loan</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </template>
          </div>
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
              Principal Outstanding
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
              Remaining principal (excl. interest)
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
      <div v-if="activeTab === 'general'" class="space-y-4">
        <!-- Action bar -->
        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            @click="printGeneralInfo"
          >
            <Printer class="h-3.5 w-3.5" />
            Print
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg bg-nfuko-primary px-2.5 py-1.5 text-xs font-medium text-white hover:bg-nfuko-primary/90 transition-colors"
            @click="exportGeneralInfoPdf"
          >
            <FileDown class="h-3.5 w-3.5" />
            PDF
          </button>
        </div>
        <div class="grid gap-6 lg:grid-cols-2 items-start">
        <!-- ── LEFT COLUMN ── -->
        <div class="space-y-6">
          <!-- Current Loan Details -->
          <div
            class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
                Current Loan Details
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
                  {{ loan.is_rescheduled ? 'Current Principal' : 'Total Principal' }}
                </div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.is_rescheduled && latestReschedule ? fmt(latestReschedule.new_principal) : principalDisplay }}
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
                <div class="font-medium text-neutral-500 dark:text-neutral-400">
                  {{ loan.is_rescheduled ? 'Current Interest Rate' : 'Interest Rate' }}
                </div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.is_rescheduled && latestReschedule ? `${latestReschedule.new_rate}%` : `${loan.interest_rate}%` }} ({{ interestMethodLabel }})
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
                <div class="font-medium text-neutral-500 dark:text-neutral-400">
                  {{ loan.is_rescheduled ? 'Current Term' : 'Term' }}
                </div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ loan.is_rescheduled && latestReschedule ? latestReschedule.new_duration : loan.term_months }} months
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
                v-if="loan.is_rescheduled && latestReschedule"
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Rescheduled On</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                  {{ latestReschedule.reschedule_date ? fmtDate(latestReschedule.reschedule_date) : '—' }}
                </div>
              </div>
              <div
                v-if="loan.is_rescheduled && latestReschedule"
                class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
              >
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Reschedule Type</div>
                <div class="font-medium capitalize text-neutral-900 dark:text-white">
                  {{ latestReschedule.reschedule_type?.replace(/_/g, ' ') ?? '—' }}
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

          <!-- Original Loan Details (Before Rescheduling) -->
          <div
            v-if="loan.is_rescheduled"
            class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
              <h3 class="text-[13px] font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <History class="h-3.5 w-3.5 text-neutral-400" />
                Original Loan Details (Before Rescheduling)
              </h3>
            </div>
            <div class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800">
               <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Loan Number</div>
                <div class="font-medium text-neutral-900 dark:text-white">{{ loan.loan_no }}</div>
              </div>
              <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Initial Status</div>
                <div class="font-medium">
                  <span
                    v-if="oldStatusLabel"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                    :class="oldStatusClass"
                  >
                    {{ oldStatusLabel }}
                  </span>
                  <span v-else class="text-neutral-400">—</span>
                </div>
              </div>
              <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Original Principal</div>
                <div class="font-bold text-neutral-900 dark:text-white">{{ principalDisplay }}</div>
              </div>
              <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Original Term</div>
                <div class="font-medium text-neutral-900 dark:text-white">{{ loan.original_term_months || loan.term_months }} months</div>
              </div>
              <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Original Rate</div>
                <div class="font-medium text-neutral-900 dark:text-white">{{ loan.original_interest_rate || loan.interest_rate }}%</div>
              </div>
              <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Interest Method</div>
                <div class="font-medium capitalize text-neutral-900 dark:text-white">
                  {{ loan.loan_product?.interest_method?.replace(/_/g, ' ') ?? '—' }}
                </div>
              </div>
              <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Grace Period</div>
                <div class="font-medium text-neutral-900 dark:text-white">
                   {{ (loan.loan_product?.grace_period ?? 0) > 0 ? `${loan.loan_product?.grace_period} days` : 'None' }}
                </div>
              </div>
              <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Net Cash Disbursed</div>
                <div class="font-medium text-neutral-900 dark:text-white">{{ netDisbursedDisplay }}</div>
              </div>
              <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Approved Date</div>
                <div class="font-medium text-neutral-900 dark:text-white">{{ loan.approved_at ? fmtDate(loan.approved_at) : '—' }}</div>
              </div>
              <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
                <div class="font-medium text-neutral-500 dark:text-neutral-400">Disbursed Date</div>
                <div class="font-medium text-neutral-900 dark:text-white">{{ loan.disbursed_at ? fmtDate(loan.disbursed_at) : '—' }}</div>
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
              Current Repayment Schedule
            </h3>
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                {{ filteredSchedule.length }} installments
              </span>
            </div>
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
                    v-for="(row, index) in filteredSchedule"
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
                      {{ row.status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—' }}
                    </span>
                  </td>
                  <td class="px-3 py-3 text-right text-neutral-600">
                    {{ row.days_overdue || 0 }}
                  </td>
                  <td class="px-3 py-3 text-right text-neutral-700 dark:text-neutral-300">
                    {{ currency }} {{ fmt(row.outstanding_balance) }}
                  </td>
                  <td class="px-3 py-3 text-center">
                    <DropdownMenu v-if="canShowMore(row)">
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
        </div>
        <div v-else class="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2">
          <ClipboardList class="h-8 w-8" />
          <p class="text-sm">No payment schedule available.</p>
        </div>
      </div>

      <!-- ── Transaction History ── -->
      <!-- ── Reschedule History ── -->
      <div v-if="activeTab === 'reschedules'" class="space-y-6">
        <div v-if="!reschedules.length" class="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 p-12 text-center dark:border-neutral-800">
          <History class="mb-4 h-12 w-12 text-neutral-300" />
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">No Rescheduling History</h3>
          <p class="mt-1 text-sm text-neutral-500">This loan has never been rescheduled.</p>
        </div>

        <div v-for="reschedule in reschedules" :key="reschedule.id" class="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
          <!-- Header -->
          <div class="bg-neutral-50/50 border-b border-neutral-200 px-5 py-4 dark:bg-neutral-800/20 dark:border-neutral-800">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Calendar class="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 class="text-sm font-bold text-neutral-900 dark:text-white">
                    Rescheduled on {{ fmtDate(reschedule.reschedule_date) }}
                  </h4>
                  <p class="text-xs text-neutral-500">{{ reschedule.reschedule_id }} · Performed by {{ reschedule.performed_by }}</p>
                </div>
              </div>
              <span class="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {{ reschedule.reschedule_type.replace(/_/g, ' ') }}
              </span>
            </div>
            
            <div v-if="reschedule.reason" class="mt-4 rounded-lg bg-blue-50/50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100/50 dark:border-blue-800/50">
              <strong class="font-bold">Reason:</strong> {{ reschedule.reason }}
            </div>
          </div>

          <!-- Comparison Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-100 dark:divide-neutral-800">
            <!-- OLD TERMS -->
            <div class="p-5">
              <h5 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-400">Previous Terms (Snapshot)</h5>
              <div class="grid grid-cols-2 gap-y-4">
                <div>
                  <p class="text-[10px] text-neutral-500 uppercase tracking-wider">Outstanding Balance</p>
                  <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{{ currency }} {{ fmt(reschedule.old_outstanding) }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-neutral-500 uppercase tracking-wider">Interest Rate</p>
                  <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{{ reschedule.old_interest_rate }}%</p>
                </div>
                <div>
                  <p class="text-[10px] text-neutral-500 uppercase tracking-wider">Remaining Periods</p>
                  <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{{ reschedule.old_remaining_periods }} months</p>
                </div>
              </div>
            </div>

            <!-- NEW TERMS -->
            <div class="p-5 bg-neutral-50/30 dark:bg-neutral-800/10">
              <h5 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-blue-500">New Terms (Applied)</h5>
              <div class="grid grid-cols-2 gap-y-4">
                <div>
                  <p class="text-[10px] text-neutral-500 uppercase tracking-wider">New Principal</p>
                  <p class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ currency }} {{ fmt(reschedule.new_principal) }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-neutral-500 uppercase tracking-wider">New Rate</p>
                  <p class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ reschedule.new_rate }}%</p>
                </div>
                <div>
                  <p class="text-[10px] text-neutral-500 uppercase tracking-wider">New Duration</p>
                  <p class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ reschedule.new_duration }} months</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Historical Schedule -->
          <div class="border-t border-neutral-100 dark:border-neutral-800">
             <div class="px-5 py-3 pointer-events-none select-none bg-neutral-50/30 dark:bg-neutral-800/30">
                <span class="text-[11px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <ClipboardList class="h-3.5 w-3.5" />
                  Historical Installments (Superseded)
                </span>
             </div>
             <div class="overflow-x-auto">
                <table class="w-full text-xs">
                  <thead class="bg-neutral-50 dark:bg-neutral-800/40 text-[10px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider border-y border-neutral-100 dark:border-neutral-800">
                    <tr>
                      <th class="px-5 py-3 text-left font-extrabold">#</th>
                      <th class="px-5 py-3 text-left font-extrabold">DUE DATE</th>
                      <th class="px-5 py-3 text-right font-extrabold">PRINCIPAL ({{ currency }})</th>
                      <th class="px-5 py-3 text-right font-extrabold">INTEREST ({{ currency }})</th>
                      <th class="px-5 py-3 text-right font-extrabold">TOTAL ({{ currency }})</th>
                      <th class="px-5 py-3 text-right font-extrabold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                    <tr 
                      v-for="row in reschedule.superseded_schedule" 
                      :key="row.id" 
                      class="transition-colors"
                      :class="[
                        row.status?.toLowerCase() === 'paid' 
                          ? 'bg-emerald-50/50 dark:bg-emerald-900/10 text-neutral-900 dark:text-neutral-100 font-bold' 
                          : 'text-neutral-500 dark:text-neutral-400 opacity-80'
                      ]"
                    >
                      <td class="px-5 py-3">{{ row.installment_no }}</td>
                      <td class="px-5 py-3">{{ fmtDate(row.due_date) }}</td>
                      <td class="px-5 py-3 text-right">{{ fmt(row.principal_due) }}</td>
                      <td class="px-5 py-3 text-right">{{ fmt(row.interest_due) }}</td>
                      <td class="px-5 py-3 text-right">{{ fmt(row.total_due_calc || (Number(row.principal_due) + Number(row.interest_due))) }}</td>
                      <td class="px-5 py-3 text-right">
                        <span 
                          v-if="row.status?.toLowerCase() === 'paid'"
                          class="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        >
                          PAID
                        </span>
                        <span 
                          v-else
                          class="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                        >
                          {{ row.status?.toUpperCase() ?? 'SUPERSEDED' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>

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
                <td class="px-4 py-3">
                  <div class="flex flex-col gap-1">
                    <span class="capitalize text-neutral-600 dark:text-neutral-400">
                      {{ txn.payment_method?.replace(/_/g, ' ') ?? '—' }}
                    </span>
                    <span
                      v-if="txn.reschedule_id"
                      class="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    >
                      <History class="h-2.5 w-2.5" />
                      Rescheduled Installment
                    </span>
                  </div>
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

  <LoanTopupModal ref="topupModalRef" :loan="loan" />
  <LoanRescheduleModal ref="rescheduleModalRef" :loan="loan" @success="refresh" />
</template>
