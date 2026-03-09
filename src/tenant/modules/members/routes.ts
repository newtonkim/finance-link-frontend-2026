import type { RouteRecordRaw } from 'vue-router'
import Members from './pages/Members.vue'
import MemberCreate from './pages/MemberCreate.vue'
import MemberEdit from './pages/MemberEdit.vue'
import MemberShow from './pages/MemberShow.vue'

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
  {
    path: 'members/:id/edit',
    name: 'tenant-members-edit',
    component: MemberEdit,
  },
  {
    path: 'members/:id',
    name: 'tenant-members-show',
    component: MemberShow,
  },
]
