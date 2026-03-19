import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { reversalsApi, type TransactionReversal } from '@/tenant/apis/reversals/reversalsApi'

export function useReversal(onSuccess?: () => void) {
  // ─── Request drawer state ─────────────────────────────────────────────────
  const showRequestDrawer = ref(false)
  const targetTransaction = ref<any>(null)
  const narration = ref('')
  const requesting = ref(false)
  const pendingApproval = ref(false) // true after submit when approval is required

  function openRequestDrawer(txn: any) {
    if (txn.is_reversed || txn.type === 'reversal' || txn.is_reversible === false) return
    targetTransaction.value = txn
    narration.value = ''
    pendingApproval.value = false
    showRequestDrawer.value = true
  }

  function closeRequestDrawer() {
    showRequestDrawer.value = false
    targetTransaction.value = null
    narration.value = ''
  }

  async function submitRequest() {
    if (!targetTransaction.value || !narration.value.trim()) {
      toast.error('Please provide a reason for the reversal.')
      return
    }

    requesting.value = true
    try {
      const res = await reversalsApi.request(targetTransaction.value.id, narration.value.trim())
      const reversal = res.data.reversal

      if (reversal.status === 'approved') {
        toast.success('Transaction reversed successfully.')
        closeRequestDrawer()
        onSuccess?.()
      } else {
        // pending approval
        pendingApproval.value = true
        toast.success('Reversal request submitted — awaiting approval.')
        closeRequestDrawer()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.errors?.transaction?.[0] ?? 'Failed to request reversal.')
    } finally {
      requesting.value = false
    }
  }

  // ─── Pending reversals panel state ────────────────────────────────────────
  const pendingReversals = ref<TransactionReversal[]>([])
  const loadingPending = ref(false)
  const processingId = ref<number | null>(null)

  // Reject inline state
  const rejectingId = ref<number | null>(null)
  const rejectReason = ref('')

  async function fetchPending() {
    loadingPending.value = true
    try {
      const res = await reversalsApi.list('pending')
      pendingReversals.value = res.data?.data ?? []
    } catch {
      toast.error('Failed to load pending reversals.')
    } finally {
      loadingPending.value = false
    }
  }

  async function approve(reversal: TransactionReversal) {
    processingId.value = reversal.id
    try {
      await reversalsApi.approve(reversal.id)
      toast.success('Reversal approved and applied.')
      pendingReversals.value = pendingReversals.value.filter(r => r.id !== reversal.id)
      onSuccess?.()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to approve reversal.')
    } finally {
      processingId.value = null
    }
  }

  function startReject(reversal: TransactionReversal) {
    rejectingId.value = reversal.id
    rejectReason.value = ''
  }

  function cancelReject() {
    rejectingId.value = null
    rejectReason.value = ''
  }

  async function confirmReject(reversal: TransactionReversal) {
    if (!rejectReason.value.trim()) {
      toast.error('Please provide a rejection reason.')
      return
    }
    processingId.value = reversal.id
    try {
      await reversalsApi.reject(reversal.id, rejectReason.value.trim())
      toast.success('Reversal request rejected.')
      pendingReversals.value = pendingReversals.value.filter(r => r.id !== reversal.id)
      cancelReject()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to reject reversal.')
    } finally {
      processingId.value = null
    }
  }

  return {
    // Request drawer
    showRequestDrawer, targetTransaction, narration, requesting, pendingApproval,
    openRequestDrawer, closeRequestDrawer, submitRequest,
    // Pending panel
    pendingReversals, loadingPending, processingId,
    rejectingId, rejectReason,
    fetchPending, approve, startReject, cancelReject, confirmReject,
  }
}
