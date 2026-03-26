import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { loanProductsApi, type LoanProduct } from '../../../apis/loanProducts/loanProductsApi'

export function useLoanProductForm() {
    const route  = useRoute()
    const router = useRouter()

    // ─── Mode & state ─────────────────────────────────────────────────────────
    const isEditing = computed(() => !!route.params.id)
    const loading   = ref(false)
    const saving    = ref(false)
    const errors    = ref<Record<string, any>>({})

    const form = ref<LoanProduct>({
        name:            '',
        min_amount:      null,
        max_amount:      null,
        interest_rate:   null,
        interest_method: null,
        interest_period: null,
        loan_duration:   null,
        duration_type:   null,
        repayment_cycle: null,
        min_guarantors:  null,
        max_guarantors:  null,
        grace_period:    null,
        penalty_rate:    null,
        penalty_type:    null,
        is_active:       true,
        penalty_rules:   [],
    })

    // ─── Load (edit mode) ─────────────────────────────────────────────────────
    async function loadProduct() {
        if (!isEditing.value) return
        loading.value = true
        try {
            const res = await loanProductsApi.get(Number(route.params.id))
            const p   = res.data?.data ?? res.data
            form.value = { ...form.value, ...p, penalty_rules: p.penalty_rules ?? [] }
        } catch (err: any) {
            toast.error('Failed to load loan product.')
            router.push({ name: 'tenant-settings-loan-products' })
        } finally {
            loading.value = false
        }
    }

    onMounted(loadProduct)

    // ─── Penalty rules ────────────────────────────────────────────────────────
    function addPenaltyRule() {
        form.value.penalty_rules!.push({
            penalty_type: '',
            penalty_rate: null,
            grace_days:   null,
            amount:       null,
        })
    }

    function removePenaltyRule(index: number) {
        form.value.penalty_rules!.splice(index, 1)
    }

    // ─── Validation helpers ───────────────────────────────────────────────────
    function fieldError(field: string): string | null {
        const val = errors.value[field]
        return Array.isArray(val) ? val[0] : val ?? null
    }

    // ─── Save ─────────────────────────────────────────────────────────────────
    async function save() {
        saving.value  = true
        errors.value  = {}
        try {
            if (isEditing.value) {
                await loanProductsApi.update(Number(route.params.id), form.value)
                toast.success('Loan product updated successfully.')
            } else {
                await loanProductsApi.create(form.value)
                toast.success('Loan product created successfully.')
            }
            router.push({ name: 'tenant-settings-loan-products' })
        } catch (err: any) {
            if (err?.response?.status === 422) {
                errors.value = err.response.data.errors ?? {}
            } else {
                toast.error(err?.response?.data?.message ?? 'Failed to save loan product.')
            }
        } finally {
            saving.value = false
        }
    }

    return {
        isEditing, loading, saving, errors, form,
        addPenaltyRule, removePenaltyRule,
        fieldError, save,
    }
}
