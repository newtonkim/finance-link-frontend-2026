/* @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

const listMock = vi.fn()

vi.mock('@/tenant/apis/chartOfAccounts/chartOfAccountsApi', () => ({
  chartOfAccountsApi: {
    list: (...args: any[]) => listMock(...args),
  },
}))

import IncomeAccountSelect from '../IncomeAccountSelect.vue'

const ACCOUNTS = [
  { id: 1, gl_code: '42200', name: 'Loan Processing Fees' },
  { id: 2, gl_code: '42300', name: 'Account Maintenance Fees' },
  { id: 3, gl_code: '42400', name: 'Late Payment Penalties' },
]

function mountSelect(extraProps: Record<string, unknown> = {}) {
  return mount(IncomeAccountSelect, {
    props: {
      modelValue: null,
      canCreate: false,
      ...extraProps,
    },
    // Render <Teleport> content inline so wrapper.find / wrapper.text can see it.
    global: {
      stubs: {
        teleport: true,
      },
    },
  })
}

beforeEach(() => {
  listMock.mockReset()
  listMock.mockResolvedValue({ data: { data: ACCOUNTS } })
})

describe('IncomeAccountSelect data fetch', () => {
  it('fetches with INCOME + postable + active filters on mount', async () => {
    mountSelect()
    await flushPromises()
    expect(listMock).toHaveBeenCalledTimes(1)
    expect(listMock).toHaveBeenCalledWith({
      account_type: 'INCOME',
      is_postable: 1,
      list: 1,
    })
  })

  it('renders each fetched account by gl_code + name', async () => {
    const wrapper = mountSelect()
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    expect(wrapper.text()).toContain('42200 - Loan Processing Fees')
    expect(wrapper.text()).toContain('42300 - Account Maintenance Fees')
  })
})

describe('IncomeAccountSelect create-new footer', () => {
  it('hides the "+ Create new" footer when canCreate is false', async () => {
    const wrapper = mountSelect({ canCreate: false })
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    expect(wrapper.find('[data-test="create-footer"]').exists()).toBe(false)
  })

  it('shows the generic "+ Create new" label when search is empty', async () => {
    const wrapper = mountSelect({ canCreate: true })
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    expect(wrapper.text()).toContain('Create new income account')
  })

  it('shows the search-context "+ Create X" label when search is non-empty', async () => {
    const wrapper = mountSelect({ canCreate: true })
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    await wrapper.find('[data-test="search"]').setValue('SMS Fee')
    expect(wrapper.text()).toContain('Create "SMS Fee" as income account')
  })

  it('emits requestCreate with the typed text when the footer is clicked', async () => {
    const wrapper = mountSelect({ canCreate: true })
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    await wrapper.find('[data-test="search"]').setValue('SMS Fee')
    await wrapper.find('[data-test="create-footer"]').trigger('click')
    expect(wrapper.emitted('requestCreate')).toBeTruthy()
    expect(wrapper.emitted('requestCreate')![0]).toEqual([{ prefillName: 'SMS Fee' }])
  })
})

describe('IncomeAccountSelect fuzzy duplicate hint', () => {
  it('surfaces a "Did you mean" hint when search is near an existing name', async () => {
    const wrapper = mountSelect({ canCreate: true })
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    await wrapper.find('[data-test="search"]').setValue('Loan Processin Fees')
    expect(wrapper.text()).toContain('Did you mean')
    expect(wrapper.text()).toContain('Loan Processing Fees')
  })

  it('does not show the hint for an exact-name match', async () => {
    const wrapper = mountSelect({ canCreate: true })
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    await wrapper.find('[data-test="search"]').setValue('Loan Processing Fees')
    expect(wrapper.text()).not.toContain('Did you mean')
  })

  it('does not duplicate a row that the main list already shows for a substring search', async () => {
    const wrapper = mountSelect({ canCreate: true })
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    // "Loan" substring-matches "Loan Processing Fees" → it shows in the main
    // list. The fuzzy hint must NOT also surface the same row.
    await wrapper.find('[data-test="search"]').setValue('Loan')
    const occurrences = wrapper.text().match(/Loan Processing Fees/g) || []
    expect(occurrences.length).toBe(1)
  })
})

describe('IncomeAccountSelect reactive refresh + auto-select', () => {
  it('refetches when refreshTrigger changes', async () => {
    const wrapper = mountSelect({ canCreate: true, refreshTrigger: 0 })
    await flushPromises()
    expect(listMock).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ refreshTrigger: 1 })
    await flushPromises()
    expect(listMock).toHaveBeenCalledTimes(2)
  })

  it('emits update:modelValue when autoSelectId changes', async () => {
    const wrapper = mountSelect({ canCreate: true, autoSelectId: null })
    await flushPromises()
    await wrapper.setProps({ autoSelectId: 1 })
    await nextTick()
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    const last = emitted![emitted!.length - 1]
    expect(last).toEqual([1])
  })
})
