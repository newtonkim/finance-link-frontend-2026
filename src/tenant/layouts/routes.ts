import type { RouteRecordRaw } from 'vue-router'
import { routebuilder } from '@/Global'
import {
  LayoutGrid,
  Users,
  Wallet,
  HandCoins,
  ArrowUpDown,
  BookOpen,
  ArrowLeftRight,
} from 'lucide-vue-next'

export const tenantRoutes: any = [
  {
    path: 'Dashboard',
    label: 'dashboard',
    showSideBar: true,
    icon: LayoutGrid,
    permissions: 'dashboard-module-link-view',
  },
  {
    label: 'Members',
    icon: Users,
    permissions: 'members-module-link-view',
    showSideBar: true,
    prifix: 'tenant',
    children: [
      {
        title: 'SACCO MEMBERS',
        items: [
          {
            path: 'member',
            label: 'member',
            component: () => import('@/tenant/modules/members/index.vue'),
            // permissions: 'members-list',
          },
        ],
      },
      {
        title: 'STAFF MEMBERS',
        items: [
          {
            permissions: 'staff-list',

            path: 'Staff',
            label: 'Staff',
            component: () => import('@/tenant/modules/staff/index.vue'),
          },
        ],
      },
    ],
  },

  {
    path: 'members-account',
    label: 'Members Account',
    permissions: 'members-account-module-link-view',
    icon: Wallet,
    showSideBar: true,
    component: () => import('@/tenant/modules/savings/pages/SavingsAccounts.vue'),
  },
  {
    path: 'group-savings',
    label: 'Group Savings',
    // permissions: 'tenant-savings-accounts-view',
    icon: Users,
    showSideBar: true,
    component: () => import('@/tenant/modules/savings/pages/SavingsGroups.vue'),
  },
  ///////////
  {
    path: 'savings-transfer',
    label: 'savings transfer',
    showSideBar: true,
    icon: ArrowLeftRight,
    component: () => import('@/tenant/modules/savings/pages/SavingsTransfer.vue'),
  },
  {
    path: 'loans',
    label: 'loans',
    icon: HandCoins,
    showSideBar: true,
    component: () => import('@/tenant/modules/savings/pages/SavingsGroups.vue'),
  },
  {
    path: 'transfer',
    label: 'transfer',
    icon: ArrowUpDown,
    showSideBar: true,
    component: () => import('@/tenant/modules/savings/pages/SavingsGroups.vue'),
  },
  {
    path: 'chart-of-accounts',
    label: 'chart of accounts',
    icon: BookOpen,
    showSideBar: true,
    component: () => import('@/tenant/modules/accounting/pages/ChartOfAccounts.vue'),
  },
]

export const tenantRoutesList: RouteRecordRaw[] = routebuilder(tenantRoutes, 'tenant')
