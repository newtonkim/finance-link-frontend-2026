/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const onBoardingMock = vi.fn()
const getProductChargesMock = vi.fn()

vi.mock('septor-store', () => ({ getBearerToken: () => null, pomPinia: () => ({}) }))
vi.mock('@/tenant/apis/tenantClient', () => ({
  tenantClient: { interceptors: { request: { use: vi.fn() } } },
}))
vi.mock('@/tenant/apis/members/settings', () => ({
  memmberSettingApi: () => ({
    onBoardingProductGeneralCharges: (...a: any[]) => onBoardingMock(...a),
  }),
}))
vi.mock('@/tenant/apis', () => ({
  memberAccountApi: () => ({
    getProductCharges: (...a: any[]) => getProductChargesMock(...a),
  }),
}))
// Stub everything the form imports so jsdom doesn't choke.
vi.mock('@/Global', () => ({
  Form: { template: '<div data-test="form-root" />' },
  formatMoneyValue: (v: number) => String(v),
  getSystemSetting: () => ({}),
  tryCatch: async (fn: () => any) => { try { return await fn() } catch { return null } },
}))
// Stub lucide icons used in the template
vi.mock('lucide-vue-next', () => ({
  AlertCircle: { template: '<span />' },
  TrendingUp: { template: '<span />' },
  Share2: { template: '<span />' },
}))

beforeEach(() => {
  onBoardingMock.mockReset()
  getProductChargesMock.mockReset()
})

import Create from '../Create.vue'

/**
 * The watcher function signature is: debounce(async (fields: any) => { ... })
 * Inside it uses fields.value.find(...). When called from tests via vm.watchChangeInProductOrCharges,
 * we must pass a ref-like object: { value: vm.fields } so fields.value resolves correctly.
 */
function makeFieldsRef(vm: any) {
  return { value: vm.fields }
}

describe('Members Create — General Charge field', () => {
  it('populates the new general_registration_charges field with registration total + breakdown when product is selected', async () => {
    onBoardingMock.mockResolvedValue([
      { id: 1, name: 'Account Opening Fee', charge_amount: 5000 },
    ])
    getProductChargesMock.mockResolvedValue({ cost: 0 })

    const wrapper = mount(Create, { props: { data: {} } })

    const vm: any = wrapper.vm
    const productField = vm.fields.find((f: any) => f.name === 'product_id')
    const depositField = vm.fields.find((f: any) => f.name === 'inital_deposit')
    productField.value = 3
    depositField.value = 20000

    await vm.watchChangeInProductOrCharges(makeFieldsRef(vm))
    await flushPromises()
    await new Promise((r) => setTimeout(r, 950))

    const general = vm.fields.find((f: any) => f.name === 'general_registration_charges')
    expect(general.hidden).toBe(false)
    expect(general.value).toBe('5000 (charges)')
    expect(general.helper).toContain('Account Opening Fee: 5000')
  })

  it('hides the general_registration_charges field when the product has no registration charges', async () => {
    onBoardingMock.mockResolvedValue([])
    getProductChargesMock.mockResolvedValue({ cost: 0 })

    const wrapper = mount(Create, { props: { data: {} } })
    const vm: any = wrapper.vm
    vm.fields.find((f: any) => f.name === 'product_id').value = 3
    vm.fields.find((f: any) => f.name === 'inital_deposit').value = 1000

    await vm.watchChangeInProductOrCharges(makeFieldsRef(vm))
    await flushPromises()
    await new Promise((r) => setTimeout(r, 950))

    const general = vm.fields.find((f: any) => f.name === 'general_registration_charges')
    expect(general.hidden).toBe(true)
    expect(general.value).toBe('')
  })

  it('shows the insufficient-deposit hint under Initial Deposit when deposit < registration total', async () => {
    onBoardingMock.mockResolvedValue([
      { id: 1, name: 'Account Opening Fee', charge_amount: 5000 },
    ])
    getProductChargesMock.mockResolvedValue({ cost: 0 })

    const wrapper = mount(Create, { props: { data: {} } })
    const vm: any = wrapper.vm
    vm.fields.find((f: any) => f.name === 'product_id').value = 3
    vm.fields.find((f: any) => f.name === 'inital_deposit').value = 3000

    await vm.watchChangeInProductOrCharges(makeFieldsRef(vm))
    await flushPromises()
    await new Promise((r) => setTimeout(r, 950))

    const deposit = vm.fields.find((f: any) => f.name === 'inital_deposit')
    expect(deposit.helper).toContain('Initial deposit must be at least UGX 5000')
  })

  it('keeps Transactional charges field showing only the deposit-event fee', async () => {
    onBoardingMock.mockResolvedValue([
      { id: 1, name: 'Account Opening Fee', charge_amount: 5000 },
    ])
    getProductChargesMock.mockResolvedValue({ cost: 200 })

    const wrapper = mount(Create, { props: { data: {} } })
    const vm: any = wrapper.vm
    vm.fields.find((f: any) => f.name === 'product_id').value = 3
    vm.fields.find((f: any) => f.name === 'inital_deposit').value = 20000

    await vm.watchChangeInProductOrCharges(makeFieldsRef(vm))
    await flushPromises()
    await new Promise((r) => setTimeout(r, 950))

    const transactional = vm.fields.find((f: any) => f.name === 'charges')
    expect(transactional.value).toBe('200 (charges)')
    expect(transactional.helper).toContain('200')
    expect(transactional.helper).not.toContain('5000')
  })
})
