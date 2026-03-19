import { tenantClient } from '@/tenant/apis/tenantClient'

export interface ReversalTransaction {
  id: number
  reference: string
  receipt_number: string | null
  type: string
  amount: string
  narration: string | null
  transaction_date: string | null
  is_reversed: boolean
  member: { id: number; name: string; member_number: string } | null
  account: { id: number; account_no: string | null; account_type: string | null } | null
}

export interface TransactionReversal {
  id: number
  status: 'pending' | 'approved' | 'rejected'
  narration: string
  rejection_reason: string | null
  approved_at: string | null
  created_at: string
  requested_by: { id: number; name: string; email: string } | null
  approved_by: { id: number; name: string; email: string } | null
  transaction: ReversalTransaction | null
}

export interface ReversalSettings {
  reversal_requires_approval: boolean
  reversal_approver_roles: string[]
  reversal_max_days: number
}

export const reversalsApi = {
  /** Request a reversal for a transaction (narration required) */
  request(transactionId: number, narration: string) {
    return tenantClient.post<{ message: string; reversal: TransactionReversal }>(
      `/transactions/${transactionId}/request-reversal`,
      { narration },
    )
  },

  /** List reversals, optionally filtered by status */
  list(status?: 'pending' | 'approved' | 'rejected') {
    return tenantClient.get<{ data: TransactionReversal[]; meta: any }>(
      '/transaction-reversals',
      { params: status ? { status } : {} },
    )
  },

  /** Approve a pending reversal */
  approve(reversalId: number) {
    return tenantClient.post<{ message: string; reversal: TransactionReversal }>(
      `/transaction-reversals/${reversalId}/approve`,
    )
  },

  /** Reject a pending reversal */
  reject(reversalId: number, rejection_reason: string) {
    return tenantClient.post<{ message: string; reversal: TransactionReversal }>(
      `/transaction-reversals/${reversalId}/reject`,
      { rejection_reason },
    )
  },
}
