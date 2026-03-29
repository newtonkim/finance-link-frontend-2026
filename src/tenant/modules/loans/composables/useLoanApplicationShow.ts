import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { loanApplicationsApi, type LoanApplication, type TimelineEvent } from '../../../apis/loans/loanApplicationsApi'

export function useLoanApplicationShow() {
    const route  = useRoute()
    const router = useRouter()

    const loading     = ref(false)
    const cancelling  = ref(false)
    const reopening   = ref(false)
    const application = ref<LoanApplication | null>(null)

    // ─── Timeline ─────────────────────────────────────────────────────────────
    const timeline        = ref<TimelineEvent[]>([])
    const timelineLoading = ref(false)

    async function loadTimeline() {
        timelineLoading.value = true
        try {
            const res       = await loanApplicationsApi.getTimeline(Number(route.params.id))
            timeline.value  = res.data?.data ?? []
        } catch {
            // non-blocking
        } finally {
            timelineLoading.value = false
        }
    }

    // ─── Cancel modal state ───────────────────────────────────────────────────
    const showCancelModal   = ref(false)
    const cancelReason      = ref('')
    const cancelReasonError = ref('')

    function openCancelModal() {
        cancelReason.value      = ''
        cancelReasonError.value = ''
        showCancelModal.value   = true
    }

    function closeCancelModal() {
        showCancelModal.value = false
    }

    async function confirmCancel() {
        cancelReasonError.value = ''
        if (!cancelReason.value.trim() || cancelReason.value.trim().length < 10) {
            cancelReasonError.value = 'Please provide a reason of at least 10 characters.'
            return
        }
        cancelling.value = true
        try {
            await loanApplicationsApi.cancel(Number(route.params.id), cancelReason.value.trim())
            toast.success('Loan application cancelled.')
            showCancelModal.value = false
            await loadApplication()
        } catch (err: any) {
            const errors            = err?.response?.data?.errors
            cancelReasonError.value = errors?.reason?.[0]
                ?? err?.response?.data?.message
                ?? 'Failed to cancel loan application.'
        } finally {
            cancelling.value = false
        }
    }

    // ─── Reopen ───────────────────────────────────────────────────────────────
    async function reopen() {
        reopening.value = true
        try {
            await loanApplicationsApi.reopen(Number(route.params.id))
            toast.success('Application reopened as draft. You can now make corrections and resubmit.')
            await loadApplication()
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Failed to reopen application.')
        } finally {
            reopening.value = false
        }
    }

    // ─── Load ─────────────────────────────────────────────────────────────────
    async function loadApplication() {
        loading.value = true
        try {
            const res         = await loanApplicationsApi.get(Number(route.params.id))
            application.value = res.data?.data ?? res.data
            void loadTimeline()
        } catch {
            toast.error('Failed to load loan application.')
            router.push({ name: 'tenant-loans' })
        } finally {
            loading.value = false
        }
    }

    function openEdit() {
        router.push({ name: 'tenant-loans-edit', params: { id: route.params.id } })
    }

    onMounted(() => loadApplication())

    return {
        loading, cancelling, reopening,
        application,
        timeline, timelineLoading,
        showCancelModal, cancelReason, cancelReasonError,
        openCancelModal, closeCancelModal, confirmCancel,
        reopen,
        loadApplication, openEdit,
    }
}
