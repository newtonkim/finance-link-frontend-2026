import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { tenantClient } from '@/tenant/apis/tenantClient';

export interface StatementTransaction {
  id: number;
  date: string;
  description: string;
  credit: number;
  debit: number;
  running_balance: number;
  is_reversal: boolean;
}

export interface AccountStatement {
  account:  { id: number; account_no: string | null; account_type: string; product_name: string | null };
  member:   { id: number; name: string; member_number: string; address: string | null; address_city: string | null };
  branch:   { name: string | null };
  period:   { date_from: string; date_to: string; statement_date: string };
  balances: { opening: number; total_credit: number; total_debit: number; closing: number; count: number };
  transactions: StatementTransaction[];
  warnings: string[];
}

export function useAccountStatement(
  accountId: Ref<number | null>,
  dateFrom: Ref<string>,
  dateTo: Ref<string>,
) {
  const statement = ref<AccountStatement | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function refresh() {
    if (!accountId.value) { statement.value = null; return; }
    loading.value = true;
    error.value = null;
    try {
      const { data } = await tenantClient.get(
        `/reports/savings-account-statement/${accountId.value}`,
        { params: { date_from: dateFrom.value, date_to: dateTo.value } },
      );
      statement.value = data as AccountStatement;
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Could not load statement.';
      statement.value = null;
    } finally {
      loading.value = false;
    }
  }

  watch([accountId, dateFrom, dateTo], () => { refresh(); }, { immediate: true });

  return { statement, loading, error, refresh };
}
