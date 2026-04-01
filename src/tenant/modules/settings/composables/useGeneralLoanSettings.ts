import { ref, reactive } from 'vue'
import { toast } from 'vue-sonner'
import { loanSettingsApi, type LoanSetting } from '@/tenant/apis/settings/loanSettingsApi'

export function useGeneralLoanSettings() {
  const showDrawer = ref(false)
  const loading = ref(false)
  const saving = ref(false)

  const form = reactive({
    charge_deduction_mode: 'deduct_from_principal',
    min_approvers: 1,
    max_approvers: 3,
    allow_top_up: true,
    allow_reschedule: true,
    auto_penalty: true,
    penalty_grace_days: 0,
    loan_cycle_limit: 1,
  })

  async function openDrawer() {
    showDrawer.value = true
    await fetchSettings()
  }

  function closeDrawer() {
    showDrawer.value = false
  }

  async function fetchSettings() {
    loading.value = true
    try {
      const res = await loanSettingsApi.get()
      if (res.data?.data) {
        Object.assign(form, res.data.data)
      }
    } catch (error) {
      toast.error('Failed to load loan settings.')
    } finally {
      loading.value = false
    }
  }

  async function save() {
    saving.value = true
    try {
      const res = await loanSettingsApi.update(form)
      if (res.data?.data) {
        Object.assign(form, res.data.data)
      }
      toast.success('Loan settings saved successfully.')
      closeDrawer()
    } catch (error) {
      toast.error('Failed to save loan settings.')
    } finally {
      saving.value = false
    }
  }

  return {
    showDrawer,
    loading,
    saving,
    form,
    openDrawer,
    closeDrawer,
    save,
  }
}
