import type { RouteRecordRaw } from 'vue-router'
import { routebuilder } from '@/Global'
import {
  LayoutGrid,
  Users, 
  HandCoins,
  ArrowUpDown,
  BookOpen,
  ArrowLeftRight,
} from 'lucide-vue-next'
import type { MenuRoutes } from '@/Global/types/helpers'

export const tenantRoutes: MenuRoutes[] = [
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
            permissions: 'members-list',
          },
          {
            path: 'members-account',
            label: 'Members Account',
            permissions: 'members-account-module-link-view',
            // icon: Wallet,
            showSideBar: true,
            component: () => import('@/tenant/modules/savings/member-account/Index.vue'),
            // component: () => import('@/tenant/modules/savings/pages/SavingsAccountsOriginal.vue'),
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
    path: 'group-savings',
    label: 'Group Savings',
    permissions: 'group-savings-module-link-view',
    icon: Users,
    showSideBar: true,
    component: () => import('@/tenant/modules/savings/group-account/Index.vue'),
  },
  ///////////
  {
    path: 'savings-transfer',
    label: 'savings transfer',
    permissions: 'savings-transfer-module-link-view',
    showSideBar: true,
    icon: ArrowLeftRight,
    component: () => import('@/tenant/modules/savings/savings-transfer/Index.vue'),
    // component: () => import('@/tenant/modules/savings/pages/SavingsTransfer.vue'),
  },
  
  {
    path: 'chart-of-accounts',
    label: 'chart of accounts',
    icon: BookOpen,
    permissions: 'chart-of-accounts-module-link-view',
    showSideBar: true,
    component: () => import('@/tenant/modules/accounting/pages/ChartOfAccounts.vue'),
  },
]
export const tenantRoutesList = routebuilder(tenantRoutes, 'tenant') as RouteRecordRaw[]
