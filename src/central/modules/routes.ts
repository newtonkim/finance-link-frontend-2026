import type { RouteRecordRaw } from 'vue-router'

export const centralRoutes: RouteRecordRaw[] = [
  {
    path: 'login',
    name: 'central-login',
    component: () => import('./pages/Login.vue'),
    meta: { layout: 'central' },
  },
  {
    path: 'register',
    name: 'central-register',
    component: () => import('./pages/Register.vue'),
    meta: { layout: 'central' },
  },
  {
    path: 'central/dashboard',
    name: 'central-dashboard',
    component: () => import('./pages/Dashboard.vue'),
    meta: { layout: 'central' },
  },
  {
    path: 'central/tenants',
    name: 'tenants-dashboard',
    component: () => import('./tenants/Index.vue'),
    meta: { layout: 'central' },
  },
]