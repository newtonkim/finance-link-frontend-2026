import { createRouter, createWebHistory } from 'vue-router'
import CentralLayout from '../central/layouts/CentralLayout.vue'
import TenantLayout from '../tenant/layouts/TenantLayout.vue'
import TenantLogin from '../tenant/pages/TenantLogin.vue'
import {  centralRoutes, } from '../central/modules/routes'
import { dashboardRoutes } from '../tenant/modules/dashboard/routes'
// import { membersRoutes } from '../tenant/modules/members/routesNotUsed'
import { settingsRoutes } from '../tenant/modules/settings/routes'
import { savingsRoutes } from '../tenant/modules/savings/routes'
import { accountingRoutes } from '../tenant/modules/accounting/routes'
import { migrationRoutes } from '../tenant/modules/migration/routes'
import { reportsRoutes } from '../tenant/modules/reports/routes'
import { loanRoutes } from '../tenant/modules/loans/routes'
import { getTenantSubdomain } from '@/Global'
import { tenantRoutes, tenantRoutesList } from "@/tenant/layouts/routes.ts";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Default redirect — resolved by beforeEach guard below
    {
      path: '/',
      redirect: '/central/login',
    },
    // Central admin routes
    {
      path: '/',
      component: CentralLayout,
      children: [...centralRoutes],
    },
    // Central auth routes (outside layout)
    {
      path: '/central/login',
      name: 'central-login',
      component: () => import('../central/modules/pages/Login.vue'),
    },
    {
      path: '/central/register',
      name: 'central-register',
      component: () => import('../central/modules/pages/Register.vue'),
    },
    // Tenant login (outside layout)
    {
      path: '/tenant/login',
      name: 'tenant-login',
      component: TenantLogin,
    },
    {
      path: '/tenant',
      component: TenantLayout,
      redirect: '/tenant/dashboard',
      children: [
              ...tenantRoutesList,
    
        ...dashboardRoutes,
        // ...membersRoutes,
        ...settingsRoutes,
        ...savingsRoutes,
        ...accountingRoutes,
        ...migrationRoutes,
        ...reportsRoutes,
        ...loanRoutes,
      ],
    },
  ],
})

// Redirect to the correct login depending on context
router.beforeEach((to) => {
  const subdomain = getTenantSubdomain()

  if (subdomain) {
    // On a tenant subdomain: only allow /tenant/* routes
    if (!to.path.startsWith('/tenant')) {
      return { path: '/tenant/login' }
    }
  }
})

export default router
