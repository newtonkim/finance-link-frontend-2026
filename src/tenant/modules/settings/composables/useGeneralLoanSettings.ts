import { ref, reactive } from 'vue'
import { toast } from 'vue-sonner'
import { loanSettingsApi, type LoanSetting } from '@/tenant/apis/settings/loanSettingsApi'

export type RepaymentAllocationOrder = LoanSetting['repayment_allocation_order']

export interface RepaymentAllocationOption {
  value: RepaymentAllocationOrder
  title: string
  sequence: string
  help: string
}

interface LoanSettingsForm {
  charge_deduction_mode: string
  repayment_allocation_order: RepaymentAllocationOrder
  min_approvers: number
  max_approvers: number
  allow_top_up: boolean
  allow_reschedule: boolean
  auto_penalty: boolean
  penalty_grace_days: number
  loan_cycle_limit: number
  topup_repayment_basis: 'principal' | 'principal_interest' | 'outstanding_balance'
  topup_min_percentage: number
  topup_auto_disbursement: boolean
}

export function useGeneralLoanSettings() {
  const showDrawer = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const hasLoaded = ref(false)
  const baseline = ref('')

  const repaymentAllocationOptions: RepaymentAllocationOption[] = [
    {
      value: 'principal_interest_penalties_charges',
      title: 'Case 1',
      sequence: 'Principal -> Interest -> Penalties & Charges',
      help: 'Clear principal first, then interest, then penalties and charges.',
    },
    {
      value: 'interest_principal_penalties_charges',
      title: 'Case 2',
      sequence: 'Interest -> Principal -> Penalties & Charges',
      help: 'Clear interest first, then principal, then penalties and charges.',
    },
    {
      value: 'penalties_charges_interest_principal',
      title: 'Case 3',
      sequence: 'Penalties & Charges -> Interest -> Principal',
      help: 'Clear penalties and charges first, then interest, then principal.',
    },
    {
      value: 'penalties_charges_principal_interest',
      title: 'Case 4',
      sequence: 'Penalties & Charges -> Principal -> Interest',
      help: 'Clear penalties and charges first, then principal, then interest.',
    },
  ]

  const form = reactive<LoanSettingsForm>({
    charge_deduction_mode: 'deduct_from_principal',
    repayment_allocation_order: 'penalties_charges_interest_principal',
    min_approvers: 1,
    max_approvers: 3,
    allow_top_up: false,
    allow_reschedule: false,
    auto_penalty: true,
    penalty_grace_days: 0,
    loan_cycle_limit: 1,
    topup_repayment_basis: 'principal_interest',
    topup_min_percentage: 40,
    topup_auto_disbursement: false,
  })

  function toPayload(): LoanSettingsForm {
    return {
      charge_deduction_mode: form.charge_deduction_mode,
      repayment_allocation_order: form.repayment_allocation_order,
      min_approvers: Number(form.min_approvers ?? 1),
      max_approvers: Number(form.max_approvers ?? 1),
      allow_top_up: Boolean(form.allow_top_up),
      allow_reschedule: Boolean(form.allow_reschedule),
      auto_penalty: Boolean(form.auto_penalty),
      penalty_grace_days: Number(form.penalty_grace_days ?? 0),
      loan_cycle_limit: Number(form.loan_cycle_limit ?? 1),
      topup_repayment_basis: form.topup_repayment_basis,
      topup_min_percentage: Number(form.topup_min_percentage ?? 40),
      topup_auto_disbursement: Boolean(form.topup_auto_disbursement),
    }
  }

  function snapshot(value: LoanSettingsForm): string {
    return JSON.stringify(value)
  }

  async function openDrawer() {
    showDrawer.value = true
    await fetchSettings()
  }

  function closeDrawer() {
    showDrawer.value = false
  }

  async function fetchSettings(force = false) {
    if (loading.value) return
    if (!force && hasLoaded.value) return

    loading.value = true
    try {
      const res = await loanSettingsApi.get({ force })
      if (res.data?.data) {
        Object.assign(form, res.data.data)
        baseline.value = snapshot(toPayload())
        hasLoaded.value = true
      }
    } catch (error) {
      toast.error('Failed to load loan settings.')
    } finally {
      loading.value = false
    }
  }

  async function save() {
    if (saving.value) return

    const payload = toPayload()
    if (baseline.value && snapshot(payload) === baseline.value) {
      closeDrawer()
      return
    }

    saving.value = true
    try {
      const res = await loanSettingsApi.update(payload)
      if (res.data?.data) {
        Object.assign(form, res.data.data)
        baseline.value = snapshot(toPayload())
        hasLoaded.value = true
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
    repaymentAllocationOptions,
    fetchSettings,
    openDrawer,
    closeDrawer,
    save,
  }
}
