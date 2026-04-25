import { ref, reactive, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { loansApi, type ActiveLoan, type ActiveLoanParams, type LoanSummary, type LoanTab } from '@/tenant/apis/loans/loansApi'
import { branchesApi } from '@/tenant/apis/branches/branchesApi'
import { loanProductsApi } from '@/tenant/apis/loanProducts/loanProductsApi'
import { isRestructuredTopupLoan } from '../utils/loanStatus'

interface Meta {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

const TOPUP_SCAN_PAGE_SIZE = 100
const TOPUP_CLASSIFY_CONCURRENCY = 6

function isRestructuredStatus(loan: Pick<ActiveLoan, 'status' | 'status_label'>): boolean {
    const status = String(loan.status ?? '').trim().toLowerCase()
    const statusLabel = String(loan.status_label ?? '').trim().toLowerCase()
    return status === 'restructured' || statusLabel === 'restructured'
}

export function useActiveLoans() {
    const loading        = ref(false)
    const summaryLoading = ref(false)
    const loans          = ref<ActiveLoan[]>([])
    const meta           = reactive<Meta>({ current_page: 1, last_page: 1, per_page: 10, total: 0 })
    const activeTab      = ref<LoanTab>('all')
    const summary        = ref<LoanSummary>({
        disbursed: 0,
        approved: 0,
        pending: 0,
        arrears: 0,
        closed: 0,
        all: 0,
        rescheduled: 0,
        topup: 0,
    })
    const filters        = reactive<ActiveLoanParams>({
        search: '',
        per_page: 10,
        member_name: '',
        loan_product_id: '',
        status: '',
        approved_date_from: '',
        approved_date_to: '',
        disbursed_date_from: '',
        disbursed_date_to: '',
    })

    const products = ref<{ id: number; name: string; code: string }[]>([])
    const branches = ref<{ id: number; name: string }[]>([])
    const topupClassificationCache = new Map<number, boolean>()
    let topupSummaryPromise: Promise<void> | null = null

    async function fetchSummary() {
        summaryLoading.value = true
        try {
            const res = await loansApi.summary()
            summary.value = { ...summary.value, ...res.data }
            // Keep top-up badge accurate even when summary endpoint does not classify top-ups.
            if (Number(res.data?.topup ?? 0) <= 0) {
                void refreshTopupSummaryCount()
            }
        } catch {
            // non-blocking — summary badges just show 0
        } finally {
            summaryLoading.value = false
        }
    }

    async function fetchBranches() {
        try {
            const res = await branchesApi.list()
            branches.value = res.data.data ?? []
        } catch { /* silent fail */ }
    }

    async function fetchProducts() {
        try {
            const res = await loanProductsApi.list()
            products.value = (res.data.data ?? []).map((p: any) => ({
                id: p.id,
                name: p.name,
                code: p.code,
            }))
        } catch { /* silent fail */ }
    }

    async function mapWithConcurrency<T, R>(
        items: T[],
        limit: number,
        mapper: (item: T, index: number) => Promise<R>,
    ): Promise<R[]> {
        if (!items.length) return []

        const results = new Array<R>(items.length)
        let cursor = 0

        const worker = async () => {
            while (cursor < items.length) {
                const index = cursor++
                results[index] = await mapper(items[index], index)
            }
        }

        const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
        await Promise.all(workers)
        return results
    }

    async function collectPagedLoans(scanParams: ActiveLoanParams): Promise<ActiveLoan[]> {
        const firstRes = await loansApi.list(scanParams)
        const firstRows = firstRes.data.data ?? []
        const firstMeta = firstRes.data.meta ?? {}
        const lastPage = Number(firstMeta.last_page ?? 1)

        let allRows = [...firstRows]
        for (let currentPage = 2; currentPage <= lastPage; currentPage += 1) {
            const res = await loansApi.list({ ...scanParams, page: currentPage })
            allRows = allRows.concat(res.data.data ?? [])
        }
        return allRows
    }

    async function isTopupLoan(loan: ActiveLoan): Promise<boolean> {
        const cached = topupClassificationCache.get(loan.id)
        if (cached !== undefined) return cached

        const statusRaw = String(loan.status ?? '').toLowerCase()
        const hasInlineSignals =
            ('parent_loan_id' in loan) ||
            ('topup_type' in loan) ||
            ('status_label' in loan) ||
            ('is_topup' in loan) ||
            statusRaw.includes('topup')

        if (hasInlineSignals) {
            const inlineClassified = isRestructuredTopupLoan(loan)
            topupClassificationCache.set(loan.id, inlineClassified)
            if (inlineClassified) {
                loan.is_topup = true
                loan.status_label = isRestructuredStatus(loan) ? 'Restructured' : 'Restructured TopUp'
                return true
            }
        }

        try {
            const res = await loansApi.get(loan.id)
            const detailedClassified = isRestructuredTopupLoan(res.data.data)
            topupClassificationCache.set(loan.id, detailedClassified)
            if (detailedClassified) {
                loan.is_topup = true
                const detailedStatus = String((res.data.data as any)?.status ?? '').trim().toLowerCase()
                loan.status_label =
                    detailedStatus === 'restructured' || isRestructuredStatus(loan)
                        ? 'Restructured'
                        : 'Restructured TopUp'
                loan.parent_loan_id = res.data.data.parent_loan_id ?? loan.parent_loan_id ?? null
                loan.topup_type = (res.data.data as any).topup_type ?? loan.topup_type ?? null
            }
            return detailedClassified
        } catch {
            topupClassificationCache.set(loan.id, false)
            return false
        }
    }

    async function filterTopupRows(rows: ActiveLoan[], includeTopup: boolean): Promise<ActiveLoan[]> {
        const flags = await mapWithConcurrency(
            rows,
            TOPUP_CLASSIFY_CONCURRENCY,
            async (loan) => isTopupLoan(loan),
        )

        rows.forEach((loan, index) => {
            if (flags[index]) {
                loan.is_topup = true
                loan.status_label = isRestructuredStatus(loan) ? 'Restructured' : 'Restructured TopUp'
            }
        })

        return rows.filter((_, index) => includeTopup ? flags[index] : !flags[index])
    }

    async function annotateTopupRows(rows: ActiveLoan[]): Promise<void> {
        await filterTopupRows(rows, true)
    }

    async function fetchTopupLoans(page = 1) {
        const scanParams: ActiveLoanParams = {
            ...filters,
            tab: 'all',
            page: 1,
            per_page: TOPUP_SCAN_PAGE_SIZE,
        }
        if (!scanParams.search) delete scanParams.search

        const allRows = await collectPagedLoans(scanParams)
        const topupRows = await filterTopupRows(allRows, true)
        const perPage = Math.max(1, Number(filters.per_page ?? 10) || 10)
        const safePage = Math.max(1, page)
        const start = (safePage - 1) * perPage
        const pagedRows = topupRows.slice(start, start + perPage)

        loans.value = pagedRows
        Object.assign(meta, {
            current_page: safePage,
            last_page: Math.max(1, Math.ceil(topupRows.length / perPage)),
            per_page: perPage,
            total: topupRows.length,
        })
        summary.value.topup = topupRows.length
    }

    async function refreshTopupSummaryCount() {
        if (topupSummaryPromise) return topupSummaryPromise

        topupSummaryPromise = (async () => {
            try {
                const scanParams: ActiveLoanParams = {
                    tab: 'all',
                    page: 1,
                    per_page: TOPUP_SCAN_PAGE_SIZE,
                }
                const allRows = await collectPagedLoans(scanParams)
                const topupRows = await filterTopupRows(allRows, true)
                summary.value.topup = topupRows.length
            } catch {
                // keep API summary fallback value
            } finally {
                topupSummaryPromise = null
            }
        })()

        return topupSummaryPromise
    }

    async function fetch(page = 1) {
        loading.value = true
        try {
            if (activeTab.value === 'topup') {
                await fetchTopupLoans(page)
                return
            }

            const params: ActiveLoanParams = { ...filters, page }
            if (activeTab.value === 'closed') {
                params.tab = 'all'
                params.status = 'closed'
            } else if (activeTab.value === 'disbursed') {
                params.tab = 'disbursed'
                delete params.status
            } else if (activeTab.value === 'rescheduled') {
                params.tab = 'rescheduled'
                delete params.status
            } else {
                params.tab = activeTab.value
                delete params.status
            }
            if (!params.search) delete params.search

            const res = await loansApi.list(params)
            let rows = res.data.data ?? []
            if (activeTab.value === 'all') {
                await annotateTopupRows(rows)
            }

            loans.value = rows
            Object.assign(meta, res.data.meta ?? {})
        } catch {
            toast.error('Failed to load loans.')
        } finally {
            loading.value = false
        }
    }

    function switchTab(tab: LoanTab) {
        activeTab.value = tab
        void fetch(1)
    }

    function applyFilters() {
        void fetch(1)
    }

    function clearFilters() {
        Object.assign(filters, {
            search: '',
            per_page: 10,
            member_name: '',
            loan_product_id: '',
            status: '',
            approved_date_from: '',
            approved_date_to: '',
            disbursed_date_from: '',
            disbursed_date_to: '',
        })
        void fetch(1)
    }

    onMounted(() => {
        // Fire all initial requests in parallel — no duplicates
        void Promise.all([
            fetchSummary(),
            fetchBranches(),
            fetchProducts(),
            fetch(),
        ])
    })

    return {
        loading, summaryLoading,
        loans, meta, filters,
        activeTab, summary,
        products, branches,
        fetch, fetchSummary, switchTab, applyFilters, clearFilters,
    }
}
