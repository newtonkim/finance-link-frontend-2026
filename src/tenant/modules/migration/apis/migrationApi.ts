import { tenantClient } from '@/tenant/apis/tenantClient'

export interface MigrationImportResult {
  message: string
  imported: number
  errors: string[]
}

export const migrationApi = {
  downloadOpeningBalancesTemplate: () =>
    tenantClient.get('migration/opening-balances/template', { responseType: 'blob' }),

  downloadTransactionHistoryTemplate: () =>
    tenantClient.get('migration/transactions/template', { responseType: 'blob' }),

  importOpeningBalancesJson: (rows: Record<string, string>[]) =>
    tenantClient.post<MigrationImportResult>('migration/opening-balances/import-json', { rows }),

  importTransactionHistoryJson: (rows: Record<string, string>[]) =>
    tenantClient.post<MigrationImportResult>('migration/transactions/import-json', { rows }),
}
