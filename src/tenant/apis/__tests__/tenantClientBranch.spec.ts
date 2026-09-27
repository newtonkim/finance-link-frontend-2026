import { afterEach, expect, it, vi } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
vi.mock('@/Global', () => ({ getSubdomainName: () => 'test' }))
vi.mock('septor-store', () => ({ getBearerToken: () => null }))
vi.mock('../licenseState', () => ({ handleLicenseError: vi.fn() }))
vi.mock('../tenantSession', () => ({ endTenantSession: vi.fn() }))
import { tenantClient } from '../tenantClient'

afterEach(() => {
  localStorage.clear()
})
it('uses the active branch by default but preserves an explicit report snapshot branch', async () => {
  localStorage.setItem('tenant_branch_context', JSON.stringify({ active_branch_id: 9 }))
  const captured: InternalAxiosRequestConfig[] = []
  const adapter = async (config: InternalAxiosRequestConfig) => {
    captured.push(config)
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  }
  await tenantClient.get('/reports/income-statement', { adapter })
  await tenantClient.get('/reports/income-statement/ledger', { params: { branch_id: 2 }, adapter })
  await tenantClient.get('/reports/income-statement/ledger', {
    params: { branch_id: null },
    adapter,
  })
  expect(captured.map((c) => c.params.branch_id)).toEqual([9, 2, null])
})
