export interface TenantStatusSource {
  status?: string | null
  license_expires_at?: string | null
}

export function tenantDisplayStatus(tenant: TenantStatusSource, now = new Date()): string {
  const storedStatus = tenant.status?.toLowerCase() ?? 'unknown'

  if (storedStatus === 'suspended' || storedStatus === 'deleted') {
    return storedStatus
  }

  if (storedStatus === 'expired' || !tenant.license_expires_at) {
    return 'expired'
  }

  const expiresAt = new Date(tenant.license_expires_at)
  if (!Number.isNaN(expiresAt.getTime()) && expiresAt <= now) {
    return 'expired'
  }

  return storedStatus
}
