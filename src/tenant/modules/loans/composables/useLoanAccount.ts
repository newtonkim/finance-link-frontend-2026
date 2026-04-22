import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import {
  loansApi,
  type LoanActivityEvent,
  type LoanDetail,
  type LoanScheduleEntry,
  type LoanTransaction,
  type RescheduleHistoryEntry,
} from '@/tenant/apis/loans/loansApi'

export function useLoanAccount(loanId: number | null) {
  const resolvedLoanId =
    typeof loanId === 'number' && Number.isFinite(loanId) && loanId > 0 ? loanId : null

  const loading = ref(false)
  const loan = ref<LoanDetail | null>(null)
  const schedule = ref<LoanScheduleEntry[]>([])
  const repayments = ref<LoanTransaction[]>([])
  const repaymentsMeta = ref({ current_page: 1, last_page: 1, per_page: 10, total: 0 })
  const activities = ref<LoanActivityEvent[]>([])
  const reschedules = ref<RescheduleHistoryEntry[]>([])
  const activeTab = ref<
    | 'general'
    | 'transactions'
    | 'schedule'
    | 'charges'
    | 'documents'
    | 'activities'
    | 'reschedules'
    | 'before-topup'
  >('schedule')

  async function fetchLoan() {
    if (!resolvedLoanId) return
    const res = await loansApi.get(resolvedLoanId)
    loan.value = res.data.data
  }

  async function fetchSchedule() {
    if (!resolvedLoanId) return
    const res = await loansApi.getSchedule(resolvedLoanId)
    schedule.value = res.data.data ?? []
  }

  async function fetchRepayments(page = 1) {
    if (!resolvedLoanId) return
    const res = await loansApi.getRepayments(resolvedLoanId, {
      page,
      per_page: repaymentsMeta.value.per_page,
    })
    repayments.value = res.data.data ?? []
    Object.assign(repaymentsMeta.value, (res.data as any).meta ?? {})
  }

  async function fetchActivities() {
    if (!resolvedLoanId) return
    const res = await loansApi.getActivities(resolvedLoanId)
    activities.value = res.data.data ?? []
  }

  async function fetchReschedules() {
    if (!resolvedLoanId) return
    const res = await loansApi.getReschedules(resolvedLoanId)
    reschedules.value = res.data.data ?? []
  }

  async function load() {
    if (!resolvedLoanId) return
    loading.value = true
    try {
      await Promise.all([
        fetchLoan(),
        fetchSchedule(),
        fetchRepayments(),
        fetchActivities(),
        fetchReschedules(),
      ])
    } catch {
      toast.error('Failed to load loan account.')
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    if (!resolvedLoanId) return
    try {
      await Promise.all([
        fetchLoan(),
        fetchSchedule(),
        fetchRepayments(repaymentsMeta.value.current_page),
        fetchActivities(),
        fetchReschedules(),
      ])
    } catch {
      toast.error('Failed to refresh loan.')
    }
  }

  onMounted(() => load())

  return {
    loading,
    loan,
    schedule,
    repayments,
    repaymentsMeta,
    activities,
    reschedules,
    activeTab,
    load,
    refresh,
    fetchRepayments,
    fetchActivities,
  }
}
