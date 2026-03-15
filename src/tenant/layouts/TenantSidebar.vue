<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutGrid,
  Users,
  Wallet,
  HandCoins,
  ArrowUpDown,
  BookOpen,
  Settings,
  Moon,
  Sun,
  MapPin,
  Mail,
  ArrowLeftRight,
  DatabaseZap,
} from 'lucide-vue-next'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/Global/ui/sidebar'
import TenantNavUser from './TenantNavUser.vue'
import { useTenantContextStore } from '@/stores/tenantContext'
import { membersApi } from '@/tenant/apis/members/membersApi'
import { saccoBrandingApi, saccoBrandingState } from '@/tenant/apis/saccobranding/saccoBrandingApi'

const route = useRoute()
const router = useRouter()
const { state } = useSidebar()
const tenantStore = useTenantContextStore()

const isDark = ref(document.documentElement.classList.contains('dark'))
function toggleDarkMode() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

const isActive = (path: string) => route.path === path
const isSettingsActive = computed(() => route.path.startsWith('/tenant/settings'))

const navItems = [
  { title: 'Dashboard', href: '/tenant/dashboard', icon: LayoutGrid },
  { title: 'Members', href: '/tenant/members', icon: Users },
  { title: 'Members Account', href: '/tenant/savings-accounts', icon: Wallet },
  { title: 'Group Savings', href: '/tenant/savings-groups', icon: Users },
  { title: 'Savings Transfer', href: '/tenant/savings-transfer', icon: ArrowLeftRight },
  { title: 'Loans', href: '/tenant/loans', icon: HandCoins },
  { title: 'Transactions', href: '/tenant/transactions', icon: ArrowUpDown },
  { title: 'Chart of Accounts', href: '/tenant/chart-of-accounts', icon: BookOpen },
]

// Settings sub-items removed to avoid duplication with the Settings Workspace sidebar

const tenant = tenantStore.currentTenant as any

const memberCount = computed(() => tenantStore.memberCount)

onMounted(async () => {
  const [membersRes] = await Promise.allSettled([
    membersApi.list({ page: 1 }),
    (async () => {
      if (!saccoBrandingState.loaded) {
        try { await saccoBrandingApi.get() } catch { /* silently ignore */ }
      }
    })(),
  ])
  if (membersRes.status === 'fulfilled') {
    const total = membersRes.value.data?.meta?.total ?? membersRes.value.data?.total ?? null
    if (total !== null) tenantStore.setMemberCount(total)
  }
})
</script>

<template>
  <Sidebar collapsible="icon" variant="inset" class="bg-[#0A2318] text-white border-r-0">
    <!-- Header: SACCO brand -->
    <SidebarHeader class="p-4">
      <div class="flex items-center gap-3">
        <!-- Logo: show uploaded logo or fallback icon -->
        <div
          class="flex shrink-0 items-center justify-center overflow-hidden transition-all duration-500"
          :class="state === 'expanded' ? 'h-14 w-14' : 'h-8 w-8'">
          <img
            v-if="saccoBrandingState.logo_url"
            :src="saccoBrandingState.logo_url"
            alt="Sacco logo"
            class="h-full w-full object-contain"
          />
          <div v-else
            class="flex h-full w-full items-center justify-center rounded-2xl bg-bg-nfuko-yellow text-[#0A2318] shadow-xl">
            <LayoutGrid :class="state === 'expanded' ? 'h-7 w-7' : 'h-5 w-5'" />
          </div>
        </div>

        <div v-if="state === 'expanded'" class="flex flex-col min-w-0">
          <span class="text-lg font-bold leading-tight tracking-tight text-white italic truncate">
            {{ saccoBrandingState.sacco_name || tenant?.name || 'SACCO Portal' }}
          </span>
          <span v-if="saccoBrandingState.tagline || tenant?.settings?.slogan"
            class="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-nfuko-nav-text/80 truncate">
            {{ saccoBrandingState.tagline || tenant?.settings?.slogan }}
          </span>
        </div>
      </div>

      <!-- Contact info when expanded -->
      <div v-if="state === 'expanded' && (tenant?.settings?.address || tenant?.settings?.email)"
        class="mt-4 flex flex-col gap-2 border-t border-white/5 pt-4">
        <div v-if="tenant?.settings?.address" class="flex items-start gap-2 text-nfuko-nav-text">
          <MapPin class="mt-0.5 h-3.5 w-3.5 shrink-0 text-bg-nfuko-yellow" />
          <span class="text-[10px] font-medium leading-normal">{{ tenant.settings.address }}</span>
        </div>
        <div v-if="tenant?.settings?.email" class="flex items-center gap-2 text-nfuko-nav-text">
          <Mail class="h-3.5 w-3.5 shrink-0 text-bg-nfuko-yellow" />
          <span class="text-[10px] font-medium truncate">{{ tenant.settings.email }}</span>
        </div>
      </div>
    </SidebarHeader>

    <SidebarContent class="px-2 overflow-y-auto">
      <!-- NAVIGATION -->
      <SidebarGroup>
        <SidebarGroupLabel class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-nfuko-nav-text/50">
          Navigation
        </SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in navItems" :key="item.title">
            <SidebarMenuButton :tooltip="item.title" @click="router.push(item.href)"
              class="relative px-0 py-2.5 hover:bg-white/5 transition-all duration-200 group">
              <div class="flex w-full items-center gap-3 pl-4 pr-3">
                <component :is="item.icon" class="h-4 w-4 transition-colors duration-200"
                  :class="isActive(item.href) ? 'text-bg-nfuko-yellow' : 'text-nfuko-nav-text group-hover:text-bg-nfuko-yellow'" />
                <span class="flex-1 font-medium text-[13px] tracking-wide transition-colors duration-200"
                  :class="isActive(item.href) ? 'text-bg-nfuko-yellow' : 'text-nfuko-nav-text group-hover:text-white'">
                  {{ item.title }}
                </span>
                <span
                  v-if="item.href === '/tenant/members' && memberCount !== null && state === 'expanded'"
                  class="inline-flex items-center justify-center rounded-full bg-nfuko-accent px-1.5 min-w-[20px] h-5 text-[10px] font-bold leading-none text-[#0A2318]"
                >
                  {{ memberCount > 9999 ? '9999+' : memberCount }}
                </span>
              </div>
              <!-- Active left indicator -->
              <div v-if="isActive(item.href)"
                class="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-bg-nfuko-yellow rounded-r-full shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <!-- DATA MIGRATION -->
      <SidebarGroup class="mt-2">
        <SidebarGroupLabel class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-nfuko-nav-text/50">
          Data Migration
        </SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton :tooltip="'Migration Hub'" @click="router.push('/tenant/migration')"
              class="relative px-0 py-2.5 hover:bg-white/5 transition-all duration-200 group">
              <div class="flex w-full items-center gap-3 pl-4 pr-3">
                <DatabaseZap class="h-4 w-4 transition-colors duration-200"
                  :class="route.path.startsWith('/tenant/migration') ? 'text-bg-nfuko-yellow' : 'text-nfuko-nav-text group-hover:text-bg-nfuko-yellow'" />
                <span class="flex-1 font-medium text-[13px] tracking-wide transition-colors duration-200"
                  :class="route.path.startsWith('/tenant/migration') ? 'text-bg-nfuko-yellow' : 'text-nfuko-nav-text group-hover:text-white'">
                  Migration
                </span>
              </div>
              <div v-if="route.path.startsWith('/tenant/migration')"
                class="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-bg-nfuko-yellow rounded-r-full shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <!-- CONFIGURATION -->
      <SidebarGroup class="mt-2">
        <SidebarGroupLabel class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-nfuko-nav-text/50">
          Configuration
        </SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton :tooltip="'Settings'" @click="router.push('/tenant/settings')" :class="[
              'relative px-0 py-2.5 hover:bg-white/5 transition-all duration-200 group',
              isSettingsActive ? 'bg-white/5' : ''
            ]">
              <div class="flex w-full items-center gap-3 pl-4 pr-3">
                <Settings class="h-4 w-4 transition-colors duration-200"
                  :class="isSettingsActive ? 'text-bg-nfuko-yellow' : 'text-nfuko-nav-text group-hover:text-bg-nfuko-yellow'" />
                <span class="flex-1 font-medium text-[13px] tracking-wide transition-colors duration-200"
                  :class="isSettingsActive ? 'text-bg-nfuko-yellow' : 'text-nfuko-nav-text group-hover:text-white'">
                  Settings
                </span>
              </div>
              <div v-if="isSettingsActive"
                class="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-bg-nfuko-yellow rounded-r-full shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="p-4 space-y-3">
      <!-- Dark mode toggle -->
      <div class="flex items-center justify-between px-2 bg-white/5 rounded-xl p-3 border border-white/5">
        <div class="flex items-center gap-2.5">
          <Moon v-if="isDark" :size="16" class="text-bg-nfuko-yellow" />
          <Sun v-else :size="16" class="text-bg-nfuko-yellow" />
          <span class="text-xs font-semibold text-nfuko-nav-text tracking-wide">Dark Mode</span>
        </div>
        <button @click="toggleDarkMode"
          class="relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300"
          :class="isDark ? 'bg-bg-nfuko-yellow' : 'bg-white/10'">
          <span class="inline-flex h-4 w-4 rounded-full bg-white transition-transform duration-300 shadow-xl"
            :class="isDark ? 'translate-x-5' : 'translate-x-0.5'" />
        </button>
      </div>
      <TenantNavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
