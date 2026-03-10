import { createRouter, createWebHistory } from 'vue-router'
import CentralLayout from '../central/layouts/CentralLayout.vue'
import TenantLayout from '../tenant/layouts/TenantLayout.vue'
import TenantLogin from '../tenant/pages/TenantLogin.vue'
import {  centralRoutes, } from '../central/modules/routes'
import { dashboardRoutes } from '../tenant/modules/dashboard/routes'
import { membersRoutes } from '../tenant/modules/members/routes'
import { settingsRoutes } from '../tenant/modules/settings/routes'
import { savingsRoutes } from '../tenant/modules/savings/routes'
import { accountingRoutes } from '../tenant/modules/accounting/routes'

/** Returns the subdomain if running on a tenant subdomain (e.g. naivasha-sacco.localhost) */
function getTenantSubdomain(): string | null {
  const hostname = window.location.hostname
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null // plain IP
  const parts = hostname.split('.')
  const subdomain = parts.length >= 2 ? parts[0] : null
  if (!subdomain || ['admin', 'www', 'localhost'].includes(subdomain)) return null
  return subdomain
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Default redirect — resolved by beforeEach guard below
    {
      path: '/',
      redirect: '/login',
    }, 
    {
      path: '/',
      component: CentralLayout,
      children: [...centralRoutes],
    }, 
    // // Tenant app routes — wrapped in TenantLayout
    // {
    //   path: '',
    //   component: TenantLayout,
    //   children: [...Routes],
    // },
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
