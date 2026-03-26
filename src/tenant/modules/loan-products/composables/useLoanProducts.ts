import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { loanProductsApi, type LoanProduct } from '../../../apis/loanProducts/loanProductsApi'

export function useLoanProducts() {
    const router = useRouter()

    // ─── List state ───────────────────────────────────────────────────────────
    const products = ref<LoanProduct[]>([])
    const loading  = ref(false)
    const search   = ref('')
    const meta     = ref({ current_page: 1, last_page: 1, total: 0 })
    const pages    = computed(() => Array.from({ length: meta.value.last_page }, (_, i) => i + 1))
    let searchTimer: ReturnType<typeof setTimeout> | null = null

    async function fetch(page = 1) {
        loading.value = true
        try {
            const res = await loanProductsApi.list({ search: search.value || undefined, page })
            products.value = res.data?.data ?? []
            if (res.data?.meta) meta.value = res.data.meta
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Failed to load loan products.')
        } finally {
            loading.value = false
        }
    }

    watch(search, () => {
        if (searchTimer) clearTimeout(searchTimer)
        searchTimer = setTimeout(() => fetch(1), 400)
    })

    onMounted(() => fetch(1))

    // ─── Navigation ───────────────────────────────────────────────────────────
    function openCreate() {
        router.push({ name: 'tenant-settings-loan-products-create' })
    }

    function openEdit(product: LoanProduct) {
        router.push({ name: 'tenant-settings-loan-products-edit', params: { id: product.id } })
    }

    // ─── Delete ───────────────────────────────────────────────────────────────
    const showDeleteDialog = ref(false)
    const deleteTarget     = ref<LoanProduct | null>(null)
    const deleting         = ref(false)

    function openDeleteDialog(product: LoanProduct) {
        deleteTarget.value     = product
        showDeleteDialog.value = true
    }

    async function confirmDelete() {
        if (!deleteTarget.value?.id) return
        deleting.value = true
        try {
            await loanProductsApi.destroy(deleteTarget.value.id)
            toast.success('Loan product deleted.')
            await fetch(meta.value.current_page)
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Failed to delete loan product.')
        } finally {
            deleting.value         = false
            showDeleteDialog.value = false
            deleteTarget.value     = null
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function interestMethodLabel(method: string | null | undefined) {
        if (method === 'flat') return 'Flat Rate'
        if (method === 'reducing_balance') return 'Reducing Balance'
        return '—'
    }

    return {
        products, loading, search, meta, pages,
        fetch,
        openCreate, openEdit,
        showDeleteDialog, deleteTarget, deleting,
        openDeleteDialog, confirmDelete,
        interestMethodLabel,
    }
}
