import type { RouteRecordRaw } from 'vue-router'
import { routebuilder } from '@/Global'
import {
  LayoutGrid,
  Users,
  Wallet,
  HandCoins,
  ArrowUpDown,
  BookOpen,
  Settings,
  Moon,
  Sun,
  MapPin,
  Mail,
  ArrowLeftRight,
} from 'lucide-vue-next'

export const tenantRoutes: any = [
  {
    path: 'Dashboard',
    label: 'dashboard',
    showSideBar: true,
    icon: LayoutGrid,
  },
  {
    path: 'members cerate',
    label: 'Members cerate',
    icon: Users,
    component: () => import('@/tenant/modules/members/pages/MemberCreate.vue'),
    showSideBar: true,
  },
     {
    label: 'Members',
    icon: Users,
    // permissions: 'settings-module-link-view',
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
            //  permissions: 'settings-permission-view',
          },
          
          
        ],
      },
      {
        title: 'STAFF MEMBERS',
        items: [
          {
            path: 'Staff',
            label: 'Staff',
          component: () => import('@/tenant/modules/staff/index.vue'), },
         
        ],
      },
    ],
  },


  {
    path: 'members-account',
    label: 'Members Account',
    //   permissions: 'tenant-savings-accounts-view',
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

 
