import { createRouter, createWebHistory } from 'vue-router'
import CentralLayout from '../central/layouts/CentralLayout.vue'
import TenantLayout from '../tenant/layouts/TenantLayout.vue'
import { centralRoutes, centralAuthRoutes } from '../central/modules/routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Default redirect — must come first
    {
      path: '/',
      redirect: '/login',
    },
    // Auth routes — no sidebar/layout wrapper
    ...centralAuthRoutes,
    // App routes — wrapped in CentralLayout (sidebar + top bar)
    {
      path: '/',
      component: CentralLayout,
      children: [...centralRoutes],
    },
    {
      path: '/tenant',
      component: TenantLayout,
      children: [
        // Tenant module routes will be imported here
      ],
    },
  ],
})

export default router
