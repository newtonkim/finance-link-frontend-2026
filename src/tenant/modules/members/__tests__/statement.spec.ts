/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { tenantClient } from '@/tenant/apis/tenantClient';
import type { Mock } from 'vitest';
import Statement from '../profile/statement.vue';

const fixture = {
  account: { id: 1, account_no: 'SA-001', account_type: 'Voluntary', product_name: 'General' },
  member:  { id: 1, name: 'Maya Nyamu', member_number: 'MBRC-001', address: 'Kibada St', address_city: null },
  branch:  { name: 'Main branch' },
  period:  { date_from: '2026-02-01', date_to: '2026-02-28', statement_date: '2026-02-28' },
  balances:{ opening: 100, total_credit: 500, total_debit: 50, closing: 550, count: 2 },
  transactions: [
    { id: 1, date: '2026-02-05', description: 'Savings Deposit', credit: 500, debit: 0, running_balance: 600, is_reversal: false },
    { id: 2, date: '2026-02-10', description: 'Charge',          credit: 0, debit: 50, running_balance: 550, is_reversal: false },
  ],
  warnings: [],
};

vi.mock('@/tenant/apis/tenantClient', () => ({
  tenantClient: { get: vi.fn(() => Promise.resolve({ data: fixture })) },
}));

vi.mock('@/Global', () => ({
  formatCurrency: (n: number) => n.toFixed(2),
  formatDateUs: (d: string) => d,
  printElementId: vi.fn(),
}));

vi.mock('lucide-vue-next', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual, Printer: { template: '<span />' } };
});

describe('statement.vue', () => {
  it('renders header fields and reconciled totals from the API', async () => {
    const wrapper = mount(Statement, {
      props: { data: { savings_accounts: [{ id: 1, account_no: 'SA-001', account_type: 'Voluntary' }] } },
    });
    await flushPromises();
    expect(wrapper.text()).toContain('SA-001');
    expect(wrapper.text()).toContain('Maya Nyamu');
    expect(wrapper.text()).toContain('Main branch');
    expect(wrapper.text()).toContain('550.00');         // closing
    expect(wrapper.text()).toContain('End of Transactions');
    expect((tenantClient.get as Mock).mock.calls[0]?.[0]).toContain('savings-account-statement/1');
  });

  it('renders empty Credit cell for debit rows and vice versa', async () => {
    const wrapper = mount(Statement, {
      props: { data: { savings_accounts: [{ id: 1, account_no: 'SA-001', account_type: 'Voluntary' }] } },
    });
    await flushPromises();
    const rows = wrapper.findAll('tbody tr');
    // first transaction row: credit=500, debit empty
    expect(rows[0].html()).toContain('500.00');
    expect(rows[0].findAll('td')[3].text()).toBe(''); // debit empty
    // second row is credit=0, debit=50: credit cell (col index 2) should be empty
    expect(rows[1].html()).toContain('50.00');
    expect(rows[1].findAll('td')[2].text()).toBe('');
  });
});
