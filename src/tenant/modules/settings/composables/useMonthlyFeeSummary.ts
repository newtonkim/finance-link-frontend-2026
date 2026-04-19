import { computed } from 'vue'
import type { SavingsProduct } from '@/tenant/apis/savingsProducts/api'
import type { Ref } from 'vue'

function formatFee(
  value: number | string | null | undefined,
  type: 'percentage' | 'amount' | null | undefined,
  currencyCode: string,
): string {
  if (value === null || value === undefined || value === '') return '—'
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return '—'
  if (type === 'percentage') return `${parsed}%`
  return `${currencyCode} ${parsed}`
}

export function useMonthlyFeeSummary(form: Ref<SavingsProduct>, currency: Ref<string>) {
  const monthlyFeeSummary = computed(() => {
    if (!form.value.monthly_fee_enabled) return ''

    const baseType = form.value.monthly_fee_type ?? 'amount'
    const base = formatFee(form.value.monthly_fee_amount, baseType, currency.value)
    let summary = `All members: ${base} monthly fee.`

    if (!form.value.loyalty_fee_enabled) return summary

    const adjustmentType = form.value.loyalty_adjustment_type
    const adjustmentValue = form.value.loyalty_adjustment_value

    if (adjustmentType === 'discount_percentage') {
      summary += ` Loyal members: ${formatFee(adjustmentValue, 'percentage', currency.value)} discount.`
    } else if (adjustmentType === 'fixed_discount') {
      summary += ` Loyal members: ${formatFee(adjustmentValue, 'amount', currency.value)} off the base fee.`
    } else if (adjustmentType === 'custom_fee') {
      summary += ` Loyal members: ${formatFee(adjustmentValue, baseType, currency.value)} custom fee.`
    }

    return summary
  })

  return { monthlyFeeSummary }
}
