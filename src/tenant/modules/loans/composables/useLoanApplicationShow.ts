import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { loanApplicationsApi, type LoanApplication } from '../../../apis/loans/loanApplicationsApi'

export function useLoanApplicationShow() {
    const route  = useRoute()
    const router = useRouter()

    const loading     = ref(false)
    const cancelling  = ref(false)
    const application = ref<LoanApplication | null>(null)

    async function loadApplication() {
        loading.value = true
        try {
            const res     = await loanApplicationsApi.get(Number(route.params.id))
            application.value = res.data?.data ?? res.data
        } catch {
            toast.error('Failed to load loan application.')
            router.push({ name: 'tenant-loans' })
        } finally {
            loading.value = false
        }
    }

    async function cancel() {
        if (!route.params.id) return
        cancelling.value = true
        try {
            await loanApplicationsApi.cancel(Number(route.params.id))
            toast.success('Loan application cancelled.')
            await loadApplication()
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Failed to cancel loan application.')
        } finally {
            cancelling.value = false
        }
    }

    function openEdit() {
        router.push({ name: 'tenant-loans-edit', params: { id: route.params.id } })
    }

    onMounted(() => loadApplication())

    return {
        loading, cancelling,
        application,
        loadApplication,
        openEdit, cancel,
    }
}
