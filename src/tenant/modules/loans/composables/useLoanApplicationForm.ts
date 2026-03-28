import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { loanApplicationsApi, type LoanApplication } from '../../../apis/loans/loanApplicationsApi'
import { loanProductsApi, type LoanProduct, type LoanProductPreview } from '../../../apis/loanProducts/loanProductsApi'
import { tenantClient } from '../../../apis/tenantClient'

export interface MemberOption {
    id: number
    name: string
    member_no: string
    savings_account: { account_no: string; balance: number } | null
}

export function createDefaultForm(): Partial<LoanApplication> {
    return {
        member_id:        null,
        loan_product_id:  null,
        branch_id:        null,
        loan_officer_id:  null,
        requested_amount: null,
        requested_term:   null,
        purpose:          '',
        repayment_source: '',
    }
}

// ─── Shared form state & helpers (used by create and edit composables) ────────
export function useLoanApplicationForm() {
    const form            = ref<Partial<LoanApplication>>(createDefaultForm())
    const errors          = ref<Record<string, any>>({})
    const selectedProduct = ref<LoanProduct | null>(null)
    const schedulePreview = ref<LoanProductPreview | null>(null)
    const previewLoading  = ref(false)
    const members         = ref<MemberOption[]>([])
    const products        = ref<LoanProduct[]>([])

    let previewTimer: ReturnType<typeof setTimeout> | null = null

    // ─── Fetch dropdowns ──────────────────────────────────────────────────────
    async function fetchProducts() {
        try {
            const res = await loanProductsApi.list({ is_active: '1', per_page: 200 })
            products.value = res.data?.data ?? []
        } catch {
            toast.error('Failed to load loan products.')
        }
    }

    async function fetchMembers(search?: string) {
        try {
            const res = await tenantClient.get('/loan-applications/member-search', {
                params: search ? { search } : undefined,
            })
            members.value = res.data?.data ?? []
        } catch {
            // silently fail — member search is not blocking
        }
    }

    // ─── Product helpers ──────────────────────────────────────────────────────
    async function loadProduct(productId: number) {
        try {
            const res = await loanProductsApi.get(productId)
            selectedProduct.value = res.data?.data ?? res.data
        } catch {
            selectedProduct.value = null
        }
    }

    async function onProductChange() {
        const productId = form.value.loan_product_id
        if (!productId) {
            selectedProduct.value = null
            schedulePreview.value = null
            return
        }
        await loadProduct(productId)
        if (!form.value.requested_term && selectedProduct.value?.loan_duration) {
            form.value.requested_term = selectedProduct.value.loan_duration
        }
        void triggerPreview()
    }

    // ─── Schedule preview ─────────────────────────────────────────────────────
    async function triggerPreview() {
        if (!selectedProduct.value || !form.value.requested_amount || !form.value.requested_term) {
            schedulePreview.value = null
            return
        }
        previewLoading.value = true
        try {
            const res = await loanProductsApi.preview({
                ...selectedProduct.value,
                preview_amount: form.value.requested_amount,
                preview_term:   form.value.requested_term,
            })
            schedulePreview.value = res.data?.data ?? null
        } catch {
            schedulePreview.value = null
        } finally {
            previewLoading.value = false
        }
    }

    watch(
        [() => form.value.requested_amount, () => form.value.requested_term],
        () => {
            if (previewTimer) clearTimeout(previewTimer)
            previewTimer = setTimeout(() => void triggerPreview(), 350)
        },
    )

    // ─── Validation helper ────────────────────────────────────────────────────
    function fieldError(field: string): string | null {
        const val = errors.value[field]
        return Array.isArray(val) ? val[0] : val ?? null
    }

    return {
        form, errors,
        selectedProduct, schedulePreview, previewLoading,
        members, products,
        fetchProducts, fetchMembers,
        loadProduct, onProductChange,
        fieldError,
    }
}
