import { ref, reactive, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { loanApplicationsApi, type LoanApplication } from '@/tenant/apis/loans/loanApplicationsApi'

interface QueueMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export function useLoanDisbursementQueue() {
    const loading = ref(false)
    const items = ref<LoanApplication[]>([])
    const meta = reactive<QueueMeta>({ current_page: 1, last_page: 1, per_page: 25, total: 0 })

    // ─── Drawer state ─────────────────────────────────────────────────────────
    const activeApplication = ref<LoanApplication | null>(null)
    const showDrawer = ref(false)

    function openDrawer(app: LoanApplication) {
        activeApplication.value = app
        showDrawer.value = true
    }

    function closeDrawer() {
        showDrawer.value = false
        activeApplication.value = null
    }

    // ─── Fetch ────────────────────────────────────────────────────────────────
    async function fetch(page = 1) {
        loading.value = true
        try {
            const res = await loanApplicationsApi.getPendingDisbursements({ page, per_page: meta.per_page })
            const body = res.data
            items.value = body.data ?? []
            Object.assign(meta, body.meta ?? {})
        } catch {
            toast.error('Failed to load disbursement queue.')
        } finally {
            loading.value = false
        }
    }

    // Called by the confirmation drawer after a successful disbursal
    function onDisbursed() {
        closeDrawer()
        void fetch(meta.current_page)
    }

    onMounted(() => fetch())

    return {
        loading, items, meta,
        activeApplication, showDrawer,
        openDrawer, closeDrawer, onDisbursed,
        fetch,
    }
}
