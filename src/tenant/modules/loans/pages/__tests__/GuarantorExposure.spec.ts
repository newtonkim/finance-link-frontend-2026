/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const api = vi.hoisted(() => ({
  guarantorExposure: vi.fn(),
  guarantorPendingConsents: vi.fn(),
  guarantorReleaseRequests: vi.fn(),
}))

vi.mock('@/tenant/apis/loans', () => ({ loanApplicationsApi: api }))
vi.mock('@/Global/Toasters', () => ({ notify: vi.fn() }))
vi.mock('@/Global', () => ({
  formatMoneyValue: (value: number | string) => String(value),
  Spinner: { template: '<div>loading</div>' },
}))

import GuarantorExposure from '../GuarantorExposure.vue'

function mountPage() {
  return mount(GuarantorExposure, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
}

describe('GuarantorExposure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.guarantorExposure.mockResolvedValue({
      data: {
        data: [
          {
            guarantor_type: 'individual',
            guarantor_id: 1,
            name: 'Ann Guarantor',
            code: 'M001',
            guarantees: 2,
            pledged_amount: 800,
            held_amount: 800,
            held_amount_formatted: '800.00',
            savings_balance: 850,
            held_share: 94.1,
            overdue_loans: 1,
            recovered_to_date: 0,
            release_requested: true,
          },
        ],
      },
    })
    api.guarantorReleaseRequests.mockResolvedValue({
      data: {
        data: [
          {
            id: 5,
            loan_id: 9,
            loan_no: 'LN-9',
            loan_application_id: 3,
            borrower_name: 'Bob',
            guarantor_type: 'individual',
            name: 'Ann Guarantor',
            guarantee_amount: 400,
            guarantee_amount_formatted: '400.00',
            release_requested_at: '2026-09-01T00:00:00Z',
            release_request_reason: 'Moving abroad',
            replacement_pending: null,
          },
        ],
      },
    })
  })

  it("shows each guarantor's exposure, flagging a nearly fully held one", async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Ann Guarantor')
    expect(wrapper.text()).toContain('94.1%')
    expect(wrapper.text()).toContain('asked to be replaced')
    expect(wrapper.find('td.text-red-600').exists()).toBe(true)
  })

  it('lists guarantors who asked to be replaced, with their reason', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Asked to be replaced')!
      .trigger('click')
    await flushPromises()

    expect(api.guarantorReleaseRequests).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Moving abroad')
    expect(wrapper.text()).toContain('Find a replacement')
  })
})
