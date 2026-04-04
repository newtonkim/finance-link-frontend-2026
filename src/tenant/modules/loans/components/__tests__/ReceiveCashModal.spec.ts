/* @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/Global', () => ({
  formatMoneyValue: (value: number | string) => String(value),
}))

import ReceiveCashModal from '../ReceiveCashModal.vue'

function mountModal(extraProps: Record<string, unknown> = {}) {
  return mount(ReceiveCashModal, {
    props: {
      open: true,
      posting: false,
      tellerName: 'Teller One',
      borrowerName: 'Member One',
      installmentAmount: 1000,
      currency: 'UGX',
      ...extraProps,
    },
    global: {
      stubs: {
        Teleport: true,
        Transition: true,
      },
    },
  })
}

describe('ReceiveCashModal allocation order display', () => {
  it('renders configured allocation order label and sequence', () => {
    const wrapper = mountModal({
      allocationOrderLabel: 'Case 2',
      allocationOrderSequence: 'Interest -> Principal -> Penalties & Charges',
    })

    expect(wrapper.text()).toContain('Repayment Allocation Order')
    expect(wrapper.text()).toContain('Case 2')
    expect(wrapper.text()).toContain('Interest -> Principal -> Penalties & Charges')
  })

  it('renders fallback allocation sequence text when not provided', () => {
    const wrapper = mountModal()

    expect(wrapper.text()).toContain('Default Allocation Order')
    expect(wrapper.text()).toContain('Penalties & Charges -> Interest -> Principal')
  })
})
