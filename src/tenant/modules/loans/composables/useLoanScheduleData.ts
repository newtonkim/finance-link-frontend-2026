import { computed, ref, type Component } from 'vue'
import { ClipboardList, History, CreditCard, FileText, Activity, AlertTriangle } from 'lucide-vue-next'
import type { Ref } from 'vue'
import type { LoanDetail, LoanScheduleEntry, RescheduleHistoryEntry } from '@/tenant/apis/loans/loansApi'

export type LoanDetailTabKey =
  | 'schedule'
  | 'reschedules'
  | 'transactions'
  | 'general'
  | 'charges'
  | 'documents'
  | 'activities'

const allTabs: Array<{ key: LoanDetailTabKey; label: string; icon: Component }> = [
  { key: 'schedule', label: 'Payment Schedule', icon: ClipboardList },
  { key: 'reschedules', label: 'Reschedule History', icon: History },
  { key: 'transactions', label: 'Transaction History', icon: History },
  { key: 'general', label: 'General Information', icon: CreditCard },
  { key: 'charges', label: 'Charges & Penalties', icon: AlertTriangle },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'activities', label: 'Loan Activities', icon: Activity },
]

export function useLoanScheduleData(
  loan: Ref<LoanDetail | null>,
  schedule: Ref<LoanScheduleEntry[]>,
  reschedules: Ref<RescheduleHistoryEntry[]>,
) {
  const showAllSchedule = ref(false)

  const latestRescheduleId = computed(() => {
    if (!reschedules.value || reschedules.value.length === 0) return null
    return reschedules.value[0]?.id ?? null
  })

  const latestReschedule = computed(() =>
    reschedules.value && reschedules.value.length > 0 ? (reschedules.value[0] || null) : null,
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
      if (row.status?.toLowerCase() === 'superseded') return false

      if (loan.value?.is_rescheduled) {
        if (latestRescheduleId.value) {
          return String(row.reschedule_id) === String(latestRescheduleId.value)
        }
        return true
      }

      return true
    })
  })

  const scheduleTotals = computed(() => {
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

  function canShowMore(row: LoanScheduleEntry) {
    const firstUnpaid = filteredSchedule.value.find((r) => r.status?.toLowerCase() !== 'paid')
    return row.id === firstUnpaid?.id
  }

  const tabs = computed(() =>
    allTabs.filter((t) => t.key !== 'reschedules' || !!loan.value?.is_rescheduled),
  )

  return {
    showAllSchedule,
    latestRescheduleId,
    latestReschedule,
    oldStatusLabel,
    oldStatusClass,
    filteredSchedule,
    scheduleTotals,
    canShowMore,
    tabs,
  }
}
