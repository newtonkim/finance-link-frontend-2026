import { computed } from 'vue'
import { formatMoneyValue } from '@/Global'
import type { Ref, ComputedRef } from 'vue'
import type { LoanDetail, LoanScheduleEntry } from '@/tenant/apis/loans/loansApi'

interface ScheduleTotals {
  principal_due: number
  interest_due: number
  charges_due: number
  penalty_due: number
  total_due: number
  total_paid: number
  outstanding: number
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

export function useLoanAmountComputeds(
  loan: Ref<LoanDetail | null>,
  schedule: Ref<LoanScheduleEntry[]>,
  scheduleTotals: ComputedRef<ScheduleTotals>,
) {
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

  const repaidPercent = computed(() => {
    if (!loan.value) return 0
    if (principalAmount.value <= 0) return 0
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          ((principalAmount.value - outstandingAmount.value) / principalAmount.value) * 100,
        ),
      ),
    )
  })

  return {
    currency,
    principalAmount,
    outstandingAmount,
    netDisbursedAmount,
    principalDisplay,
    outstandingDisplay,
    netDisbursedDisplay,
    totalAmountPaid,
    totalAmountPaidDisplay,
    interestMethodLabel,
    repaidPercent,
    toNumber,
  }
}
