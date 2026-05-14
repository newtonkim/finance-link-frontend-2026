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
