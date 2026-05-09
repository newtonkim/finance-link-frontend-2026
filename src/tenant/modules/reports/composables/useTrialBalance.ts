import { ref, computed, onMounted } from 'vue'
import { formatMoneyValue } from '@/Global'
import { trialBalanceApi } from '@/tenant/apis/reports/trialBalanceApi'

function currentMonthRange(): { from: string; to: string } {
  const now   = new Date()
  const y     = now.getFullYear()
  const m     = String(now.getMonth() + 1).padStart(2, '0')
  const last  = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    from: `${y}-${m}-01`,
    to:   `${y}-${m}-${String(last).padStart(2, '0')}`,
  }
}

export function useTrialBalance() {
  const today                        = new Date().toISOString().split('T')[0]
  const { from: monthFrom, to: monthTo } = currentMonthRange()

  const mode        = ref<'as_of_date' | 'period'>('period')
  const asOfDate    = ref(today)
  const periodFrom  = ref(monthFrom)
  const periodTo    = ref(monthTo)
  const loading     = ref(false)
  const result      = ref<any>(null)
  const hideZero    = ref(true)
  const exporting   = ref(false)

  // Drill-down drawer
  const drawerOpen     = ref(false)
  const drawerAccount  = ref<any>(null)
  const drawerLines    = ref<any[]>([])
  const drawerPage     = ref(1)
  const drawerTotal    = ref(0)
  const drawerLastPage = ref(1)
  const drawerLoading  = ref(false)

  // ── Computed ────────────────────────────────────────────────────────────────
  const allAccounts = computed(() => result.value?.accounts ?? [])
  const totals      = computed(() => result.value?.totals   ?? null)
  const isBalanced  = computed(() => totals.value?.is_balanced === true)
  const drFrom      = computed(() => result.value?.from ?? result.value?.date ?? asOfDate.value)
  const drTo        = computed(() => result.value?.to   ?? result.value?.date ?? asOfDate.value)

  const accounts = computed(() => {
    if (!hideZero.value) return allAccounts.value

    const activeIds = new Set(
      allAccounts.value
        .filter((a: any) => a.is_postable && (
          a.closing_debit || a.closing_credit ||
          a.opening_debit || a.opening_credit ||
          a.period_debit  || a.period_credit
        ))
        .map((a: any) => a.id),
    )

    const filtered: any[] = []
    let pendingHeader: any = null

    for (const account of allAccounts.value) {
      if (!account.is_postable) {
        pendingHeader = account
      } else if (activeIds.has(account.id)) {
        if (pendingHeader) { filtered.push(pendingHeader); pendingHeader = null }
        filtered.push(account)
      }
    }
    return filtered
  })

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function generate() {
    loading.value = true
    result.value  = null
    try {
      result.value = mode.value === 'period'
        ? await trialBalanceApi.getTrialBalance({ from: periodFrom.value, to: periodTo.value })
        : await trialBalanceApi.getTrialBalance({ date: asOfDate.value })
    } finally {
      loading.value = false
    }
  }

  async function openDrillDown(account: any, side: 'debit' | 'credit') {
    if (!account.is_postable) return
    const amount = side === 'debit'
      ? (mode.value === 'period' ? account.period_debit  : account.closing_debit)
      : (mode.value === 'period' ? account.period_credit : account.closing_credit)
    if (!amount) return
    drawerAccount.value = account
    drawerPage.value    = 1
    drawerLines.value   = []
    drawerOpen.value    = true
    await fetchDrillDown()
  }

  async function fetchDrillDown() {
    if (!drawerAccount.value) return
    drawerLoading.value = true
    try {
      const res = await trialBalanceApi.getLedgerLines({
        account_id: drawerAccount.value.id,
        from: drFrom.value,
        to:   drTo.value,
        page: drawerPage.value,
      })
      drawerLines.value    = drawerPage.value === 1 ? res.data : [...drawerLines.value, ...res.data]
      drawerTotal.value    = res.total
      drawerLastPage.value = res.last_page
    } finally {
      drawerLoading.value = false
    }
  }

  async function loadMore() {
    drawerPage.value++
    await fetchDrillDown()
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function fmt(v: number)     { return formatMoneyValue(v ?? 0) }
  function fmtCell(v: number) { return v ? formatMoneyValue(v) : '—' }
  function fmtNum(v: number)  {
    return v
      ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—'
  }

  function typeColor(type: string) {
    const map: Record<string, string> = {
      ASSET:     'text-blue-600',
      LIABILITY: 'text-orange-600',
      EQUITY:    'text-purple-600',
      INCOME:    'text-green-600',
      EXPENSE:   'text-red-600',
    }
    return map[type] ?? 'text-neutral-500'
  }

  function dateLabel() {
    return mode.value === 'period'
      ? `${periodFrom.value}-to-${periodTo.value}`
      : asOfDate.value
  }

  // ── Auto-load ────────────────────────────────────────────────────────────────
  onMounted(() => generate())

  return {
    mode, asOfDate, periodFrom, periodTo, hideZero, loading, result, exporting,
    accounts, totals, isBalanced, drFrom, drTo,
    drawerOpen, drawerAccount, drawerLines, drawerPage, drawerTotal, drawerLastPage, drawerLoading,
    generate, openDrillDown, loadMore,
    fmt, fmtCell, fmtNum, typeColor, dateLabel,
  }
}
