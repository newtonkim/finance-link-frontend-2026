<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LogOut, User } from 'lucide-vue-next'

import { computed } from 'vue'

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/Global/ui/dropdown-menu'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const props = defineProps<{
  user?: Record<string, any> | null
}>()

const menuItems = computed(() => {
  const userId = props.user?.id || ''
  return [
    {
      label: 'Profile',
      icon: User,
      path: userId ? `/tenant/settings/staff/${userId}` : '/settings/profile',
    },
  ]
})

const navigate = (path: string) => router.push(path)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/central/login')
}
</script>

<template>
  <DropdownMenuSeparator class="bg-white/90 shadow-lg border-0 z-50" />
  <DropdownMenuGroup>
    <DropdownMenuItem
      v-for="item in menuItems"
      :key="item.path"
      @click="navigate(item.path)"
      class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer focus:bg-accent focus:text-accent-foreground"
    >
      <component :is="item.icon" class="mr-2 h-4 w-4" />
      {{ item.label }}
    </DropdownMenuItem>
  </DropdownMenuGroup>

  <DropdownMenuSeparator />

  <DropdownMenuItem
    class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 cursor-pointer focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/50 dark:focus:text-red-400"
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