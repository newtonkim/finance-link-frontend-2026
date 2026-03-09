import type { RouteRecordRaw } from 'vue-router'
import Members from './pages/Members.vue'

export const membersRoutes: RouteRecordRaw[] = [
  {
    path: 'members',
    name: 'tenant-members',
    component: Members,
  },
]
