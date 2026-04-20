import { computed } from 'vue'
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

export function useLoanChargesPenalties(
  loan: Ref<LoanDetail | null>,
  schedule: Ref<LoanScheduleEntry[]>,
  scheduleTotals: ComputedRef<ScheduleTotals>,
  currency: ComputedRef<string>,
) {
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
    return (loan.value?.loan_product?.charges ?? []).reduce((acc: number, charge: any) => {
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

  return {
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
  }
}
