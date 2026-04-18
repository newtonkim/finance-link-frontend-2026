import { ref, reactive, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { loansApi, type ActiveLoan, type ActiveLoanParams, type LoanSummary, type LoanTab } from '@/tenant/apis/loans/loansApi'
import { branchesApi } from '@/tenant/apis/branches/branchesApi'
import { loanProductsApi } from '@/tenant/apis/loanProducts/loanProductsApi'

interface Meta {
    current_page: number
    last_page: number
    per_page: number
    total: number
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

    async function fetchSummary() {
        summaryLoading.value = true
        try {
            const res = await loansApi.summary()
            summary.value = { ...summary.value, ...res.data }
            await Promise.all([fetchClosedCount(), fetchDisbursedCount()])
        } catch {
            // non-blocking — summary badges just show 0
        } finally {
            summaryLoading.value = false
        }
    }

    async function fetchClosedCount() {
        summary.value.closed = await fetchTotalByStatus('closed')
    }

    async function fetchDisbursedCount() {
        const [activeCount, disbursedCount] = await Promise.all([
            fetchTotalByStatus('active'),
            fetchTotalByStatus('disbursed'),
        ])
        summary.value.disbursed = activeCount + disbursedCount
    }

    async function fetchTotalByStatus(status: string): Promise<number> {
        try {
            const res = await loansApi.list({ tab: 'all', status, per_page: 1, page: 1 })
            const total = Number((res.data as any)?.meta?.total)
            return Number.isFinite(total) ? total : 0
        } catch {
            return 0
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

    async function fetch(page = 1) {
        if (activeTab.value === 'topup') {
            loans.value = []
            Object.assign(meta, { current_page: 1, last_page: 1, per_page: 10, total: 0 })
            return
        }
        loading.value = true
        try {
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
            if (activeTab.value === 'disbursed') {
                rows = rows.filter((loan) => (loan.status ?? '').toLowerCase() !== 'closed')
            }
            loans.value = rows
            Object.assign(meta, (res.data as any).meta ?? {})
            if (activeTab.value === 'disbursed') {
                meta.total = summary.value.disbursed
            }
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
        void fetchSummary()
        void fetchBranches()
        void fetchProducts()
        void fetch()
    })

    return {
        loading, summaryLoading,
        loans, meta, filters,
        activeTab, summary,
        products, branches,
        fetch, fetchSummary, switchTab, applyFilters, clearFilters,
    }
}
