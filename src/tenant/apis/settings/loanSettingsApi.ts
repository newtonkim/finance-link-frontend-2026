import { tenantClient } from '../tenantClient'

export interface LoanSetting {
  id: number
  branch_id: number
  min_approvers: number
  max_approvers: number

  auto_penalty: boolean
  penalty_grace_days: number
  loan_cycle_limit: number
  charge_deduction_mode: string
}

export const loanSettingsApi = {
  get() {
    return tenantClient.get<{ data: LoanSetting }>('/loan-settings')
  },

  update(data: Partial<LoanSetting>) {
    return tenantClient.put<{ message: string; data: LoanSetting }>('/loan-settings', data)
  },
}
