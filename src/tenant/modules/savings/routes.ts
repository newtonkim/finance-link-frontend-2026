import type { RouteRecordRaw } from 'vue-router'
import SavingsAccounts from './pages/SavingsAccounts.vue'
import SavingsTransfer from './pages/SavingsTransfer.vue'
import SavingsGroups from './pages/SavingsGroups.vue'

// all this routes are for tenant should be deleted
export const savingsRoutes: RouteRecordRaw[] = [
  {
    path: 'savings-accounts',
    name: 'tenant-savings-accounts',
    component: SavingsAccounts,
  },
  // {
  //   path: 'savings-transfer',
  //   name: 'tenant-savings-transfer',
  //   component: SavingsTransfer,
  // },
  {
    path: 'savings-groups',
    name: 'tenant-savings-groups',
    component: SavingsGroups,
  },
]
