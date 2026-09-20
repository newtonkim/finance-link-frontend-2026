/**
 * Tearing down a tenant session.
 *
 * Clearing the token is not enough. The table framework caches every list it has
 * fetched in sessionStorage, and the signed-in user, subdomain and branch context
 * live in localStorage. If only the token is dropped, the app keeps rendering the
 * cached rows — so a session that is no longer valid still shows the previous
 * sacco's members and branding as though nothing had changed.
 */

/** localStorage keys that belong to a tenant session. */
const TENANT_KEYS = [
  'tenant_token',
  'tenant_subdomain',
  'tenant_user',
  'tenant_branch_context',
  // Written by septor-store, which holds the bearer token for the table framework.
  'logginToken',
]

export function clearTenantSession(): void {
  try {
    TENANT_KEYS.forEach((key) => localStorage.removeItem(key))
  } catch {
    // Storage can be unavailable (private mode, blocked site data); nothing to clear.
  }

  try {
    // Every cached list lives here, keyed by state name. None of it survives a
    // session, so the whole store goes rather than an enumerated subset that
    // would drift as new tables are added.
    sessionStorage.clear()
  } catch {
    // As above.
  }
}

/** True once a redirect to the tenant login is already in progress. */
let redirecting = false

/**
 * Ends the session and sends the user to the tenant login.
 *
 * A full page load is used rather than a router push so no in-memory Pinia store
 * survives with data from the dead session. The flag stops a burst of parallel
 * 401s from queueing several navigations.
 */
export function endTenantSession(): void {
  clearTenantSession()

  if (redirecting) return

  const path = '/tenant/login'
  if (window.location.pathname === path) return

  redirecting = true
  window.location.assign(path)
}
