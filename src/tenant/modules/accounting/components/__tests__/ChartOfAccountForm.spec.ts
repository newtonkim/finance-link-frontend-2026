/* @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const listMock = vi.fn()
const storeMock = vi.fn()

vi.mock('@/tenant/apis/chartOfAccounts/chartOfAccountsApi', () => ({
  chartOfAccountsApi: {
    list: (...args: any[]) => listMock(...args),
    store: (...args: any[]) => storeMock(...args),
  },
}))

vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/Global', () => ({
  Drawer: {
    name: 'DrawerStub',
    props: ['open', 'title', 'width', 'showFooter'],
    emits: ['update:open', 'submit'],
    template:
      '<div data-test="drawer"><slot name="body" /><button data-test="submit" @click="$emit(\'submit\')">submit</button></div>',
  },
}))

vi.mock('@/Global/SearchableSelect.vue', () => ({
  default: {
    name: 'SearchableSelectStub',
    props: ['modelValue', 'options', 'placeholder', 'state'],
    emits: ['update:modelValue'],
    template: '<div data-test="searchable-select-stub" />',
  },
}))

import ChartOfAccountForm from '../ChartOfAccountForm.vue'

const PARENTS = [
  { id: 10, gl_code: '40000', name: 'INCOME', account_type: 'INCOME', is_control: true },
  { id: 11, gl_code: '42000', name: 'Fee Income', account_type: 'INCOME', is_control: true },
  {
    id: 12,
    gl_code: '43000',
    name: 'Other Operating Income',
    account_type: 'INCOME',
    is_control: true,
  },
  { id: 20, gl_code: '10000', name: 'ASSETS', account_type: 'ASSET', is_control: true },
]

// Mirrors the seeded SACCO chart: hierarchy is carried by gl_code blocks
// (parent_id is NULL on seeded rows), so sibling lookups go through gl_code math.
const ASSET_TREE = [
  { id: 3, gl_code: '10000', name: 'ASSETS', account_type: 'ASSET', account_subtype: 'Header', is_control: true, parent_id: null },
  { id: 22, gl_code: '11000', name: 'Current Assets', account_type: 'ASSET', account_subtype: 'Current Asset', is_control: true, parent_id: null },
  { id: 55, gl_code: '11100', name: 'Cash & Cash Equivalents', account_type: 'ASSET', account_subtype: 'Current Asset', is_control: true, parent_id: null },
  { id: 78, gl_code: '11101', name: 'Petty Cash', account_type: 'ASSET', account_subtype: 'Cash', is_control: false, parent_id: null },
  { id: 79, gl_code: '11102', name: 'Cash at Bank – Operating Account', account_type: 'ASSET', account_subtype: 'Bank', is_control: false, parent_id: null },
  { id: 94, gl_code: '11103', name: 'Cash at Bank – Loan Disbursement', account_type: 'ASSET', account_subtype: 'Bank', is_control: false, parent_id: null },
  { id: 89, gl_code: '11104', name: 'Mobile Money – MTN', account_type: 'ASSET', account_subtype: 'Bank', is_control: false, parent_id: null },
  { id: 100, gl_code: '11105', name: 'Mobile Money – Airtel', account_type: 'ASSET', account_subtype: 'Bank', is_control: false, parent_id: null },
  { id: 60, gl_code: '12100', name: 'Property, Plant & Equipment', account_type: 'ASSET', account_subtype: 'Fixed Asset', is_control: true, parent_id: null },
]

beforeEach(() => {
  listMock.mockReset()
  storeMock.mockReset()
  listMock.mockResolvedValue({ data: { data: PARENTS } })
})

async function mountOpen(props: Record<string, any>) {
  const wrapper = mount(ChartOfAccountForm, {
    props: { open: false, ...props },
  })
  await wrapper.setProps({ open: true, ...props })
  await flushPromises()
  return wrapper
}

describe('ChartOfAccountForm - lockedAccountType', () => {
  it('renders Account Type as read-only when locked', async () => {
    const wrapper = await mountOpen({ lockedAccountType: 'INCOME' })
    expect(wrapper.find('select').exists()).toBe(false)
    expect(wrapper.text()).toContain('Income')
  })
})

describe('ChartOfAccountForm - defaultParentGlCode', () => {
  it('pre-selects the parent whose gl_code matches', async () => {
    const wrapper = await mountOpen({
      lockedAccountType: 'INCOME',
      defaultParentGlCode: '42000',
    })
    const vm = wrapper.vm as any
    expect(vm.form.parent_id).toBe(11)
  })
})

describe('ChartOfAccountForm - prefillName', () => {
  it('pre-fills the Account Name field', async () => {
    const wrapper = await mountOpen({ lockedAccountType: 'INCOME', prefillName: 'SMS Fee' })
    const vm = wrapper.vm as any
    expect(vm.form.name).toBe('SMS Fee')
  })
})

describe('ChartOfAccountForm - requireParent', () => {
  it('blocks save with an inline error when parent_id is empty', async () => {
    const wrapper = await mountOpen({ lockedAccountType: 'INCOME', requireParent: true })
    const vm = wrapper.vm as any
    vm.form.parent_id = ''
    await wrapper.find('[data-test="submit"]').trigger('click')
    await flushPromises()
    expect(storeMock).not.toHaveBeenCalled()
    expect(vm.errors.parent_id?.[0]).toMatch(/parent account is required/i)
  })
})

describe('ChartOfAccountForm - subtype derived from parent block', () => {
  it('auto-fills subtype from dominant sibling subtype when a parent is picked', async () => {
    listMock.mockResolvedValue({ data: { data: ASSET_TREE } })
    const wrapper = await mountOpen({ lockedAccountType: 'ASSET' })
    const vm = wrapper.vm as any
    vm.form.parent_id = 55 // Cash & Cash Equivalents
    await flushPromises()
    expect(vm.form.account_subtype).toBe('Bank')
    expect(vm.form.gl_code).toBe('11106')
  })

  it('falls back to the parent own subtype when the block has no children', async () => {
    listMock.mockResolvedValue({ data: { data: ASSET_TREE } })
    const wrapper = await mountOpen({ lockedAccountType: 'ASSET' })
    const vm = wrapper.vm as any
    vm.form.parent_id = 60 // Property, Plant & Equipment (no children in fixture)
    await flushPromises()
    expect(vm.form.account_subtype).toBe('Fixed Asset')
  })

  it('builds subtype options from existing subtypes of the same account type', async () => {
    listMock.mockResolvedValue({ data: { data: ASSET_TREE } })
    const wrapper = await mountOpen({ lockedAccountType: 'ASSET' })
    const vm = wrapper.vm as any
    expect(vm.subtypeOptions).toEqual(
      expect.arrayContaining(['Bank', 'Cash', 'Current Asset', 'Fixed Asset']),
    )
    // Hardcoded labels that don't exist in the chart must be gone
    expect(vm.subtypeOptions).not.toContain('Fixed Assets')
  })
})

describe('ChartOfAccountForm - saved emit payload', () => {
  it('emits saved with the created account fields on successful save', async () => {
    storeMock.mockResolvedValue({
      data: {
        data: {
          id: 99,
          gl_code: '42500',
          name: 'SMS Fee',
          account_type: 'INCOME',
          parent_id: 11,
        },
      },
    })
    const wrapper = await mountOpen({
      lockedAccountType: 'INCOME',
      defaultParentGlCode: '42000',
    })
    const vm = wrapper.vm as any
    vm.form.name = 'SMS Fee'
    await wrapper.find('[data-test="submit"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('saved')).toBeTruthy()
    const payload = wrapper.emitted('saved')![0][0]
    expect(payload).toEqual({
      id: 99,
      gl_code: '42500',
      name: 'SMS Fee',
      account_type: 'INCOME',
      parent_id: 11,
    })
  })
})
