import type { RouteRecordRaw } from 'vue-router'
import SavingsAccounts from './pages/SavingsAccounts.vue' 

// all this routes are for tenant should be deleted
export const savingsRoutes: RouteRecordRaw[] = [
  {
    path: 'savings-accounts',
    name: 'tenant-savings-accounts',
    component: SavingsAccounts,
  },
 
]
