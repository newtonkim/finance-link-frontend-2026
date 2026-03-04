import { createRouter, createWebHistory } from 'vue-router'
import CentralLayout from '../central/layouts/CentralLayout.vue'
import TenantLayout from '../tenant/layouts/TenantLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/central',
      component: CentralLayout,
      children: [
        // Central module routes will be imported here
      ],
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
      redirect: '/central',
    },
  ],
})

export default router
