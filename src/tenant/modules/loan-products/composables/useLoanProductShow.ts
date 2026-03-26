import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { loanProductsApi, type LoanProduct } from '../../../apis/loanProducts/loanProductsApi'

export function useLoanProductShow() {
    const route  = useRoute()
    const router = useRouter()

    const product = ref<LoanProduct | null>(null)
    const loading = ref(false)

    async function fetch() {
        loading.value = true
        try {
            const res = await loanProductsApi.get(Number(route.params.id))
            product.value = res.data?.data ?? res.data
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Failed to load loan product.')
            router.push({ name: 'tenant-settings-loan-products' })
        } finally {
            loading.value = false
        }
    }

    function interestMethodLabel(method: string | null | undefined) {
        if (method === 'flat') return 'Flat Rate'
        if (method === 'reducing_balance') return 'Reducing Balance'
        return '—'
    }

    function orDash(val: any) {
        return val != null && val !== '' ? val : '—'
    }

    return { product, loading, fetch, interestMethodLabel, orDash }
}
