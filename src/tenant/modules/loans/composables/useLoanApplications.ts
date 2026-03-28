import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { loanApplicationsApi, type LoanApplication } from '../../../apis/loans/loanApplicationsApi'
import { loanProductsApi, type LoanProduct } from '../../../apis/loanProducts/loanProductsApi'
import { tenantClient } from '../../../apis/tenantClient'

export function useLoanApplications() {
    const router = useRouter()

    // ─── List state ───────────────────────────────────────────────────────────
    const applications = ref<LoanApplication[]>([])
    const loading      = ref(false)
    const meta         = ref({ current_page: 1, last_page: 1, total: 0 })
    const pages        = computed(() => Array.from({ length: meta.value.last_page }, (_, i) => i + 1))
    const products  = ref<LoanProduct[]>([])
    const branches  = ref<{ id: number; name: string }[]>([])

    const filters = ref({
        status:          '',
        member_search:   '',
        loan_product_id: '' as string | number,
        branch_id:       '' as string | number,
        date_from:       '',
        date_to:         '',
    })

    async function fetch(page = 1) {
        loading.value = true
        try {
            const params: Record<string, any> = { page, per_page: 15 }
            if (filters.value.status)          params.status          = filters.value.status
            if (filters.value.member_search)   params.member_search   = filters.value.member_search
            if (filters.value.loan_product_id) params.loan_product_id = filters.value.loan_product_id
            if (filters.value.branch_id)       params.branch_id       = filters.value.branch_id
            if (filters.value.date_from)       params.date_from       = filters.value.date_from
            if (filters.value.date_to)         params.date_to         = filters.value.date_to

            const res = await loanApplicationsApi.list(params)
            applications.value = res.data?.data ?? []
            if (res.data?.meta) meta.value = res.data.meta
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Failed to load loan applications.')
        } finally {
            loading.value = false
        }
    }

    function handleSearch() {
        void fetch(1)
    }

    function handleFilter() {
        void fetch(1)
    }

    function handlePageChange(page: number) {
        void fetch(page)
    }

    function clearFilters() {
        filters.value = { status: '', member_search: '', loan_product_id: '', branch_id: '', date_from: '', date_to: '' }
        void fetch(1)
    }

    async function fetchProducts() {
        try {
            const res = await loanProductsApi.list({ is_active: '1', per_page: 200 })
            products.value = res.data?.data ?? []
        } catch {
            // non-blocking
        }
    }

    async function fetchBranches() {
        try {
            const res = await tenantClient.get('/branches')
            branches.value = res.data?.data ?? []
        } catch {
            // non-blocking
        }
    }

    // ─── Navigation ───────────────────────────────────────────────────────────
    function openCreate() {
        router.push({ name: 'tenant-loans-create' })
    }

    function openView(application: LoanApplication) {
        router.push({ name: 'tenant-loans-show', params: { id: application.id } })
    }

    function openEdit(application: LoanApplication) {
        router.push({ name: 'tenant-loans-edit', params: { id: application.id } })
    }

    // ─── Delete ───────────────────────────────────────────────────────────────
    const showDeleteDialog = ref(false)
    const deleteTarget     = ref<LoanApplication | null>(null)
    const deleting         = ref(false)

    function openDeleteDialog(application: LoanApplication) {
        deleteTarget.value     = application
        showDeleteDialog.value = true
    }

    async function confirmDelete() {
        if (!deleteTarget.value?.id) return
        deleting.value = true
        try {
            await loanApplicationsApi.cancel(deleteTarget.value.id)
            toast.success('Loan application cancelled.')
            await fetch(meta.value.current_page)
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Failed to cancel loan application.')
        } finally {
            deleting.value         = false
            showDeleteDialog.value = false
            deleteTarget.value     = null
        }
    }

    onMounted(() => { void fetch(1); void fetchProducts(); void fetchBranches() })

    return {
        applications, loading, filters, meta, pages, products, branches,
        fetch,
        handleSearch, handleFilter, handlePageChange, clearFilters,
        openCreate, openView, openEdit,
        showDeleteDialog, deleteTarget, deleting,
        openDeleteDialog, confirmDelete,
    }
}
