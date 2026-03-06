import type { RouteRecordRaw } from 'vue-router' 
import Tenants from './pages/Tenants.vue'
import CreateTenant from './pages/CreateTenant.vue'

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
