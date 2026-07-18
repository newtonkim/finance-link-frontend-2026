import { describe, expect, it } from 'vitest'
import { tenantDisplayStatus } from '../tenantStatus'

const now = new Date('2026-07-18T12:00:00Z')

describe('tenantDisplayStatus', () => {
  it('marks an active tenant with an elapsed license as expired', () => {
    expect(tenantDisplayStatus({
      status: 'active',
      license_expires_at: '2026-07-13T00:00:00Z',
    }, now)).toBe('expired')
  })

  it('keeps an active tenant with a valid license active', () => {
    expect(tenantDisplayStatus({
      status: 'active',
      license_expires_at: '2026-08-18T00:00:00Z',
    }, now)).toBe('active')
  })

  it('treats a tenant without a license as expired', () => {
    expect(tenantDisplayStatus({ status: 'active' }, now)).toBe('expired')
  })

  it('preserves a suspended tenant status', () => {
    expect(tenantDisplayStatus({
      status: 'suspended',
      license_expires_at: '2026-07-13T00:00:00Z',
    }, now)).toBe('suspended')
  })
})
