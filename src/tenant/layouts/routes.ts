import type { RouteRecordRaw } from 'vue-router'
import { getSystemSetting, routebuilder } from '@/Global'
import {
  LayoutGrid,
  Users,
  Coins,
  BookOpen,
  ArrowLeftRight,
  Handshake,
  Landmark,
  PieChart,
  FileText,
  Receipt,
  TrendingDown,
} from 'lucide-vue-next'
import type { MenuRoutes } from '@/Global/types/helpers'
  const checkForVailableSetting = getSystemSetting()

  const memberSwitch=['true',true,1].includes(checkForVailableSetting?.['system-used-by-money-lenders']) ? 'clients' : 'Members'
export const tenantRoutes: MenuRoutes[] = [
  {
    path: 'Dashboard',
    label: 'dashboard',
    showSideBar: true,
    icon: LayoutGrid,
    permissions: 'dashboard-module-link-view',
    component: () => import('@/tenant/modules/dashboard/pages/Dashboard.vue'),
    group: 'OVERVIEW',
  },
  {
    path: 'my-profile',
    label: 'my-profile',
    showSideBar: false,
    component: () => import('@/tenant/modules/profile/pages/MyProfile.vue'),
  },
  {
    label:  checkForVailableSetting?.['system-used-by-money-lenders'] ? 'Staff &  clients' : 'Members',
    icon: Users,
    permissions: 'members-module-link-view',
    showSideBar: true,
    prifix: 'tenant',
    group: 'MEMBERS',
    children: [
      {
        title: 'Sacco '+memberSwitch,
        titleStyle: 'green',
        items: [
          {
            path: 'member',
            label:  memberSwitch,
            component: () => import('@/tenant/modules/members/Index.vue'),
            permissions: 'members-list',
          },
          {
            path: 'member/profile',
            label: 'member-profile',
            component: () => import('@/tenant/modules/members/profile/MemberShow.vue'),
            showSideBar: false,
            // permissions: 'member-profile',
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
          {
            path: 'savings/fixed-deposits',
            label: 'Fixed Deposits',
            showSideBar: true,
            icon: Landmark,
            component: () => import('@/tenant/modules/savings/pages/FixedDepositsDashboard.vue'),
          },
        ],
      },
      {
        title: 'STAFF MEMBERS',
        titleStyle: 'green',
        items: [
          {
            permissions: 'staff-list',
            path: 'Staff',
            label: 'Staff',
            component: () => import('@/tenant/modules/staff/Index.vue'),
          },
            {
            path: 'staff-salaries',
            label: 'Staff Salaries',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
          {
            path: 'staff-advances',
            label: 'Staff Advances',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
          {
            path: 'staff-allowances',
            label: 'Staff Allowances',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
        ],
      },
    
    ],
  },

  {
    path: 'group-savings',
    label: 'Group Savings',
    permissions: 'group-savings-module-link-view',
    icon: Handshake,
    showSideBar: true,
    component: () => import('@/tenant/modules/savings/group-account/Index.vue'),
    group: 'SAVINGS & TRANSFERS',
  },
  {
    path: 'group-savings/profile',
    label: 'group-profile',
    component: () => import('@/tenant/modules/savings/group-account/profile/Group-profile.vue'),
    showSideBar: false,
    group: 'SAVINGS & TRANSFERS',
    // permissions: 'member-profile',
  },
  ///////////
  {
    path: 'savings-transfer',
    label: 'savings transfer',
    permissions: 'savings-transfer-module-link-view',
    showSideBar: true,
    icon: ArrowLeftRight,
    component: () => import('@/tenant/modules/savings/savings-transfer/Index.vue'),
    group: 'SAVINGS & TRANSFERS',
    // component: () => import('@/tenant/modules/savings/pages/SavingsTransfer.vue'),
  },

  {
    type: 'label',
    label: 'LOANS & SHARES',
    icon: BookOpen,
    showSideBar: true,
    group: 'LOANS & SHARES',
  },
  {
    label: 'Manage Loans',
    icon: Coins,
    // permissions: "loan-module-link-view",
    showSideBar: true,
    prifix: 'tenant',
    group: 'LOANS & SHARES',
    children: [
      {
        title: 'LOANS',
        titleStyle: 'green',
        items: [
          {
            path: 'loan-applications',
            label: 'Loan Applications',
            // icon: HandCoins,
            // permissions: 'chart-of-accounts-module-link-view',
            showSideBar: true,
            component: () => import('@/tenant/modules/loans/loan-application/Index.vue'),
          },
          {
            path: 'Loan',
            label: 'Loans',
            // icon: Wallet,
            // permissions: 'chart-of-accounts-module-link-view',
            showSideBar: true,
            component: () => import('@/tenant/modules/loans/pages/ActiveLoansIndex.vue'),
          },
          {
            path: 'loan-transaction',
            label: 'Loan Transactions',
            component: () => import('@/tenant/modules/loans/Transaction/Index.vue'),
            // permissions: "view-transactions-list",
          },

        ],
      },
      {
        title: 'LOAN REPORTS',
        titleStyle: 'green',
        items: [
          {
            path: 'loan-balances-report',
            label: 'Loan Balances Report',
            showSideBar: true,
            component: () => import('@/tenant/modules/loans/pages/LoanBalancesReport.vue'),
          },
          {
            path: 'arrears-report',
            label: 'Arrears Report',
            showSideBar: true,
            component: () => import('@/tenant/modules/loans/pages/ArrearsReport.vue'),
          },
          {
            path: 'aging-report',
            label: 'Aging Report',
            showSideBar: true,
            component: () => import('@/tenant/modules/reports/pages/AgingReport.vue'),
          },
          {
            path: 'collections-report',
            label: 'Collections Report',
            showSideBar: true,
            component: () => import('@/tenant/modules/loans/pages/CollectionsReport.vue'),
          },
          {
            path: 'disbursement-report',
            label: 'Disbursement Report',
            showSideBar: true,
            component: () => import('@/tenant/modules/loans/pages/DisbursementReport.vue'),
          },
        ],
      },
    ],
  },

  
  {
    label: 'Manage Shares',
    icon: PieChart,
    // permissions: "shares-module-link-view",
    showSideBar: true,
    prifix: 'tenant',
    group: 'LOANS & SHARES',
    children: [
      {
        title: 'SHARES',
        titleStyle: 'green',
        items: [
          {
            path: 'shares',
            label: 'Share Center',
            showSideBar: true,
            component: () => import('@/tenant/modules/shares/center/Index.vue'),
          },
          {
            path: 'shareholders',
            label: 'Shareholders',
            showSideBar: true,
            component: () => import('@/tenant/modules/shares/holders/Index.vue'),
          },
          {
            path: 'share-transactions',
            label: 'Share Transactions',
            showSideBar: true,
            component: () => import('@/tenant/modules/shares/pages/Index.vue'),
          },
        ],
      },
      {
        title: 'SHARES REPORT',
        titleStyle: 'green',
        items: [
          {
            path: 'reports/shares',
            label: 'Shares Report',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
        ],
      },
    ],
  },

 

  {
    path: 'chart-of-accounts',
    label: 'chart of accounts',
    icon: BookOpen,
    permissions: 'chart-of-accounts-module-link-view',
    showSideBar: true,
    component: () => import('@/tenant/modules/accounting/pages/ChartOfAccounts.vue'),
    group: 'FINANCIALS',
  },
  {
    path: 'expenses',
    label: 'Manage Expenses',
    icon: Receipt,
    showSideBar: true,
    component: () => import('@/tenant/components/globals/ComingSoon.vue'),
    group: 'FINANCIALS',
  },
  {
    path: 'asset-depreciation',
    label: 'Asset Depreciation',
    icon: TrendingDown,
    showSideBar: true,
    component: () => import('@/tenant/components/globals/ComingSoon.vue'),
    group: 'FINANCIALS',
  },

  {
    type: 'label',
    label: 'REPORTS/Configuration',
    icon: FileText,
    showSideBar: true,
    group: 'REPORTS & SETTINGS',
  },
  {
    label: 'Reports',
    icon: FileText,
    showSideBar: true,
    prifix: 'tenant',
    group: 'REPORTS & SETTINGS',
    children: [
      {
        title: 'FINANCIAL REPORTS',
        titleStyle: 'green',
        items: [
          {
            path: 'reports/trial-balance',
            label: 'Trial Balance',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
          {
            path: 'reports/income-statement',
            label: 'Income Statement(P&L)',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
          {
            path: 'reports/balance-sheet',
            label: 'Balance Sheet',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
          {
            path: 'reports/cash-flow',
            label: 'Cash Flow',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
        ],
      },
      {
        title: 'MEMBER REPORTS',
        titleStyle: 'green',
        items: [
          {
            path: 'reports/savings',
            label: 'Savings Report',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
          {
            path: 'reports/daily',
            label: 'Daily Report',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
          {
            path: 'reports/deposit',
            label: 'Deposit Report',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
          {
            path: 'reports/withdrawal',
            label: 'Withdrawal Report',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
          {
            path: 'reports/member-summary',
            label: 'Member Summary Report',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
          {
            path: 'reports/dormant-account',
            label: 'Dormant Account Report',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
        ],
      },
      {
        title: 'EXPENSE & CHARGES REPORTS',
        titleStyle: 'green',
        items: [
          {
            path: 'reports/expenses',
            label: 'Expenses Report',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
          {
            path: 'reports/charges',
            label: 'Charges Report',
            showSideBar: true,
            component: () => import('@/tenant/components/globals/ComingSoon.vue'),
          },
        ],
      },
    ],
  },
]
export const tenantRoutesList = routebuilder(tenantRoutes, 'tenant') as RouteRecordRaw[]
