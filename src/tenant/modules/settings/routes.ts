import type { RouteRecordRaw } from 'vue-router'
import Settings from './pages/Settings.vue'
import SettingsDashboard from './pages/SettingsDashboard.vue'
import OrganisationSettings from './pages/OrganisationSettings.vue'
import MembersSettings from './pages/MembersSettings.vue'
import LoansSettings from './pages/LoansSettings.vue'
import SavingsSettings from './pages/SavingsSettings.vue'
import SharesSettings from './pages/SharesSettings.vue'
import TransactionsSettings from './pages/TransactionsSettings.vue'
import AccountingSettings from './pages/AccountingSettings.vue'
import ComplianceSettings from './pages/ComplianceSettings.vue'
import NotificationsSettings from './pages/NotificationsSettings.vue'
import SystemSettings from './pages/SystemSettings.vue'
import SavingsProducts from './pages/SavingsProducts.vue'
import SavingsProductForm from './pages/SavingsProductForm.vue'
import StaffList from './pages/StaffList.vue'
import StaffProfile from './pages/StaffProfile.vue'
import GeneralSettings from './pages/GeneralSettings.vue'
import Notifications from './pages/Notifications.vue'
import TransactionCharges from './pages/TransactionCharges.vue'

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
