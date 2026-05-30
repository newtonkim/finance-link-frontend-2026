<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronsUpDown, LogOut, User } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/Global/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/Global/ui/sidebar'
import { useTenantUserStore } from '@/stores/tenantUserStore'
import { useBranchStore } from '@/stores/branchStore'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profileStore'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const store = useTenantUserStore()
const branchStore = useBranchStore()
const { isMobile, state } = useSidebar()

onMounted(() => store.load())

const user = computed(() => store.user)

const initials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
})

const logout = async () => {
  const res = await authStore.logout()
  store.clear()
  profileStore.clear()
  branchStore.clear()
  
  if (res?.data?.redirect_url) {
    router.push(res.data.redirect_url)
  } else {
    router.push('/tenant/login')
  }
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-white/10 hover:bg-white/5 transition-all duration-200 py-6"
          >
            <!-- Avatar -->
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nfuko-yellow text-[#0050D8] text-[11px] font-black shadow"
            >
              {{ initials }}
            </div>
            <!-- Name + email (hidden when sidebar is collapsed) -->
            <div
              v-if="state === 'expanded'"
              class="ml-2 grid flex-1 text-left leading-tight min-w-0"
            >
              <span class="truncate text-[13px] font-bold text-white">
                {{ user?.name ?? 'Staff User' }}
              </span>
              <span class="truncate text-[10px] font-medium text-nfuko-nav-text/60">
                {{ user?.email ?? '' }}
              </span>
            </div>
            <ChevronsUpDown
              v-if="state === 'expanded'"
              class="ml-auto h-3 w-3 text-nfuko-nav-text/40 shrink-0"
            />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          class="min-w-56 rounded-xl bg-nfuko-primary text-white border border-white/10 shadow-2xl p-1"
          :side="isMobile ? 'bottom' : state === 'collapsed' ? 'right' : 'bottom'"
          align="end"
          :side-offset="6"
        >
          <!-- User info header -->
          <DropdownMenuLabel class="flex items-center gap-3 px-3 py-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-nfuko-yellow text-[#0050D8] text-[12px] font-black"
            >
              {{ initials }}
            </div>
            <div class="grid min-w-0">
              <span class="truncate text-[13px] font-bold text-white">
                {{ user?.name ?? 'Staff User' }}
              </span>
              <span class="truncate text-[11px] text-nfuko-nav-text/60">
                {{ user?.email ?? '' }}
              </span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator class="bg-white/10 my-1" />

          <!-- Profile -->
          <DropdownMenuItem
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-nfuko-nav-text hover:bg-white/5 hover:text-white cursor-pointer focus:bg-white/5 focus:text-white"
            @click="router.push(`/tenant/settings/staff/${user?.id}`)"
          >
            <User class="h-4 w-4" />
            Profile &amp; Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator class="bg-white/10 my-1" />

          <!-- Logout -->
          <DropdownMenuItem
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-red-400 hover:bg-red-400/10 hover:text-red-300 cursor-pointer focus:bg-red-400/10 focus:text-red-300"
            @click="logout"
          >
            <LogOut class="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
