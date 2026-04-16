import type { RouteRecordRaw } from "vue-router";
import { routebuilder } from "@/Global";
import {
  LayoutGrid,
  Users,
  Wallet,Coins,
  HandCoins,
  ArrowUpDown,
  Vote,
  BookOpen,
  ArrowLeftRight,
  Library,
  Handshake
} from "lucide-vue-next";
import type { MenuRoutes } from "@/Global/types/helpers";

export const tenantRoutes: MenuRoutes[] = [
  {
    path: "Dashboard",
    label: "dashboard",
    showSideBar: true,
    icon: LayoutGrid,
    permissions: "dashboard-module-link-view",
    component: () => import("@/tenant/modules/dashboard/pages/Dashboard.vue"),
  },
  {
    label: "Members",
    icon: Users,
    permissions: "members-module-link-view",
    showSideBar: true,
    prifix: "tenant",
    children: [
     
      {
        title: "SACCO MEMBERS",
        items: [
          {
            path: "member",
            label: "member",
            component: () => import("@/tenant/modules/members/index.vue"),
            permissions: "members-list",
          },
          {
            path: "member/profile",
            label: "member-profile",
            component: () => import("@/tenant/modules/members/profile/MemberShow.vue"),
            showSideBar: false,
            // permissions: 'member-profile',
          },
          {
            path: "members-account",
            label: "Members Account",
            permissions: "members-account-module-link-view",
            // icon: Wallet,
            showSideBar: true,
            component: () => import("@/tenant/modules/savings/member-account/Index.vue"),
            // component: () => import('@/tenant/modules/savings/pages/SavingsAccountsOriginal.vue'),
          },
        ],
      },
      {
        title: "STAFF MEMBERS",
        items: [
          {
            permissions: "staff-list",
            path: "Staff",
            label: "Staff",
            component: () => import("@/tenant/modules/staff/index.vue"),
          },
        ],
      },
    ],
  },

  {
    path: "group-savings",
    label: "Group Savings",
    permissions: "group-savings-module-link-view",
    icon: Handshake,
    showSideBar: true,
    component: () => import("@/tenant/modules/savings/group-account/Index.vue"),
  },
  {
            path: "group-savings/profile",
            label: "group-profile",
            component: () => import("@/tenant/modules/savings/group-account/profile/Group-profile.vue"),
            showSideBar: false,
            // permissions: 'member-profile',
          },
  ///////////
  {
    path: "savings-transfer",
    label: "savings transfer",
    permissions: "savings-transfer-module-link-view",
    showSideBar: true,
    icon: ArrowLeftRight,
    component: () => import("@/tenant/modules/savings/savings-transfer/Index.vue"),
    // component: () => import('@/tenant/modules/savings/pages/SavingsTransfer.vue'),
  },

  {
    type: "label",
    label: "LOAN SECTION",
    icon: BookOpen,
    showSideBar: true,
  },
  {
    label: "Loans",
    icon: Coins,
    // permissions: "loan-module-link-view",
    showSideBar: true,
    prifix: "tenant",
    children: [
      
      {
        title: "LOANS",
        items: [
          {
            path: "loan-applications",
            label: "Loan Applications",
            // icon: HandCoins,
            // permissions: 'chart-of-accounts-module-link-view',
            showSideBar: true,
            component: () =>
              import("@/tenant/modules/loans/pages/LoanApplicationsIndex.vue"),
          },
          {
            path: "Loan",
            label: "Loan",
            // icon: Wallet,
            // permissions: 'chart-of-accounts-module-link-view',
            showSideBar: true,
            component: () => import("@/tenant/modules/loans/pages/ActiveLoansIndex.vue"),
          },
          {
            path: "loan-transaction",
            label: "Loan Transactions",
            component: () => import("@/tenant/modules/members/index.vue"),
            // permissions: "view-transactions-list",
          },
          {
            path: "pending-votes",
            label: "pending votes",
            // icon: Vote,
            // permissions: 'chart-of-accounts-module-link-view',
            showSideBar: true,
            component: () => import("@/tenant/modules/loans/pages/PendingVotes.vue"),
          },
        ],
      },
      {
        title: "LOAN REPORTS",
        items: [
          {
            path: "loan-balances-report",
            label: "Loan Balances Report",
            showSideBar: true,
            component: () => import("@/tenant/modules/loans/pages/LoanBalancesReport.vue"),
          },
          {
            path: "arrears-report",
            label: "Arrears Report",
            showSideBar: true,
            component: () => import("@/tenant/modules/loans/pages/ArrearsReport.vue"),
          },
          {
            path: "aging-report",
            label: "Aging Report",
            showSideBar: true,
            component: () => import("@/tenant/modules/reports/pages/AgingReport.vue"),
          },
          {
            path: "collections-report",
            label: "Collections Report",
            showSideBar: true,
            component: () => import("@/tenant/modules/loans/pages/CollectionsReport.vue"),
          },
          {
            path: "disbursement-report",
            label: "Disbursement Report",
            showSideBar: true,
            component: () => import("@/tenant/modules/loans/pages/DisbursementReport.vue"),
          },
        ],
      },
      
    ],
  },

  {
    type: "label",
    label: "ACCOUNT SECTION",
    icon: BookOpen,
    showSideBar: true,
  },

  {
    path: "chart-of-accounts",
    label: "chart of accounts",
    icon: BookOpen,
    permissions: "chart-of-accounts-module-link-view",
    showSideBar: true,
    component: () => import("@/tenant/modules/accounting/pages/ChartOfAccounts.vue"),
  },
];
export const tenantRoutesList = routebuilder(tenantRoutes, "tenant") as RouteRecordRaw[];
