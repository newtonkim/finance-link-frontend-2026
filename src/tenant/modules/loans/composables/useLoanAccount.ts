import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import {
  loansApi,
  type LoanDetail,
  type LoanScheduleEntry,
  type LoanTransaction,
} from '@/tenant/apis/loans/loansApi'

export function useLoanAccount(loanId: number) {
  const loading = ref(false)
  const loan = ref<LoanDetail | null>(null)
  const schedule = ref<LoanScheduleEntry[]>([])
  const repayments = ref<LoanTransaction[]>([])
  const repaymentsMeta = ref({ current_page: 1, last_page: 1, per_page: 10, total: 0 })
  const activeTab = ref<'general' | 'transactions' | 'schedule' | 'documents' | 'activities'>(
    'general',
  )

  async function fetchLoan() {
    const res = await loansApi.get(loanId)
    loan.value = res.data.data
  }

  async function fetchSchedule() {
    const res = await loansApi.getSchedule(loanId)
    schedule.value = res.data.data ?? []
  }

  async function fetchRepayments(page = 1) {
    const res = await loansApi.getRepayments(loanId, {
      page,
      per_page: repaymentsMeta.value.per_page,
    })
    repayments.value = res.data.data ?? []
    Object.assign(repaymentsMeta.value, (res.data as any).meta ?? {})
  }

  async function load() {
    loading.value = true
    try {
      await Promise.all([fetchLoan(), fetchSchedule(), fetchRepayments()])
    } catch {
      toast.error('Failed to load loan account.')
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    try {
      await Promise.all([
        fetchLoan(),
        fetchSchedule(),
        fetchRepayments(repaymentsMeta.value.current_page),
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
    activeTab,
    load,
    refresh,
    fetchRepayments,
  }
}
