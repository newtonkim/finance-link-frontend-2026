import type { RouteRecordRaw } from 'vue-router'
// /Users/nazil/Desktop/Nugu soft/mfukopro-be-fe/Frontend/src/tenant/modules/settings/routes.ts
const memberspermissions = () => import('./roles-permission/index.vue')
const Settings = () => import('./pages/Settings.vue')
const SettingsDashboard = () => import('./pages/SettingsDashboard.vue')
const OrganisationSettings = () => import('./pages/OrganisationSettings.vue')
const MembersSettings = () => import('./roles-permission/MembersSettings.vue')
const LoansSettings = () => import('./pages/LoansSettings.vue')
const SavingsSettings = () => import('./pages/SavingsSettings.vue')
const SharesSettings = () => import('./pages/SharesSettings.vue')
const TransactionsSettings = () => import('./pages/TransactionsSettings.vue')
const AccountingSettings = () => import('./pages/AccountingSettings.vue')
const ComplianceSettings = () => import('./pages/ComplianceSettings.vue')
const NotificationsSettings = () => import('./pages/NotificationsSettings.vue')
const SystemSettings = () => import('./pages/SystemSettings.vue')
const SavingsProducts = () => import('./pages/SavingsProducts.vue')
const SavingsProductForm = () => import('./pages/SavingsProductForm.vue')
const StaffList = () => import('./pages/StaffList.vue')
const StaffProfile = () => import('./pages/StaffProfile.vue')
const GeneralSettings = () => import('./pages/GeneralSettings.vue')
const Notifications = () => import('./pages/Notifications.vue')
const TransactionCharges = () => import('./pages/TransactionCharges.vue')

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
        path: 'transaction-charges',
        name: 'tenant-settings-transaction-charges',
        component: TransactionCharges,
      },
      {
        path: 'old-notifications',
        name: 'tenant-settings-old-notifications',
        component: Notifications,
      },
    ],
  },
]