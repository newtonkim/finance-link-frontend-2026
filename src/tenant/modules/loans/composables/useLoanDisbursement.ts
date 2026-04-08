import { ref, reactive, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { loanApplicationsApi, type LoanApplication } from '@/tenant/apis/loans/loanApplicationsApi'

interface DisburseForm {
    disbursement_method: string
    disbursement_reference: string
    disbursement_date: string
    notes: string
    savings_account_id?: number | null
    mobile_money_provider?: string | null
    mobile_money_number?: string | null
    charge_deduction_mode?: string | null
}

export function useLoanDisbursement(
    application: Ref<LoanApplication | null>,
    onSuccess: () => void,
) {
    const router = useRouter()

    const showDisburseModal = ref(false)
    const disbursing = ref(false)
    const disburseErrors = reactive<Record<string, string>>({})

    const disburseForm = reactive<DisburseForm>({
        disbursement_method: 'cash',
        disbursement_reference: '',
        disbursement_date: new Date().toISOString().slice(0, 10),
        notes: '',
        savings_account_id: null,
        mobile_money_provider: null,
        mobile_money_number: null,
        charge_deduction_mode: 'deduct_from_principal',
    })

    function openDisburseModal() {
        disburseForm.disbursement_method = 'cash'
        disburseForm.disbursement_reference = ''
        disburseForm.disbursement_date = new Date().toISOString().slice(0, 10)
        disburseForm.notes = ''
        disburseForm.savings_account_id = null
        disburseForm.mobile_money_provider = null
        disburseForm.mobile_money_number = null
        disburseForm.charge_deduction_mode = 'deduct_from_principal'
        Object.keys(disburseErrors).forEach(k => delete disburseErrors[k])
        showDisburseModal.value = true
    }

    async function submitDisburse() {
        if (!application.value?.id) return
        disbursing.value = true
        Object.keys(disburseErrors).forEach(k => delete disburseErrors[k])

        try {
            const res = await loanApplicationsApi.disburse(application.value.id, {
                disbursement_method: disburseForm.disbursement_method,
                disbursement_reference: disburseForm.disbursement_reference || null,
                disbursement_date: disburseForm.disbursement_date || null,
                notes: disburseForm.notes || null,
                charge_deduction_mode: disburseForm.charge_deduction_mode || null,
                ...(disburseForm.disbursement_method === 'savings_account' ? { savings_account_id: disburseForm.savings_account_id } : {}),
                ...(disburseForm.disbursement_method === 'mobile_money' ? { mobile_money_provider: disburseForm.mobile_money_provider, mobile_money_number: disburseForm.mobile_money_number } : {}),
            })

            const loan = res.data?.data
            const warnings = loan?.disbursement_warnings || []
            if (warnings.length > 0) {
                warnings.forEach((w: string) => toast.warning(w, { duration: 8000 }))
            } else {
                toast.success('Loan disbursed successfully.')
            }

            showDisburseModal.value = false
            onSuccess()

            // Navigate to the created loan account
            if (loan?.id) {
                router.push({ name: 'tenant-loan-account', params: { id: loan.id } })
            }
        } catch (e: any) {
            const errs = e?.response?.data?.errors ?? {}
            Object.assign(disburseErrors, errs)
            const msg = e?.response?.data?.message
            if (msg && !Object.keys(errs).length) {
                toast.error(msg)
            } else if (!msg && !Object.keys(errs).length) {
                toast.error('Failed to process disbursement.')
            }
        } finally {
            disbursing.value = false
        }
    }

    return {
        showDisburseModal,
        disbursing,
        disburseForm,
        disburseErrors,
        openDisburseModal,
        submitDisburse,
    }
}
