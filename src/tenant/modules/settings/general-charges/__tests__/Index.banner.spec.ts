/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

vi.mock('septor-store', () => ({
  getBearerToken: () => null,
  pomPinia: {},
}))
vi.mock('@/tenant/apis/tenantClient', () => ({
  tenantClient: { interceptors: { request: { use: vi.fn() } } },
}))
vi.mock('@/Global', () => ({
  TableDrawer: {
    name: 'TableDrawerStub',
    template: '<div><slot name="header-action" /></div>',
  },
  PainPageHeader: { name: 'PainPageHeaderStub', template: '<div />' },
  formatMoneyValue: (v: number) => String(v),
}))
vi.mock('@/Global/ToggleSwitch.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../../composables/useGeneralCharges', () => ({
  useGeneralCharges: () => ({
    toggleActive: vi.fn(),
    applicationLabel: (a: string) => a,
    savingProductOptions: { value: [] },
    fetchOptions: vi.fn(),
  }),
}))
vi.mock('.', () => ({ Create: { template: '<div />' }, Details: { template: '<div />' } }))

import Index from '../Index.vue'

describe('General Charges Index — discoverability banner', () => {
  it('renders a router-link to the loan-charges route', () => {
    const wrapper = mount(Index, {
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    })

    const link = wrapper.findComponent(RouterLinkStub)
    expect(link.exists()).toBe(true)
    expect(link.props('to')).toEqual({ name: 'tenant-settings-loan-charges' })
    expect(wrapper.text()).toContain('Loan Charges')
  })
})
