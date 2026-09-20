import { apiClient } from '@/central/api/client'

export interface TenantMetrics {
  total: number
  active: number
  suspended: number
  new_this_month: number
}

export interface LicenceMetrics {
  total: number
  active: number
  expired: number
  expiring_7_days: number
  expiring_30_days: number
}

export interface RevenueMetrics {
  mrr: number
  arr: number
  by_cycle: Array<{ cycle: string; gross: number; licences: number }>
}

export interface ReachMetrics {
  members: number
  savings_balance: number
  loans_outstanding: number
  tenants_counted: number
  tenants_unreachable: number
}

export interface GrowthPoint {
  month: string
  label: string
  new: number
  cumulative: number
}

export interface PlanRow {
  id: number
  name: string
  price: number
  billing_cycle: string
  active_licences: number
}

export type AttentionSeverity = 'critical' | 'serious' | 'warning' | 'info'

export interface AttentionItem {
  type: 'licence_expired' | 'licence_expiring' | 'tenant_suspended'
  severity: AttentionSeverity
  tenant: string
  subdomain: string
  plan: string | null
  expires_at: string | null
  days: number | null
}

export interface RecentTenant {
  name: string
  subdomain: string
  status: string
  created_at: string
  plan: string | null
  licence_active: boolean
}

export interface DashboardAnalytics {
  currency: string
  generated_at: string
  tenants: TenantMetrics
  licenses: LicenceMetrics
  revenue: RevenueMetrics
  growth: GrowthPoint[]
  plans: PlanRow[]
  attention: AttentionItem[]
  recent_tenants: RecentTenant[]
  reach: ReachMetrics
}

/** Shape used before the first response lands, so the view never reads undefined. */
export const emptyAnalytics = (): DashboardAnalytics => ({
  currency: 'UGX',
  generated_at: '',
  tenants: { total: 0, active: 0, suspended: 0, new_this_month: 0 },
  licenses: { total: 0, active: 0, expired: 0, expiring_7_days: 0, expiring_30_days: 0 },
  revenue: { mrr: 0, arr: 0, by_cycle: [] },
  growth: [],
  plans: [],
  attention: [],
  recent_tenants: [],
  reach: {
    members: 0,
    savings_balance: 0,
    loans_outstanding: 0,
    tenants_counted: 0,
    tenants_unreachable: 0,
  },
})

export function centralDashboardApi() {
  async function getAnalytics(): Promise<DashboardAnalytics> {
    const res = await apiClient.post('/central/dashboard/analytics')
    return (res.data?.payload as DashboardAnalytics) ?? emptyAnalytics()
  }

  return { getAnalytics }
}
