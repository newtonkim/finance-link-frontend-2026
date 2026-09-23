function normalizeDomain(value?: string): string {
  return (value ?? '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').split('/')[0]!.split(':')[0]!
}

export function isCentralHostname(hostname: string, baseDomain?: string, centralDomain?: string): boolean {
  const host = normalizeDomain(hostname)
  return !!host && [normalizeDomain(baseDomain), normalizeDomain(centralDomain)].includes(host)
}

export function resolveTenantSubdomain(hostname: string, baseDomain?: string, centralDomain?: string): string | null {
  const host = normalizeDomain(hostname)
  const base = normalizeDomain(baseDomain)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || isCentralHostname(host, base, centralDomain)) return null

  if (!base && host.endsWith('.localhost')) return host.split('.')[0]!
  if (!base || !host.endsWith(`.${base}`)) return null

  const subdomain = host.slice(0, -(base.length + 1))
  return !subdomain || ['admin', 'www', 'localhost', 'api', 'central'].includes(subdomain)
    ? null
    : subdomain
}
