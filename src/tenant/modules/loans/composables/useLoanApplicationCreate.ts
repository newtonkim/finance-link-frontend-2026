import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { loanApplicationsApi } from '../../../apis/loans/loanApplicationsApi'
import { useLoanApplicationForm } from './useLoanApplicationForm'
import { tenantClient } from '../../../apis/tenantClient'
import { getLocalValues, keysToUse } from '@/Global/Helpers'

export function useLoanApplicationCreate() {
  const router = useRouter()
  const saving = ref(false)
  const submitting = ref(false)
  const staffOptions = ref<{ id: number; name: string }[]>([])
  const branches = ref<{ id: number; name: string }[]>([])
  const showBranchSelect = ref(false)

  const {
    form,
    errors,
    selectedProduct,
    schedulePreview,
    previewLoading,
    eligibilityResult,
    eligibilityLoading,
    triggerEligibilityCheck,
    members,
    products,
    fetchProducts,
    fetchMembers,
    onProductChange,
    fieldError,
  } = useLoanApplicationForm()

  async function fetchStaff(branchId?: number | null) {
    try {
      const res = await tenantClient.post('/staff/users-drop-down', {
        branch_id: branchId ?? undefined,
      })
      staffOptions.value = res.data?.payload?.data ?? []
    } catch {
      // silently fail
    }
  }

  async function fetchBranches() {
    try {
      const res = await tenantClient.get('/branches')
      branches.value = res.data?.data ?? []

      const activeBranchId = getLocalValues(keysToUse.activeBranch as any)
      if (activeBranchId) {
        form.value.branch_id = Number(activeBranchId)
        showBranchSelect.value = branches.value.length > 1
      } else if (branches.value.length === 1) {
        form.value.branch_id = branches.value[0].id
        showBranchSelect.value = false
      } else if (branches.value.length > 1) {
        showBranchSelect.value = true
      }
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
        const errs = err.response.data.errors ?? {}
        errors.value = errs
        Object.values(errs).forEach((messages: any) => toast.error(messages[0]))
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
        const errs = err.response.data.errors ?? {}
        errors.value = errs
        Object.values(errs).forEach((messages: any) => toast.error(messages[0]))
      } else {
        toast.error(err?.response?.data?.message ?? 'Failed to submit loan application.')
      }
    } finally {
      submitting.value = false
    }
  }

  watch(
    () => form.value.branch_id,
    (branchId, previousBranchId) => {
      if (branchId !== previousBranchId) void fetchStaff(branchId)
    },
  )

  onMounted(async () => {
    await Promise.all([fetchProducts(), fetchMembers(), fetchBranches()])
    await fetchStaff(form.value.branch_id)
  })

  return {
    saving,
    submitting,
    errors,
    form,
    selectedProduct,
    schedulePreview,
    previewLoading,
    eligibilityResult,
    eligibilityLoading,
    triggerEligibilityCheck,
    members,
    products,
    staffOptions,
    branches,
    showBranchSelect,
    fetchMembers,
    onProductChange,
    fieldError,
    save,
    saveAndSubmit,
  }
}
