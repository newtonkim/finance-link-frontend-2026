import type { IncomeStatementResponse } from '@/tenant/apis/reports/incomeStatementApi'

/** Format server decimals without passing through floating point. */
export function formatStatementMoney(value: string): string {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value)
  if (!match) return '—'
  const [, sign, whole, fraction = ''] = match
  const zero = /^0+$/.test(whole) && /^0*$/.test(fraction)
  if (zero) return '—'
  const amount = `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction.padEnd(2, '0')}`
  return sign ? `(${amount})` : amount
}
export function reportScope(r: IncomeStatementResponse): string {
  if (r.scope.selected_branch_id != null) return `Branch ${r.scope.selected_branch_id}`
  return r.scope.all_branches
    ? 'All branches'
    : r.scope.branch_ids.length
      ? `Authorized branches: ${r.scope.branch_ids.join(', ')}`
      : 'No authorized branches'
}
export function safeSpreadsheetText(value: string): string {
  return /^[\s]*[=+\-@\t\r\n]/.test(value) ? `'${value}` : value
}
