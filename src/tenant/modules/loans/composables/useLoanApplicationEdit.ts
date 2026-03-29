import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { loanApplicationsApi } from '../../../apis/loans/loanApplicationsApi'
import { useLoanApplicationForm, createDefaultForm } from './useLoanApplicationForm'

export function useLoanApplicationEdit() {
    const route  = useRoute()
    const router = useRouter()

    const loading    = ref(false)
    const saving     = ref(false)
    const submitting = ref(false)

    const {
        form, errors,
        selectedProduct, schedulePreview, previewLoading,
        eligibilityResult, eligibilityLoading, triggerEligibilityCheck,
        members, products,
        fetchProducts, fetchMembers, loadProduct,
        onProductChange,
        fieldError,
    } = useLoanApplicationForm()

    // ─── Load existing application ────────────────────────────────────────────
    async function loadApplication() {
        loading.value = true
        try {
            const res  = await loanApplicationsApi.get(Number(route.params.id))
            const data = res.data?.data ?? res.data

            if (data.status && data.status !== 'draft') {
                toast.error('Only draft applications can be edited.')
                router.replace({ name: 'tenant-loans-show', params: { id: route.params.id } })
                return
            }

            form.value = { ...createDefaultForm(), ...data }
            if (form.value.loan_product_id) {
                await loadProduct(form.value.loan_product_id)
            }
        } catch {
            toast.error('Failed to load loan application.')
            router.push({ name: 'tenant-loans' })
        } finally {
            loading.value = false
        }
    }

    function buildPayload() {
        return {
            member_id:        form.value.member_id,
            loan_product_id:  form.value.loan_product_id,
            branch_id:        form.value.branch_id,
            loan_officer_id:  form.value.loan_officer_id,
            requested_amount: form.value.requested_amount,
            requested_term:   form.value.requested_term,
            purpose:          form.value.purpose,
            repayment_source: form.value.repayment_source,
        }
    }

    // ─── Save (update only) ───────────────────────────────────────────────────
    async function save() {
        saving.value = true
        errors.value = {}
        try {
            await loanApplicationsApi.update(Number(route.params.id), buildPayload())
            toast.success('Loan application updated.')
        } catch (err: any) {
            if (err?.response?.status === 422) {
                const errs = err.response.data.errors ?? {}
                errors.value = errs
                const statusErr = errs.status?.[0]
                if (statusErr) {
                    toast.error(statusErr)
                    router.replace({ name: 'tenant-loans-show', params: { id: route.params.id } })
                } else {
                    toast.error('Please fix the errors below.')
                }
            } else {
                toast.error(err?.response?.data?.message ?? 'Failed to save loan application.')
            }
        } finally {
            saving.value = false
        }
    }

    // ─── Submit for review ────────────────────────────────────────────────────
    async function submit() {
        submitting.value = true
        errors.value     = {}
        try {
            await loanApplicationsApi.update(Number(route.params.id), buildPayload())
            await loanApplicationsApi.submit(Number(route.params.id))
            toast.success('Loan application submitted successfully.')
            router.push({ name: 'tenant-loans-show', params: { id: route.params.id } })
        } catch (err: any) {
            if (err?.response?.status === 422) {
                errors.value = err.response.data.errors ?? {}
                toast.error('Please fix the errors before submitting.')
            } else {
                toast.error(err?.response?.data?.message ?? 'Failed to submit loan application.')
            }
        } finally {
            submitting.value = false
        }
    }

    onMounted(async () => {
        await Promise.all([loadApplication(), fetchProducts(), fetchMembers()])
    })

    return {
        loading, saving, submitting, errors,
        form,
        selectedProduct, schedulePreview, previewLoading,
        eligibilityResult, eligibilityLoading, triggerEligibilityCheck,
        members, products,
        fetchMembers, onProductChange,
        fieldError,
        save, submit,
    }
}
