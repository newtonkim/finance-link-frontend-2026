import type { RouteRecordRaw } from 'vue-router'
import { ArrowLeftRight, BookOpen, Building2, CreditCard, Layers, LayoutGrid, Puzzle, SettingsIcon, ShieldCheck, Store, Terminal, UserCog, Users } from 'lucide-vue-next'
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
    label: 'Dashboard',
    icon: LayoutGrid,
    component: () => import('./dashboard/index.vue'),
    showSideBar: true,
  },
  {
    path: 'my-profile',
    label: 'My Profile',
    showSideBar: false,
    component: () => import('./profile/MyProfile.vue'),
  },
  {
    path: 'licenses',
    label: 'Licenses',
    permissions: 'licenses-module-link-view',
    icon: CreditCard,
    showSideBar: true,
    badgeKey: 'licenseStats.payload.total',
    component: () => import('./licenses/Index.vue'),
  },
  {
    path: 'licenses/:id/renew',
    label: 'Payment Plan',
    showSideBar: false,
    component: () => import('./licenses/Renew.vue'),
  },
  {
    path: 'Plan',
    label: 'Plans',
    icon: BookOpen,
    showSideBar: true,
    component: () => import('./settings/General/plans/Index.vue'),
  },
  {
    path: 'platform-users',
    label: 'Platform Users',
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
    badgeKey: 'tenantList.payload.total',
    component: () => import('./tenants/Index.vue'),
    label: 'Tenants',
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
            icon: ShieldCheck,
            component: () => import('@/central/modules/settings/General/Permisions/Index.vue'),
            permissions: 'settings-permission-view',
          },
          {
            path: 'roles',
            label: 'roles',
            icon: UserCog,
            component: () => import('./settings/General/roles/Index.vue'),
          },
          {
            path: 'Plan',
            label: 'Plan',
            icon: Layers,
            component: () => import('./settings/General/plans/Index.vue'),
          },
          {
            path: 'features',
            label: 'Features',
            icon: Puzzle,
            component: () => import('./settings/General/features/Index.vue'),
          },
        ],
      },
      {
        title: 'Tools',
        items: [
          {
            path: 'currency',
            label: 'Currency',
            icon: ArrowLeftRight,
            component: () => import('./settings/General/currency/Index.vue'),
          },
        ],
      },
      {
        title: 'System',
        items: [
          {
            path: 'system',
            label: 'system',
            icon: Terminal,
            component: () => import('./settings/systems/developmentSettings/index.vue'),
          },
          {
            path: 'tenantssettings',
            label: 'tenantssettings',
            icon: Building2,
            component: () => import('./settings/systems/tenatsSettings/index.vue'),
          },
        ],
      },
    ],
  },
]

export const centralRoutes: RouteRecordRaw[] = routebuilder(centarRoutes, 'central')
