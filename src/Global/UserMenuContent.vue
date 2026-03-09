<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LogOut, Settings, LayoutGrid } from 'lucide-vue-next'

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/Global/ui/dropdown-menu'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

defineProps<{
  user: Record<string, any>
}>()

const menuItems = [
  {
    label: 'Settings',
    icon: Settings,
    path: '/settings/profile',
  },
  {
    label: 'System Settings',
    icon: LayoutGrid,
    path: '/settings/system',
  },
]

const navigate = (path: string) => router.push(path)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <DropdownMenuSeparator class="bg-white/90 shadow-lg border-0 z-50" />

  <DropdownMenuGroup>
    <DropdownMenuItem
      v-for="item in menuItems"
      :key="item.path"
      @click="navigate(item.path)"
      class="cursor-pointer focus:bg-white/5   hover:text-neutral-600 hover:text-neutral-500"
    >
      <component :is="item.icon" class="mr-2 h-4 w-4" />
      {{ item.label }}
    </DropdownMenuItem>
  </DropdownMenuGroup>

  <DropdownMenuSeparator class="bg-white/10" />

  <DropdownMenuItem
    class="cursor-pointer text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 focus:text-red-400"
    @click="handleLogout"
    data-test="logout-button"
  >
    <LogOut class="mr-2 h-4 w-4" />
    Log out
  </DropdownMenuItem>
</template>

<style>
#reka-dropdown-menu-content-v-9 {
  border: 0 !important;
}
</style>