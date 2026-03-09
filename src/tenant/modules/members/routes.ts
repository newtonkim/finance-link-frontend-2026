import type { RouteRecordRaw } from 'vue-router'
import Members from './pages/Members.vue'
import MemberCreate from './pages/MemberCreate.vue'

export const membersRoutes: RouteRecordRaw[] = [
  {
    path: 'members',
    name: 'tenant-members',
    component: Members,
  },
  {
    path: 'members/create',
    name: 'tenant-members-create',
    component: MemberCreate,
  },
]
