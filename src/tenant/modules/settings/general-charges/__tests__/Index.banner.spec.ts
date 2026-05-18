/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

vi.mock('septor-store', () => ({
  getBearerToken: () => null,
  pomPinia: {},
}))
vi.mock('@/tenant/apis/tenantClient', () => ({
  tenantClient: { interceptors: { request: { use: vi.fn() } } },
}))

// Module-level row buffer so a single TableDrawer stub can render any
// charge_applys scenario tests want to assert. The stub iterates this array
// and exposes each row through the slot scope.
const { mockItems } = vi.hoisted(() => ({ mockItems: [] as any[] }))

vi.mock('@/Global', () => ({
  TableDrawer: {
    name: 'TableDrawerStub',
    setup() {
      return { items: mockItems }
    },
    template: `
      <div>
        <slot name="header-action" />
        <div v-for="(row, i) in items" :key="i" data-test="row">
          <slot name="charge_applys" :item="row" />
        </div>
      </div>
    `,
  },
  PainPageHeader: { name: 'PainPageHeaderStub', template: '<div />' },
  formatMoneyValue: (v: number) => String(v),
}))
vi.mock('@/Global/ToggleSwitch.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../../composables/useGeneralCharges', () => ({
  useGeneralCharges: () => ({
    toggleActive: vi.fn(),
    applicationLabel: (a: string) => a,
  }),
}))
vi.mock('.', () => ({ Create: { template: '<div />' }, Details: { template: '<div />' } }))

import Index from '../Index.vue'

function mountIndex() {
  return mount(Index, {
    global: {
      stubs: { RouterLink: RouterLinkStub },
    },
  })
}

beforeEach(() => {
  mockItems.length = 0
})

describe('General Charges Index — discoverability banner', () => {
  it('renders a router-link to the loan-charges route', () => {
    const wrapper = mountIndex()

    const link = wrapper.findComponent(RouterLinkStub)
    expect(link.exists()).toBe(true)
    expect(link.props('to')).toEqual({ name: 'tenant-settings-loan-charges' })
    expect(wrapper.text()).toContain('Loan Charges')
  })
})

describe('General Charges Index — Applies-to cell', () => {
  it('renders the application label for an on_registration charge', () => {
    mockItems.push({ id: 1, application: 'on_registration' })
    const wrapper = mountIndex()
    const row = wrapper.find('[data-test="row"]')
    expect(row.text()).toContain('on_registration')
    // No secondary badge or product chips for non-other applications.
    expect(row.text()).not.toContain('savings')
  })

  it('renders the application label for an on_shares charge', () => {
    mockItems.push({ id: 2, application: 'on_shares' })
    const wrapper = mountIndex()
    expect(wrapper.find('[data-test="row"]').text()).toContain('on_shares')
  })

  it('renders application + where_to_apply badge + product chips for other+savings', () => {
    mockItems.push({
      id: 3,
      application: 'other',
      charge_applys: 'savings',
      products: 'Standard Savings, Children Savings',
    })
    const wrapper = mountIndex()
    const text = wrapper.find('[data-test="row"]').text()
    expect(text).toContain('other')
    expect(text).toContain('savings')
    expect(text).toContain('Standard Savings')
    expect(text).toContain('Children Savings')
  })

  it('shows the secondary badge but no product chips for other+shares', () => {
    mockItems.push({ id: 4, application: 'other', charge_applys: 'shares' })
    const wrapper = mountIndex()
    const text = wrapper.find('[data-test="row"]').text()
    expect(text).toContain('other')
    expect(text).toContain('shares')
  })

  it('falls back to em-dash when application is missing', () => {
    mockItems.push({ id: 5 })
    const wrapper = mountIndex()
    expect(wrapper.find('[data-test="row"]').text()).toContain('—')
  })
})
