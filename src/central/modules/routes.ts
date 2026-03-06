import type { RouteRecordRaw } from 'vue-router'
import Login from './pages/Login.vue'
import Register from './pages/Register.vue'
import Dashboard from './pages/Dashboard.vue'

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
]
