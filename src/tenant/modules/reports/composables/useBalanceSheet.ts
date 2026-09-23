import { computed, onMounted, ref } from 'vue'
import { balanceSheetApi, type BalanceSheetResponse } from '@/tenant/apis/reports/balanceSheetApi'
import { allExpandableKeys, buildStatementRows, defaultExpandedKeys } from '../utils/balanceSheetRows'
import { percentChange } from '../utils/accountingFormat'

function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export interface BalanceSheetKpi {
  key: 'assets' | 'liabilities' | 'equity'
  label: string
  amount: number
  compareAmount: number
  change: number | null
}

export function useBalanceSheet(options: { autoLoad?: boolean } = {}) {
  const asAt      = ref(todayIso())
  const compareTo = ref('')          // empty → server picks the prior financial year end
  const hideZero  = ref(true)
  const loading   = ref(false)
  const error     = ref<string | null>(null)
  const result    = ref<BalanceSheetResponse | null>(null)
  const expanded  = ref<Set<string>>(new Set())

  const rows       = computed(() => result.value ? buildStatementRows(result.value, expanded.value) : [])
  const totals     = computed(() => result.value?.totals ?? null)
  const isBalanced = computed(() => totals.value?.current.is_balanced === true)

  const kpis = computed<BalanceSheetKpi[]>(() => {
    if (!totals.value) return []
    const { current: c, compare: p } = totals.value
    const kpi = (key: BalanceSheetKpi['key'], label: string, amount: number, compareAmount: number): BalanceSheetKpi =>
      ({ key, label, amount, compareAmount, change: percentChange(amount, compareAmount) })
    return [
      kpi('assets', 'Total Assets', c.total_assets, p.total_assets),
      kpi('liabilities', 'Total Liabilities', c.total_liabilities, p.total_liabilities),
      kpi('equity', "Members' Funds", c.total_equity, p.total_equity),
    ]
  })

  /** Ledger drill-down window: financial year start (or 1 Jan) up to the as-at date. */
  const drillRange = computed(() => {
    if (!result.value) return null
    return {
      from: result.value.financial_year?.start_date ?? `${result.value.as_at.slice(0, 4)}-01-01`,
      to: result.value.as_at,
    }
  })

  let requestVersion = 0

  async function generate() {
    const version = ++requestVersion
    loading.value = true
    error.value   = null
    try {
      const res = await balanceSheetApi.getBalanceSheet({
        as_at: asAt.value,
        compare_to: compareTo.value || undefined,
        hide_zero: hideZero.value ? 1 : 0,
      })
      if (version !== requestVersion) return
      result.value    = res
      compareTo.value = res.compare_to
      expanded.value  = defaultExpandedKeys(res)
    } catch (e: unknown) {
      if (version !== requestVersion) return
      result.value = null
      error.value  = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load balance sheet.'
    } finally {
      if (version === requestVersion) loading.value = false
    }
  }

  function toggle(key: string) {
    const next = new Set(expanded.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    expanded.value = next
  }

  function expandAll()   { if (result.value) expanded.value = allExpandableKeys(result.value) }
  function collapseAll() { expanded.value = new Set() }

  if (options.autoLoad !== false) onMounted(generate)

  return {
    asAt, compareTo, hideZero, loading, error, result, expanded,
    rows, totals, isBalanced, kpis, drillRange,
    generate, toggle, expandAll, collapseAll,
  }
}
