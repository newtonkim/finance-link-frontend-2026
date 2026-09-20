import { beforeEach, describe, expect, it } from 'vitest'
import { clearTenantSession } from '../tenantSession'

/**
 * A dead session used to keep rendering whatever the table framework had already
 * cached, so the previous sacco's members and branding stayed on screen. Clearing
 * the token alone does not fix that — the cached rows have to go too.
 */
describe('clearTenantSession', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('removes every tenant credential and context key', () => {
    localStorage.setItem('tenant_token', 'tok')
    localStorage.setItem('tenant_subdomain', 'testsacco')
    localStorage.setItem('tenant_user', '{"id":1}')
    localStorage.setItem('tenant_branch_context', '{"active_branch_id":2}')
    localStorage.setItem('logginToken', '{"token":"tok"}')

    clearTenantSession()

    expect(localStorage.getItem('tenant_token')).toBeNull()
    expect(localStorage.getItem('tenant_subdomain')).toBeNull()
    expect(localStorage.getItem('tenant_user')).toBeNull()
    expect(localStorage.getItem('tenant_branch_context')).toBeNull()
    expect(localStorage.getItem('logginToken')).toBeNull()
  })

  it('drops the cached table state, which is what kept stale rows on screen', () => {
    sessionStorage.setItem('membersList', JSON.stringify({ payload: [{ id: 1, name: 'Old Member' }] }))
    sessionStorage.setItem('saccoBranding', JSON.stringify({ sacco_name: 'Previous Sacco' }))

    clearTenantSession()

    expect(sessionStorage.getItem('membersList')).toBeNull()
    expect(sessionStorage.getItem('saccoBranding')).toBeNull()
    expect(sessionStorage.length).toBe(0)
  })

  it('leaves storage belonging to other origins alone', () => {
    // The central app runs on its own origin, but be explicit that this helper
    // only targets tenant keys rather than wiping localStorage wholesale.
    localStorage.setItem('unrelated_preference', 'keep-me')
    localStorage.setItem('tenant_token', 'tok')

    clearTenantSession()

    expect(localStorage.getItem('tenant_token')).toBeNull()
    expect(localStorage.getItem('unrelated_preference')).toBe('keep-me')
  })
})
