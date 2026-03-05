import { createRouter, createWebHistory } from 'vue-router'
import CentralLayout from '../central/layouts/CentralLayout.vue'
import TenantLayout from '../tenant/layouts/TenantLayout.vue'
import { centralRoutes } from '../central/modules/routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
    {
      path: '/',
      redirect: '/login',
    }, 
  ],
})

export default router
