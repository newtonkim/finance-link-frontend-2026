import type { RouteRecordRaw } from 'vue-router'
import Reports from './pages/Reports.vue'
import MemberStatement from './pages/MemberStatement.vue'
import BalancesReport from './pages/BalancesReport.vue'
import TrialBalance from './pages/TrialBalance.vue'

export const reportsRoutes: RouteRecordRaw[] = [
  {
    path: 'reports',
    name: 'tenant-reports',
    component: Reports,
  },
  {
    path: 'reports/member-statement/:member_id?',
    name: 'tenant-member-statement',
    component: MemberStatement,
  },
  {
    path: 'reports/balances',
    name: 'tenant-balances-report',
    component: BalancesReport,
  },
  {
    path: 'reports/trial-balance',
    name: 'tenant-trial-balance',
    component: TrialBalance,
  },
]
