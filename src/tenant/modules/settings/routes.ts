import type { RouteRecordRaw } from 'vue-router'
// /Users/nazil/Desktop/Nugu soft/mfukopro-be-fe/Frontend/src/tenant/modules/settings/routes.ts
const memberspermissions = () => import('./roles-permission/index.vue')
const Settings = () => import('./pages/Settings.vue')
const SettingsDashboard = () => import('./pages/SettingsDashboard.vue')
const OrganisationSettings = () => import('./pages/OrganisationSettings.vue')
const MembersSettings = () => import('./roles-permission/MembersSettings.vue')
const LoansSettings = () => import('./loan-products/index.vue')
const SavingsSettings = () => import('./pages/SavingsSettings.vue')
const SharesSettings = () => import('./shares-dividends/SharesSettings.vue')
const TransactionsSettings = () => import('./pages/TransactionsSettings.vue')
const AccountingSettings = () => import('./pages/AccountingSettings.vue')
const ComplianceSettings = () => import('./pages/ComplianceSettings.vue')
const NotificationsSettings = () => import('./pages/NotificationsSettings.vue')
const SystemSettings = () => import('./pages/SystemSettings.vue')
const PublicHolidaysSettings = () => import('./pages/PublicHolidaysSettings.vue')
const SavingsProducts = () => import('./pages/SavingsProducts.vue')
const SavingsProductForm = () => import('./pages/SavingsProductForm.vue')
const LoanProductIndex = () => import('../loan-products/pages/LoanProductIndex.vue')
const LoanProductForm = () => import('../loan-products/pages/LoanProductCreate.vue')
const LoanProductShow = () => import('../loan-products/pages/LoanProductShow.vue')
const StaffList = () => import('@/tenant/modules/settings/staff/Index.vue')
const Notification = () => import('@/tenant/modules/settings/notification/Index.vue')
// const StaffList = () => import('./staff/Index.vue')
const StaffProfile = () => import('./pages/StaffProfile.vue')
const GeneralSettings = () => import('./pages/GeneralSettings.vue')
const Notifications = () => import('./pages/Notifications.vue')
const TransactionCharges = () => import('./pages/TransactionCharges.vue')
const BranchList = () => import('@/tenant/modules/settings/branches/Index.vue')
const GeneralCharges = () => import('@/tenant/modules/settings/general-charges/Index.vue')
const Capitalize = () => import('@/tenant/modules/settings/shares-dividends/Capitalize/index.vue')
const ShareTransactionCharges = () => import('@/tenant/modules/settings/shares-dividends/share-transaction-charges/Index.vue')
const LoanChargesIndex = () => import('@/tenant/modules/settings/loan-charges/Index.vue')

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: 'settings',
    component: Settings,
    redirect: { name: 'tenant-settings-dashboard' },
    children: [
      {
        path: '',
        name: 'tenant-settings-dashboard',
        component: SettingsDashboard,
      },
      {
        path: 'general',
        name: 'tenant-settings-general',
        component: GeneralSettings,
      },
      {
        path: 'organisation',
        name: 'tenant-settings-organisation',
        component: OrganisationSettings,
      },
      {
        path: 'members',
        name: 'tenant-settings-members',
        component: MembersSettings,
      },
      {
        path: 'branches',
        name: 'tenant-settings-branch-list',
        component: BranchList,
      },
      {
        path: 'share-transaction-charges',
        name: 'tenant-settings-share-transaction-charges-list',
        component: ShareTransactionCharges,
      },
      {
        path: 'capitalize',
        name: 'tenant-settings-Capitalize-list',
        component: Capitalize,
      },
      {
        path: 'general-charges',
        name: 'tenant-settings-general-charges-list',
        component: GeneralCharges,
      },
      {
        path: 'loan-charges',
        name: 'tenant-settings-loan-charges',
        component: LoanChargesIndex,
      },
      {
        path: 'staff',
        name: 'tenant-settings-staff',
        component: StaffList,
      },
      {
        path: 'staff/:id',
        name: 'tenant-settings-staff-profile',
        component: StaffProfile,
      },
      {
        path: 'members-roles-permission',
        name: 'tenant-settings-members-roles-permission',
        component: memberspermissions,
      },
      {
        path: 'loans',
        name: 'tenant-settings-loans',
        component: LoansSettings,
      },
      {
        path: 'loan-products',
        name: 'tenant-settings-loan-products',
        component: LoanProductIndex,
      },
      {
        path: 'loan-products/:id',
        name: 'tenant-settings-loan-products-show',
        component: LoanProductShow,
      },
      {
        path: 'loan-products/create',
        name: 'tenant-settings-loan-products-create',
        component: LoanProductForm,
      },
      {
        path: 'loan-products/:id/edit',
        name: 'tenant-settings-loan-products-edit',
        component: LoanProductForm,
      },
      {
        path: 'savings',
        name: 'tenant-settings-savings',
        component: SavingsSettings,
      },
      {
        path: 'savings-products',
        name: 'tenant-settings-savings-products',
        component: SavingsProducts,
      },
      {
        path: 'savings-products/create',
        name: 'tenant-settings-savings-products-create',
        component: SavingsProductForm,
      },
      {
        path: 'savings-products/:id/edit',
        name: 'tenant-settings-savings-products-edit',
        component: SavingsProductForm,
      },
      {
        path: 'shares',
        name: 'tenant-settings-shares',
        component: SharesSettings,
      },
      {
        path: 'transactions',
        name: 'tenant-settings-transactions',
        component: TransactionsSettings,
      },
      {
        path: 'accounting',
        name: 'tenant-settings-accounting',
        component: AccountingSettings,
      },
      {
        path: 'compliance',
        name: 'tenant-settings-compliance',
        component: ComplianceSettings,
      },
      {
        path: 'notifications',
        name: 'tenant-settings-notifications',
        component: NotificationsSettings,
      },
      {
        path: 'system',
        name: 'tenant-settings-system',
        component: SystemSettings,
      },
      {
        path: 'public-holidays',
        name: 'tenant-settings-public-holidays',
        component: PublicHolidaysSettings,
      },
      {
        path: 'transaction-charges',
        name: 'tenant-settings-transaction-charges',
        component: TransactionCharges,
      },
      {
        path: 'old-notifications',
        name: 'tenant-settings-old-notifications',
        component: Notifications,
      },
      {
        path: 'staff-salaries',
        name: 'tenant-staff-salaries',
        component: () => import('@/tenant/components/globals/ComingSoon.vue'),
        meta: { label: 'Staff Salaries' }
      },
      {
        path: 'staff-allowances',
        name: 'tenant-staff-allowances',
        component: () => import('@/tenant/components/globals/ComingSoon.vue'),
        meta: { label: 'Staff Allowances' }
      },
      {
        path: 'staff-advances',
        name: 'tenant-staff-advances',
        component: () => import('@/tenant/components/globals/ComingSoon.vue'),
        meta: { label: 'Staff Advances' }
      },
      {
        path: 'tenant-settings-sms-setting',
        name: 'tenant-settings-sms-settings',
        component: Notification,
      },
    ],
  },
]
