import { ref, reactive, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { loansApi, type ActiveLoan, type ActiveLoanParams } from '@/tenant/apis/loans/loansApi'

interface Meta {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export function useActiveLoans() {
    const loading = ref(false)
    const loans = ref<ActiveLoan[]>([])
    const meta = reactive<Meta>({ current_page: 1, last_page: 1, per_page: 25, total: 0 })
    const filters = reactive<ActiveLoanParams>({ status: '', search: '', per_page: 25 })

    async function fetch(page = 1) {
        loading.value = true
        try {
            const params: ActiveLoanParams = { ...filters, page }
            if (!params.status) delete params.status
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

    function applyFilters() {
        void fetch(1)
    }

    onMounted(() => fetch())

    return {
        loading, loans, meta, filters,
        fetch, applyFilters,
    }
}
