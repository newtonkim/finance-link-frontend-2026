import type { RouteRecordRaw } from 'vue-router'
import SavingsAccounts from './pages/SavingsAccounts.vue'

export const savingsRoutes: RouteRecordRaw[] = [
  {
    path: 'savings-accounts',
    name: 'tenant-savings-accounts',
    component: SavingsAccounts,
  },
]
