import type { RouteRecordRaw } from 'vue-router'
import { CreditCard, LayoutGrid, SettingsIcon, Store, Users } from 'lucide-vue-next'
import { routebuilder } from '@/Global'
export const centarRoutes: any = [
  {
    path: 'Main',
    label: 'Main',
    type: 'label',
    showSideBar: true,
  },
  {
    path: 'dashboard',
    label: 'dashboard',
    icon: LayoutGrid,
    component: () => import('./dashboard/index.vue'),
    showSideBar: true,
  },
  {
    path: 'licenses',
    label: 'licenses',
    permissions: 'licenses-module-link-view',
    icon: CreditCard,
    showSideBar: true,
    component: () => import('./licenses/Index.vue'),
  },
  {
    path: 'platform-users',
    label: 'platform-users',
    permissions: 'staff-module-link-view',
    icon: Users,
    showSideBar: true,
    component: () => import('./staff/Index.vue'),
  },
  {
    path: 'tenants',
    icon: Store,
    showSideBar: true,
    permissions: 'tenants-module-link-view',
    component: () => import('./tenants/Index.vue'),
    label: 'tenants',
  },
  {
    path: 'tenants/:id',

    component: () => import('./pages/TenantDetail.vue'),
  },

  {
    label: 'Settings',
    icon: SettingsIcon,
    permissions: 'settings-module-link-view',
    showSideBar: true,
    prifix: 'central',
    children: [
      {
        title: 'General',
        items: [
          {
            path: 'Permission',
            label: 'Permission',
            component: () => import('./settings/general/permisions/Index.vue'),
            permissions: 'settings-permission-view',
          },
          {
            path: 'roles',
            label: 'roles',
            component: () => import('./settings/general/roles/Index.vue'),
          },
          {
            path: 'Plan',
            label: 'Plan',
            component: () => import('./settings/general/plans/Index.vue'),
          },
        ],
      },
      {
        title: 'System',
        items: [
          {
            path: 'system',
            label: 'system',
            component: () => import('./settings/systems/developmentSettings/index.vue'),
          },
          {
            path: 'tenantssettings',
            label: 'tenantssettings',
            component: () => import('./settings/systems/tenatsSettings/index.vue'),
          },
        ],
      },
    ],
  },
]

export const centralRoutes: RouteRecordRaw[] = routebuilder(centarRoutes, 'central')
