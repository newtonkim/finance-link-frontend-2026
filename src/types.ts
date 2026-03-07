export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  email_verified_at?: string
  [key: string]: unknown
}

export interface TenantLicense {
  id: number
  plan_slug: string
  expires_at: string
  status: string
}

export interface Tenant {
  id: string
  name: string
  subdomain: string
  database_name?: string
  full_domain?: string
  full_url?: string
  status?: 'active' | 'suspended' | 'trial'
  active_license?: TenantLicense
  settings?: {
    logo_url?: string
    slogan?: string
    address?: string
    email?: string
    [key: string]: unknown
  }
  created_at?: string
  updated_at?: string
}

export type BreadcrumbItem = {
  title: string
  href?: string
}

export type NavItem = {
  title: string
  href: string
  icon?: any // LucideIcon from lucide-vue-next
  isActive?: boolean
}

export type Appearance = 'light' | 'dark' | 'system'
export type ResolvedAppearance = 'light' | 'dark'

export type AppShellVariant = 'header' | 'sidebar'

export type TwoFactorConfigContent = {
  enabled: boolean
  qr_code?: string
  secret?: string
  recovery_codes?: string[]
}
