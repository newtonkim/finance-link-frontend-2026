import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import type { LoanDetail } from '@/tenant/apis/loans/loansApi'
import { loanSettingsApi } from '@/tenant/apis/settings/loanSettingsApi'
import { loansApi } from '@/tenant/apis/loans/loansApi'
import { licenseState } from '@/tenant/apis/licenseState'

type AllocationOrder =
  | 'principal_interest_penalties_charges'
  | 'interest_principal_penalties_charges'
  | 'penalties_charges_interest_principal'
  | 'penalties_charges_principal_interest'

export function useLoanRepaymentFlows(loan: Ref<LoanDetail | null>, refresh: () => void) {
  // Receive Cash
  const receiveCashModalRef = ref<any>(null)
  const showReceiveCashModal = ref(false)
  const isPostingCash = ref(false)
  const selectedInstallment = ref<any>(null)
  const hasFetchedRepaymentOrder = ref(false)
  const repaymentAllocationOrder = ref<AllocationOrder>('penalties_charges_interest_principal')

  const allocationOrderDisplay = computed(() => {
    const map: Record<AllocationOrder, { label: string; sequence: string }> = {
      principal_interest_penalties_charges: {
        label: 'Case 1',
        sequence: 'Principal -> Interest -> Penalties & Charges',
      },
      interest_principal_penalties_charges: {
        label: 'Case 2',
        sequence: 'Interest -> Principal -> Penalties & Charges',
      },
      penalties_charges_interest_principal: {
        label: 'Case 3',
        sequence: 'Penalties & Charges -> Interest -> Principal',
      },
      penalties_charges_principal_interest: {
        label: 'Case 4',
        sequence: 'Penalties & Charges -> Principal -> Interest',
      },
    }
    return map[repaymentAllocationOrder.value]
  })

  async function fetchRepaymentAllocationOrder() {
    try {
      const res = await loanSettingsApi.get()
      const order = res.data?.data?.repayment_allocation_order
      if (
        order === 'principal_interest_penalties_charges' ||
        order === 'interest_principal_penalties_charges' ||
        order === 'penalties_charges_interest_principal' ||
        order === 'penalties_charges_principal_interest'
      ) {
        repaymentAllocationOrder.value = order
      }
      hasFetchedRepaymentOrder.value = true
    } catch {
      // Keep fallback default; modal still displays deterministic order.
    }
  }

  function openReceiveCash(row: any) {
    if (licenseState.readOnly) return
    selectedInstallment.value = row
    if (!hasFetchedRepaymentOrder.value) {
      void fetchRepaymentAllocationOrder()
    }
    showReceiveCashModal.value = true
    receiveCashModalRef.value?.reset()
  }

  async function handleReceiveCashSubmit(data: any) {
    if (!loan.value || licenseState.readOnly) return
    isPostingCash.value = true

    try {
      const payload = {
        amount: data.amount,
        penalty_charges: data.penalty_charges || 0,
        interest: data.interest || 0,
        principal: data.principal || 0,
        payment_method: 'cash',
        payment_date: data.payment_date,
        loan_officer_id: loan.value.loan_officer_id ?? null,
        notes: data.description,
      }

      await loansApi.postRepayment(loan.value.id, payload)

      if (receiveCashModalRef.value) {
        receiveCashModalRef.value.setSuccess()
      }

      refresh()
    } catch (err) {
      console.error('Failed to post cash repayment:', err)
    } finally {
      isPostingCash.value = false
    }
  }

  // Repay from Savings
  const savingsRepayModalRef = ref<any>(null)
  const showSavingsRepayModal = ref(false)
  const isPostingSavings = ref(false)
  const selectedSavingsInstallment = ref<any>(null)

  function openSavingsRepayment(row: any) {
    if (licenseState.readOnly) return
    selectedSavingsInstallment.value = row
    if (!hasFetchedRepaymentOrder.value) {
      void fetchRepaymentAllocationOrder()
    }
    showSavingsRepayModal.value = true
    savingsRepayModalRef.value?.reset()
  }

  async function handleSavingsRepaySubmit(data: {
    savings_account_id: number
    amount: number
    payment_date: string
    description: string
  }) {
    if (!loan.value || licenseState.readOnly) return
    isPostingSavings.value = true
    try {
      await loansApi.repayFromSavings(loan.value.id, {
        savings_account_id: data.savings_account_id,
        amount: data.amount,
        payment_date: data.payment_date,
        notes: data.description,
      })
      savingsRepayModalRef.value?.setSuccess()
      refresh()
    } catch (err: any) {
      console.error('Failed to post savings repayment:', err)
    } finally {
      isPostingSavings.value = false
    }
  }

  return {
    // Receive Cash
    receiveCashModalRef,
    showReceiveCashModal,
    isPostingCash,
    selectedInstallment,
    hasFetchedRepaymentOrder,
    repaymentAllocationOrder,
    allocationOrderDisplay,
    fetchRepaymentAllocationOrder,
    openReceiveCash,
    handleReceiveCashSubmit,
    // Savings Repay
    savingsRepayModalRef,
    showSavingsRepayModal,
    isPostingSavings,
    selectedSavingsInstallment,
    openSavingsRepayment,
    handleSavingsRepaySubmit,
  }
}
