import type { RouteRecordRaw } from 'vue-router'
import Login from './pages/Login.vue'
import Register from './pages/Register.vue'
import Dashboard from './pages/Dashboard.vue'

export const centralRoutes: RouteRecordRaw[] = [
  {
    path: 'login',
    name: 'central-login',
    component: Login,
    meta: { layout: 'central' },
  },
  {
    path: 'register',
    name: 'central-register',
    component: Register,
    meta: { layout: 'central' },
  },
  {
    path: 'central/dashboard',
    name: 'central-dashboard',
    component: Dashboard,
    meta: { layout: 'central' },
  },
]
