import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { loanApplicationsApi } from '../../../apis/loans/loanApplicationsApi'
import { useLoanApplicationForm } from './useLoanApplicationForm'
import { tenantClient } from '../../../apis/tenantClient'

export function useLoanApplicationCreate() {
    const router    = useRouter()
    const saving    = ref(false)
    const submitting = ref(false)
    const staffOptions = ref<{ id: number; name: string }[]>([])

    const {
        form, errors,
        selectedProduct, schedulePreview, previewLoading,
        eligibilityResult, eligibilityLoading, triggerEligibilityCheck,
        members, products,
        fetchProducts, fetchMembers,
        onProductChange,
        fieldError,
    } = useLoanApplicationForm()

    async function fetchStaff() {
        try {
            const res = await tenantClient.post('/staff/users-drop-down', {})
            staffOptions.value = res.data?.payload?.data ?? []
        } catch {
            // silently fail
        }
    }

    // ─── Save (draft only) ────────────────────────────────────────────────────
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

    // ─── Save then immediately submit ─────────────────────────────────────────
    async function saveAndSubmit() {
        submitting.value = true
        errors.value = {}
        try {
            const createRes = await loanApplicationsApi.create(form.value)
            const id = createRes.data?.data?.id ?? createRes.data?.id
            await loanApplicationsApi.submit(id)
            toast.success('Loan application submitted for review.')
            router.push({ name: 'tenant-loans-show', params: { id } })
        } catch (err: any) {
            if (err?.response?.status === 422) {
                errors.value = err.response.data.errors ?? {}
                toast.error('Please fix the errors below.')
            } else {
                toast.error(err?.response?.data?.message ?? 'Failed to submit loan application.')
            }
        } finally {
            submitting.value = false
        }
    }

    onMounted(async () => {
        await Promise.all([fetchProducts(), fetchMembers(), fetchStaff()])
    })

    return {
        saving, submitting, errors,
        form,
        selectedProduct, schedulePreview, previewLoading,
        eligibilityResult, eligibilityLoading, triggerEligibilityCheck,
        members, products, staffOptions,
        fetchMembers, onProductChange,
        fieldError,
        save, saveAndSubmit,
    }
}
