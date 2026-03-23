import type { RouteRecordRaw } from 'vue-router'
import Reports from './pages/Reports.vue'

export const reportsRoutes: RouteRecordRaw[] = [
  {
    path: 'reports',
    name: 'tenant-reports',
    component: Reports,
  },
]
