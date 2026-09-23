import { describe, expect, it } from 'vitest'
import { isCentralHostname, resolveTenantSubdomain } from '../tenantDomain'

const central = 'finance-link-frontend-2026.vercel.app'

describe('tenant domain routing', () => {
  it('keeps the central Vercel address out of tenant routing', () => {
    expect(resolveTenantSubdomain(central, 'vercel.app', central)).toBeNull()
    expect(isCentralHostname(central, 'vercel.app', central)).toBe(true)
  })

  it('resolves the demo tenant on the shared Vercel suffix', () => {
    expect(resolveTenantSubdomain('mfukodemo.vercel.app', 'vercel.app', central)).toBe('mfukodemo')
    expect(isCentralHostname('mfukodemo.vercel.app', 'vercel.app', central)).toBe(false)
  })

  it('accepts a configured URL with case, port and trailing slash', () => {
    expect(resolveTenantSubdomain(central, 'vercel.app', `https://${central.toUpperCase()}:443/`)).toBeNull()
  })

  it('preserves custom-domain and localhost routing', () => {
    expect(resolveTenantSubdomain('demo.mfukoplus.com', 'mfukoplus.com')).toBe('demo')
    expect(resolveTenantSubdomain('mfukoplus.com', 'mfukoplus.com')).toBeNull()
    expect(resolveTenantSubdomain('demo.localhost')).toBe('demo')
    expect(resolveTenantSubdomain('localhost')).toBeNull()
  })

  it('ignores IPs, reserved names, unrelated domains and missing configuration', () => {
    expect(resolveTenantSubdomain('127.0.0.1', '0.1')).toBeNull()
    expect(resolveTenantSubdomain('admin.mfukoplus.com', 'mfukoplus.com')).toBeNull()
    expect(resolveTenantSubdomain('demo.other.com', 'mfukoplus.com')).toBeNull()
    expect(resolveTenantSubdomain('mfukodemo.vercel.app')).toBeNull()
  })
})
