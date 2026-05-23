import { describe, it, expect, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import { useAccountStatement } from '../profile/composables/useAccountStatement';

vi.mock('@/tenant/apis/tenantClient', () => ({
  tenantClient: {
    get: vi.fn(() => Promise.resolve({ data: {
      account: { id: 1, account_no: 'SA-1', account_type: 'Voluntary', product_name: 'X' },
      member: { id: 1, name: 'Maya', member_number: 'M1', address: 'A', address_city: null },
      branch: { name: 'Main' },
      period: { date_from: '2026-02-01', date_to: '2026-02-28', statement_date: '2026-02-28' },
      balances: { opening: 0, total_credit: 100, total_debit: 0, closing: 100, count: 1 },
      transactions: [{ id: 1, date: '2026-02-15', description: 'Savings Deposit', credit: 100, debit: 0, running_balance: 100, is_reversal: false }],
      warnings: [],
    }})),
  },
}));

describe('useAccountStatement', () => {
  it('fetches and exposes the statement reactive state', async () => {
    const accountId = ref<number | null>(1);
    const from = ref('2026-02-01');
    const to = ref('2026-02-28');

    const { statement, loading, error, refresh } = useAccountStatement(accountId, from, to);

    await refresh();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(statement.value?.balances.closing).toBe(100);
  });
});
