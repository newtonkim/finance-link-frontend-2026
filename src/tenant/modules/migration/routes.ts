import type { RouteRecordRaw } from 'vue-router'

export const migrationRoutes: RouteRecordRaw[] = [
  {
    path: 'migration',
    name: 'tenant-migration',
    component: () => import('./pages/MigrationHub.vue'),
  },
  {
    path: 'migration/opening-balances',
    name: 'tenant-migration-opening-balances',
    component: () => import('./pages/OpeningBalances.vue'),
  },
  {
    path: 'migration/transactions',
    name: 'tenant-migration-transactions',
    component: () => import('./pages/TransactionHistory.vue'),
  },
]
