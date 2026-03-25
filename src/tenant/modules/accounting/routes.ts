import type { RouteRecordRaw } from 'vue-router'
import ChartOfAccounts from './pages/ChartOfAccounts.vue'
import JournalEntries from './pages/JournalEntries.vue'

export const accountingRoutes: RouteRecordRaw[] = [
  {
    path: 'chart-of-accounts',
    name: 'tenant-chart-of-accounts',
    component: ChartOfAccounts,
  },
  {
    path: 'journal-entries',
    name: 'tenant-journal-entries',
    component: JournalEntries,
  },
]
