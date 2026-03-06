import type { RouteRecordRaw } from 'vue-router'
import Login from './pages/Login.vue'
import Register from './pages/Register.vue'
import Dashboard from './pages/Dashboard.vue'
import Tenants from './pages/Tenants.vue'
import CreateTenant from './pages/CreateTenant.vue'
import Licenses from './pages/Licenses.vue'
import CreateLicense from './pages/CreateLicense.vue'

// Auth routes — rendered WITHOUT the sidebar layout
export const centralAuthRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'central-login',
    component: Login,
  },
  {
    path: '/register',
    name: 'central-register',
    component: Register,
  },
]

// App routes — rendered INSIDE CentralLayout (with sidebar)
export const centralRoutes: RouteRecordRaw[] = [
  {
    path: 'central/dashboard',
    name: 'central-dashboard',
    component: Dashboard,
    meta: { layout: 'central' },
  },
  {
    path: 'central/tenants',
    name: 'central-tenants',
    component: Tenants,
    meta: { layout: 'central' },
  },
  {
    path: 'central/tenants/create',
    name: 'central-tenants-create',
    component: CreateTenant,
    meta: { layout: 'central' },
  },
  {
    path: 'central/licenses',
    name: 'central-licenses',
    component: Licenses,
    meta: { layout: 'central' },
  },
  {
    path: 'central/licenses/create',
    name: 'central-licenses-create',
    component: CreateLicense,
    meta: { layout: 'central' },
  },
]
