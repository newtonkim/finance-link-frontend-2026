import { beforeEach, describe, expect, it } from 'vitest'
import { applyLicenseStatus, licenseState, markLicenseExpired } from '../licenseState'

describe('licenseState', () => {
  beforeEach(() => {
    applyLicenseStatus({
      status: 'active',
      is_expired: false,
      read_only: false,
      expires_at: null,
      message: null,
    })
  })

  it('enables read-only mode from the proactive backend status', () => {
    applyLicenseStatus({
      status: 'expired',
      is_expired: true,
      read_only: true,
      expires_at: '2026-07-17T00:00:00+00:00',
      message: 'Renew your license.',
    })

    expect(licenseState.readOnly).toBe(true)
    expect(licenseState.status).toBe('expired')
    expect(licenseState.expiresAt).toBe('2026-07-17T00:00:00+00:00')
    expect(licenseState.message).toBe('Renew your license.')
  })

  it('clears stale read-only mode after renewal', () => {
    markLicenseExpired()

    applyLicenseStatus({
      status: 'active',
      is_expired: false,
      read_only: false,
      expires_at: '2026-08-18T00:00:00+00:00',
      message: null,
    })

    expect(licenseState.readOnly).toBe(false)
    expect(licenseState.status).toBe('active')
  })
})
