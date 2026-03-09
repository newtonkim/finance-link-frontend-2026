import type { RouteRecordRaw } from 'vue-router'
import ChartOfAccounts from './pages/ChartOfAccounts.vue'

export const accountingRoutes: RouteRecordRaw[] = [
  {
    path: 'chart-of-accounts',
    name: 'tenant-chart-of-accounts',
    component: ChartOfAccounts,
  },
]
