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
import { useTenantUserStore } from '@/stores/tenantUserStore'
import { useProfileStore } from '@/stores/profileStore'
import { getTenantSubdomain } from '@/Global'

const router = useRouter()
const authStore = useAuthStore()
const tenantUserStore = useTenantUserStore()
const profileStore = useProfileStore()
tenantUserStore.load()

const props = defineProps<{
  user?: Record<string, any> | null
}>()

const menuItems = computed(() => {
  // Route to the profile that matches the current context: a tenant subdomain
  // gets the tenant profile, the central admin gets the central profile.
  const isTenant = !!getTenantSubdomain()
  return [
    {
      label: 'Profile',
      icon: User,
      path: isTenant ? '/tenant/my-profile' : '/central/my-profile',
    },
  ]
})

const navigate = (path: string) => {
  if (!path) return
  router.push(path)
}

const handleLogout = async () => {
  const res = await authStore.logout()
  tenantUserStore.clear()
  profileStore.clear()
  const backendRedirect = res?.data?.redirect_url
  
  if (backendRedirect) {
    router.push(backendRedirect)
    return
  }

  const subdomain = getTenantSubdomain()
  if (subdomain) {
    router.push('/tenant/login')
  } else {
    router.push('/central/login')
  }
}
</script>

<template>
  <DropdownMenuSeparator class="bg-white/90 shadow-lg border-0 z-50" />
  <DropdownMenuGroup class="p-1">
    <DropdownMenuItem
      v-for="item in menuItems"
      :key="item.path"
      @click="navigate(item.path)"
      class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer focus:bg-neutral-100 dark:focus:bg-white/5"
    >
      <component :is="item.icon" class="h-4 w-4" />
      <span>{{ item.label }}</span>
    </DropdownMenuItem>
  </DropdownMenuGroup>

  <DropdownMenuSeparator class="bg-neutral-100 dark:bg-white/5" />
  <DropdownMenuItem
    class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-500 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 cursor-pointer focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-red-600 dark:focus:text-red-400 m-1"
    @click="handleLogout"
    data-test="logout-button"
  >
    <LogOut class="h-4 w-4" />
    <span>Log out</span>
  </DropdownMenuItem>
</template>

<style>
#reka-dropdown-menu-content-v-9 {
  border: 0 !important;
}
</style>