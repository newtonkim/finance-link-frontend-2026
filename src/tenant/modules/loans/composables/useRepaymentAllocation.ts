import { ref, reactive } from 'vue'
import { toast } from 'vue-sonner'
import { loansApi, type RepaymentPreview, type PostRepaymentData } from '@/tenant/apis/loans/loansApi'

export function useRepaymentAllocation(loanId: number) {
    const showModal = ref(false)
    const posting = ref(false)
    const previewing = ref(false)

    const form = reactive<PostRepaymentData>({
        amount: '',
        payment_method: 'cash',
        payment_date: new Date().toISOString().slice(0, 10),
        receipt_no: null,
        transaction_ref: null,
        notes: null,
    })

    const errors = ref<Record<string, string | string[]>>({})
    const preview = ref<RepaymentPreview | null>(null)

    function openModal() {
        form.amount = ''
        form.payment_method = 'cash'
        form.payment_date = new Date().toISOString().slice(0, 10)
        form.receipt_no = null
        form.transaction_ref = null
        form.notes = null
        errors.value = {}
        preview.value = null
        showModal.value = true
    }

    function closeModal() {
        showModal.value = false
        preview.value = null
    }

    async function loadPreview() {
        const amount = parseFloat(String(form.amount))
        if (!amount || amount <= 0) {
            preview.value = null
            return
        }

        previewing.value = true
        try {
            const res = await loansApi.previewRepayment(loanId, amount)
            preview.value = res.data.data
        } catch {
            preview.value = null
        } finally {
            previewing.value = false
        }
    }

    async function submit(onSuccess?: () => void) {
        posting.value = true
        errors.value = {}
        try {
            await loansApi.postRepayment(loanId, form)
            toast.success('Repayment posted successfully.')
            closeModal()
            onSuccess?.()
        } catch (err: any) {
            const data = err?.response?.data
            if (data?.errors) {
                errors.value = data.errors
            } else {
                toast.error(data?.message ?? 'Failed to post repayment.')
            }
        } finally {
            posting.value = false
        }
    }

    function errMsg(field: string): string | null {
        const e = errors.value[field]
        return e ? (Array.isArray(e) ? e[0] : e) : null
    }

    return {
        showModal, posting, previewing,
        form, errors, preview,
        openModal, closeModal, loadPreview, submit, errMsg,
    }
}
