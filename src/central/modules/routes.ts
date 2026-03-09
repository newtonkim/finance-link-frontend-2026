import type { RouteRecordRaw } from 'vue-router' 
import Tenants from './pages/Tenants.vue'
import CreateTenant from './pages/CreateTenant.vue'
import TenantDetail from './pages/TenantDetail.vue'
import Licenses from './pages/Licenses.vue'
import CreateLicense from './pages/CreateLicense.vue'

// Auth routes — rendered WITHOUT the sidebar layout
export const centralAuthRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'central-login',
    component: () => import('./pages/Login.vue'),
    meta: { layout: 'central' },
  },
  {
    path: '/register',
    name: 'central-register',
    component: () => import('./pages/Register.vue'),
    meta: { layout: 'central' },
  },
  {
    path: '/central/tenants',
    name: 'central-tenants',
    component: Tenants,
    meta: { layout: 'central' },
  },
  {
    path: '/central/tenants/create',
    name: 'central-tenants-create',
    component: CreateTenant,
    meta: { layout: 'central' },
  },
  {
    path: '/central/licenses',
    path: '/central/tenants/:id',
    name: 'central-tenants-show',
    component: TenantDetail,
    meta: { layout: 'central' },
  },
  {
    path: '/central/licenses',
    name: 'central-licenses',
    component: Licenses,
    meta: { layout: 'central' },
  },
  {
    path: '/central/licenses/create',
    name: 'central-licenses-create',
    component: CreateLicense,
    meta: { layout: 'central' },
  },
]


// App routes — rendered INSIDE CentralLayout (with sidebar)

const routes = [
  {
    path: 'dashboard',
    component: () => import('./pages/Dashboard.vue'),
  },
  {
    path: 'tenants',
    component: () => import('./tenants/Index.vue'),
  },
  {
    path: 'licenses',
    component: () => import('./licenses/Index.vue'),
  },
]

export const centralRoutes: RouteRecordRaw[] = routes.map((route) => ({
  path: `/central/${route.path}`,
  name: `central-${route.path}`,
  component: route.component,
  meta: { layout: 'central' },
}))
