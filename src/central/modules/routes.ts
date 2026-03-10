import type { RouteRecordRaw } from 'vue-router' 
export const hRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('./pages/Login.vue'),
  },
  {
    path: '/register',
    component: () => import('./pages/Register.vue'),
  },
  {
    path: '/central/tenants',  
    component: () => import('./pages/Licenses.vue'),
  },
  {
    path: '/central/tenants/create',
    component: () => import('./pages/CreateTenant.vue'),
  },
  { 
    path: '/central/tenants/:id',  
    component: () => import('./pages/TenantDetail.vue'), 
  },
  {
    path: '/central/licenses',
    component: () => import('./pages/Licenses.vue'),
  },
  {
    path: '/central/licenses/create',
    component: () => import('./pages/CreateLicense.vue'),

  },
]
export const centralAuthRoutes: RouteRecordRaw[] = routebuilder(hRoutes)
const routes = [
  {
    path: 'dashboard',
    component: () => import('./pages/Dashboard.vue'),
  },
  {
    path: 'platform-users',
    component: () => import('./staff/Index.vue'),
  },
  {
    path: 'settings',
    component: () => import('./settings/Index.vue'),
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
export const centralRoutes: RouteRecordRaw[] = routebuilder(routes)
function routebuilder(routes: RouteRecordRaw[], prefix = 'central') {
  return routes.map((route) => {
    const routePath = `${prefix}/${route.path}`
    return {
      meta: { layout: 'central' },
      name: routePath.replace(/\//g, '-'),
      path: `/${routePath}`,
      component: route.component,
    }
  })
}