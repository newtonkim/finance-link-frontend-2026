import type { RouteRecordRaw } from 'vue-router'
import Dashboard from './pages/Dashboard.vue'

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'tenant-dashboard',
    component: Dashboard,
  },
]
