import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import LedgerDrillDownDrawer from '../components/LedgerDrillDownDrawer.vue'

const { getLedgerLines } = vi.hoisted(() => ({ getLedgerLines: vi.fn() }))
vi.mock('@/Global', () => ({ Spinner: { template: '<span>Loading</span>' }, formatMoneyValue: String }))
vi.mock('@/tenant/apis/reports/trialBalanceApi', () => ({ trialBalanceApi: { getLedgerLines } }))
const account = { id: 1, gl_code: '11101', name: 'Cash' }
const mounts: ReturnType<typeof mount>[] = []
function drawer() {
  const wrapper = mount(LedgerDrillDownDrawer, {
    props: { open: true, account, from: '2026-01-01', to: '2026-09-30' },
    global: { stubs: { DialogRoot: { template: '<div><slot /></div>' }, DialogPortal: { template: '<div><slot /></div>' }, DialogContent: { template: '<div><slot /></div>' }, DialogTitle: { template: '<h2><slot /></h2>' }, DialogDescription: { template: '<p><slot /></p>' }, DialogOverlay: true } },
  })
  mounts.push(wrapper)
  return wrapper
}
const response = (entry: string, last = 2) => ({ data: [{ date: '2026-01-01', entry_no: entry, debit: 10, credit: 0 }], total: 2, last_page: last })
afterEach(() => { mounts.forEach(w => w.unmount()); mounts.length = 0; vi.resetAllMocks() })

describe('ledger drawer', () => {
  it('retries a failed page without skipping it or duplicating earlier lines', async () => {
    getLedgerLines.mockResolvedValueOnce(response('FIRST')).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(response('SECOND'))
    const w = drawer()
    await flushPromises()
    await w.findAll('button').find(b => b.text().includes('Load more'))!.trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Failed to load ledger lines')
    await w.findAll('button').find(b => b.text() === 'Retry')!.trigger('click')
    await flushPromises()
    expect(getLedgerLines.mock.calls.map(c => c[0].page)).toEqual([1, 2, 2])
    expect(w.text()).toContain('FIRST')
    expect(w.text()).toContain('SECOND')
  })

  it('ignores a stale response after switching accounts', async () => {
    let resolveOld!: (value: ReturnType<typeof response>) => void
    getLedgerLines.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
      .mockResolvedValueOnce(response('NEW ACCOUNT', 1))
    const w = drawer()
    await w.setProps({ account: { ...account, id: 2, name: 'Bank' } })
    await flushPromises()
    resolveOld(response('OLD ACCOUNT', 1))
    await flushPromises()
    expect(w.text()).toContain('NEW ACCOUNT')
    expect(w.text()).not.toContain('OLD ACCOUNT')
  })
})
