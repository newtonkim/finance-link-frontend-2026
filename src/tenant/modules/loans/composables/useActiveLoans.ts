import { ref, reactive, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { loansApi, type ActiveLoan, type ActiveLoanParams, type LoanSummary, type LoanTab } from '@/tenant/apis/loans/loansApi'

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
    const meta           = reactive<Meta>({ current_page: 1, last_page: 1, per_page: 25, total: 0 })
    const activeTab      = ref<LoanTab>('disbursed')
    const summary        = ref<LoanSummary>({ disbursed: 0, approved: 0, pending: 0, arrears: 0, all: 0 })
    const filters        = reactive<ActiveLoanParams>({ search: '', per_page: 25 })

    async function fetchSummary() {
        summaryLoading.value = true
        try {
            const res = await loansApi.summary()
            summary.value = res.data
        } catch {
            // non-blocking — summary badges just show 0
        } finally {
            summaryLoading.value = false
        }
    }

    async function fetch(page = 1) {
        loading.value = true
        try {
            const params: ActiveLoanParams = { ...filters, tab: activeTab.value, page }
            if (!params.search) delete params.search

            const res = await loansApi.list(params)
            loans.value = res.data.data ?? []
            Object.assign(meta, (res.data as any).meta ?? {})
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

    onMounted(() => {
        void fetchSummary()
        void fetch()
    })

    return {
        loading, summaryLoading,
        loans, meta, filters,
        activeTab, summary,
        fetch, fetchSummary, switchTab, applyFilters,
    }
}
