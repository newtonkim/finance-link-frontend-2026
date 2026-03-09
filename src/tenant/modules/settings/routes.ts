import type { RouteRecordRaw } from 'vue-router'
import Settings from './pages/Settings.vue'
import GeneralSettings from './pages/GeneralSettings.vue'
import Notifications from './pages/Notifications.vue'
import SystemSettings from './pages/SystemSettings.vue'
import SavingsProducts from './pages/SavingsProducts.vue'
import TransactionCharges from './pages/TransactionCharges.vue'

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: 'settings',
    component: Settings,
    redirect: { name: 'tenant-settings-general' },
    children: [
      {
        path: 'general',
        name: 'tenant-settings-general',
        component: GeneralSettings,
      },
      {
        path: 'notifications',
        name: 'tenant-settings-notifications',
        component: Notifications,
      },
      {
        path: 'system',
        name: 'tenant-settings-system',
        component: SystemSettings,
      },
      {
        path: 'savings-products',
        name: 'tenant-settings-savings-products',
        component: SavingsProducts,
      },
      {
        path: 'transaction-charges',
        name: 'tenant-settings-transaction-charges',
        component: TransactionCharges,
      },
    ],
  },
]
