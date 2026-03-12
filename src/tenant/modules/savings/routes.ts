import type { RouteRecordRaw } from 'vue-router'
import SavingsAccounts from './pages/SavingsAccounts.vue'
import SavingsTransfer from './pages/SavingsTransfer.vue'

export const savingsRoutes: RouteRecordRaw[] = [
  {
    path: 'savings-accounts',
    name: 'tenant-savings-accounts',
    component: SavingsAccounts,
  },
  {
    path: 'savings-transfer',
    name: 'tenant-savings-transfer',
    component: SavingsTransfer,
  },
]
