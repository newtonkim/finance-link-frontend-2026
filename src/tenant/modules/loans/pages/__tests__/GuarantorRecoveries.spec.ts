/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const api = vi.hoisted(() => ({
  guarantorRecoveries: vi.fn(),
  approveGuarantorRecovery: vi.fn(),
  rejectGuarantorRecovery: vi.fn(),
  repayGuarantorRecovery: vi.fn(),
}))
const notify = vi.hoisted(() => vi.fn())

vi.mock('@/tenant/apis/loans', () => ({ loanApplicationsApi: api }))
vi.mock('@/Global/Toasters', () => ({ notify }))
vi.mock('@/stores/tenantUserStore', () => ({
  useTenantUserStore: () => ({ user: { id: 7 }, load: vi.fn() }),
}))
vi.mock('@/Global', () => ({
  formatMoneyValue: (value: number | string) => String(value),
  Spinner: { template: '<div>loading</div>' },
  Modal: {
    props: ['modelValue', 'title', 'actionText'],
    emits: ['update:modelValue', 'submit'],
    template:
      '<div v-if="modelValue"><slot name="body" /><button class="modal-submit" @click="$emit(\'submit\')">{{ actionText }}</button></div>',
  },
}))

import GuarantorRecoveries from '../GuarantorRecoveries.vue'

function recovery(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    code: 'GRC000001',
    status: 'pending_approval',
    loan_id: 9,
    loan_no: 'LN-9',
    member_id: 3,
    borrower_name: 'Jane Borrower',
    requested_amount: 1000,
    borrower_amount: 200,
    guarantor_amount: 800,
    guarantor_amount_formatted: '800.00',
    notes: 'Unreachable',
    initiated_by: 'Maker',
    initiated_by_id: 5,
    initiated_at: '2026-09-01T00:00:00Z',
    approved_by: null,
    approved_at: null,
    rejected_at: null,
    rejection_reason: null,
    executed_at: null,
    recovery_loan: null,
    lines: [
      {
        id: 1,
        source: 'borrower',
        member_id: 3,
        name: 'Jane Borrower',
        savings_account_id: 1,
        group_savings_account_id: null,
        account_no: 'ACC-1',
        amount: 200,
      },
      {
        id: 2,
        source: 'guarantor',
        member_id: 4,
        name: 'Guy Guarantor',
        savings_account_id: 2,
        group_savings_account_id: null,
        account_no: 'ACC-2',
        amount: 800,
      },
    ],
    ...overrides,
  }
}

function mountPage() {
  return mount(GuarantorRecoveries, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
}

describe('GuarantorRecoveries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.guarantorRecoveries.mockResolvedValue({ data: { data: [recovery()] } })
  })

  it('lists proposals waiting for approval with who would pay what', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(api.guarantorRecoveries).toHaveBeenCalledWith({ status: 'pending_approval' })
    expect(wrapper.text()).toContain('GRC000001')
    expect(wrapper.text()).toContain('Guy Guarantor')
    expect(wrapper.text()).toContain('Would take')
  })

  it("shows a group guarantor's share as coming from group savings", async () => {
    api.guarantorRecoveries.mockResolvedValue({
      data: {
        data: [
          recovery({
            lines: [
              {
                id: 3,
                source: 'guarantor',
                member_id: null,
                name: 'Umoja Group',
                savings_account_id: null,
                group_savings_account_id: 12,
                is_group: true,
                account_no: 'GSA-12',
                amount: 400,
              },
            ],
          }),
        ],
      },
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Umoja Group')
    expect(wrapper.text()).toContain('group guarantor')
    expect(wrapper.text()).toContain('GSA-12')
  })

  it('approves a recovery someone else proposed', async () => {
    api.approveGuarantorRecovery.mockResolvedValue({
      data: { message: 'Recovery approved and carried out.' },
    })
    const wrapper = mountPage()
    await flushPromises()

    const approve = wrapper.findAll('button').find((b) => b.text().includes('Approve'))!
    expect(approve.attributes('disabled')).toBeUndefined()
    await approve.trigger('click')
    await flushPromises()

    expect(api.approveGuarantorRecovery).toHaveBeenCalledWith(1)
    expect(notify).toHaveBeenCalledWith({
      type: 'success',
      msg: 'Recovery approved and carried out.',
    })
  })

  it('does not let the proposer approve their own recovery', async () => {
    api.guarantorRecoveries.mockResolvedValue({
      data: { data: [recovery({ initiated_by_id: 7 })] },
    })
    const wrapper = mountPage()
    await flushPromises()

    const approve = wrapper.findAll('button').find((b) => b.text().includes('Approve'))!
    expect(approve.attributes('disabled')).toBeDefined()
  })

  it('records a repayment of an open recovery loan', async () => {
    api.guarantorRecoveries.mockResolvedValue({
      data: {
        data: [
          recovery({
            status: 'executed',
            recovery_loan: {
              status: 'open',
              term_months: 12,
              repaid: 0,
              outstanding: 800,
              outstanding_formatted: '800.00',
              overdue: 0,
              next_due_date: '2026-10-01',
              next_due_amount: 66.66,
            },
          }),
        ],
      },
    })
    api.repayGuarantorRecovery.mockResolvedValue({
      data: { message: 'Repayment recorded and paid to the guarantors.' },
    })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Recovery loans'))!
      .trigger('click')
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Record repayment'))!
      .trigger('click')
    await wrapper.find('input[inputmode="decimal"]').setValue('100')
    await wrapper.find('.modal-submit').trigger('click')
    await flushPromises()

    expect(api.repayGuarantorRecovery).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ amount: 100, payment_mode: 'cash' }),
    )
  })
})
