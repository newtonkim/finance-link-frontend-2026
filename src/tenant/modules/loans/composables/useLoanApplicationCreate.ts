import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { loanApplicationsApi } from '../../../apis/loans/loanApplicationsApi'
import { useLoanApplicationForm } from './useLoanApplicationForm'

export function useLoanApplicationCreate() {
    const router = useRouter()
    const saving = ref(false)

    const {
        form, errors,
        selectedProduct, schedulePreview, previewLoading,
        eligibilityResult, eligibilityLoading, triggerEligibilityCheck,
        members, products,
        fetchProducts, fetchMembers,
        onProductChange,
        fieldError,
    } = useLoanApplicationForm()

    // ─── Save (create only) ───────────────────────────────────────────────────
    async function save() {
        saving.value = true
        errors.value = {}
        try {
            await loanApplicationsApi.create(form.value)
            toast.success('Loan application saved as draft.')
            router.push({ name: 'tenant-loans' })
        } catch (err: any) {
            if (err?.response?.status === 422) {
                errors.value = err.response.data.errors ?? {}
                toast.error('Please fix the errors below.')
            } else {
                toast.error(err?.response?.data?.message ?? 'Failed to save loan application.')
            }
        } finally {
            saving.value = false
        }
    }

    onMounted(async () => {
        await Promise.all([fetchProducts(), fetchMembers()])
    })

    return {
        saving, errors,
        form,
        selectedProduct, schedulePreview, previewLoading,
        eligibilityResult, eligibilityLoading, triggerEligibilityCheck,
        members, products,
        fetchMembers, onProductChange,
        fieldError,
        save,
    }
}
