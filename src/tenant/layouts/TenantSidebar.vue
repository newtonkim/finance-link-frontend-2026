<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutGrid,
  Settings,
  Moon,
  Sun,
  MapPin,
  Mail,
  DatabaseZap,
  HandCoins,
  Wallet,
  Vote,
  Receipt,
  TrendingDown,
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
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,

} from '@/Global'
// import TenantNavUser from './TenantNavUser.vue'
import { useTenantContextStore } from '@/stores/tenantContext'
import { tenantRoutes } from "@/tenant/layouts/routes.ts";
import { OutClickNav } from '@/Global/OutClicknavigation';
import { saccoBrandingState } from '@/tenant/apis/saccobranding/saccoBrandingApi'
import { pomPinia } from 'septor-store'
import type { MenuRoutes } from '@/Global/types/helpers'

const Store = pomPinia() as any
const route = useRoute()
const router = useRouter()
const { state } = useSidebar()
const tenantStore = useTenantContextStore()

const isDark = ref(document.documentElement.classList.contains('dark'))
function toggleDarkMode() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

const isSettingsActive = computed(() => route.path.startsWith('/tenant/settings'))



const tenant = tenantStore.currentTenant as any
// const fullRemount = computed(() => Store.fullRemount)
const tenantRoutesReactive = computed(() => tenantRoutes)
onMounted(() => {
  // Any necessary onMounted logic
})

// Group routes by their `group` field for section rendering
const groupedRoutes = computed(() => {
  const groups: { label: string; routes: MenuRoutes[] }[] = []
  const groupMap = new Map<string, MenuRoutes[]>()
  const order: string[] = []

  for (const r of tenantRoutes) {
    const group = r.group || ''
    if (!groupMap.has(group)) {
      groupMap.set(group, [])
      order.push(group)
    }
    // Skip label-type items; group headers replace their role
    if (r.type !== 'label') {
      groupMap.get(group)!.push(r)
    }
  }

  for (const label of order) {
    const routes = groupMap.get(label)!
    if (routes.length > 0) {
      groups.push({ label, routes })
    }
  }

  return groups
})


</script>

<template>
  <Sidebar collapsible="icon" variant="inset" class="bg-[#0A2318] text-white border-r-0">
    <SidebarHeader class="px-4 py-4">
      <!-- Logo + Sacco Name -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex shrink-0 items-center justify-center rounded-2xl transition-all duration-500 overflow-hidden"
            :class="[
              state === 'expanded' ? 'h-14 w-14' : 'h-8 w-8',
              saccoBrandingState.logo_url ? '' : 'bg-nfuko-yellow text-[#0A2318] shadow-xl'
            ]">
            <img v-if="saccoBrandingState.logo_url" :src="saccoBrandingState.logo_url" alt="Sacco logo"
              class="h-full w-full object-contain" />
            <LayoutGrid v-else :class="state === 'expanded' ? 'h-7 w-7' : 'h-5 w-5'" />
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
        <SidebarTrigger v-if="state === 'expanded'"
          class="text-nfuko-nav-text hover:bg-white/10 hover:text-white transition-colors" />
      </div>

      <div v-if="state === 'collapsed'" class="flex justify-center w-full mt-2">
        <SidebarTrigger class="text-nfuko-nav-text hover:bg-white/10 hover:text-white transition-colors" />
      </div>

      <!-- Address & Email (preserved, shown when available) -->
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

    <!-- NAVIGATION: Grouped Sections -->
    <SidebarContent class="flex-1 overflow-y-auto min-h-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden px-3 flex flex-col">
      <template v-for="group in groupedRoutes" :key="group.label">
        <SidebarGroup class="py-0">
          <SidebarGroupLabel v-if="state === 'expanded' && group.label"
            class="px-2 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-nfuko-nav-text/40 flex items-center gap-2">
            {{ group.label }}
          </SidebarGroupLabel>
          <SidebarSeparator v-else class="bg-white/5 mx-2 my-2" />
          
          <SidebarMenu>
            <OutClickNav class="!h-auto !py-0 !flex-none" :links="group.routes" />
            
            <!-- Manual addition of Settings to REPORTING group to ensure independence -->
            <SidebarMenuItem v-if="group.label === 'REPORTS & SETTINGS'" v-auth='"settings-module-link-view"'>
              <SidebarMenuButton :tooltip="'Settings'" @click="router.push('/tenant/settings')" :class="[
                'relative px-0 py-2.5 hover:bg-white/5 transition-all duration-200 group',
                isSettingsActive ? 'bg-nfuko-nav-active rounded-xl' : ''
              ]">
                <div class="flex w-full items-center gap-3 pl-1 pr-3">
                  <Settings class="h-4 w-4 transition-colors duration-200"
                    :class="isSettingsActive ? 'text-nfuko-yellow' : 'text-nfuko-nav-text group-hover:text-nfuko-yellow'" />
                  <span class="flex-1 font-medium text-[13px] tracking-wide transition-colors duration-200"
                    :class="isSettingsActive ? 'text-white' : 'text-nfuko-nav-text group-hover:text-white'">
                    Settings
                  </span>
                </div>
                <div v-if="isSettingsActive"
                  class="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-nfuko-yellow rounded-r-full shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </template>
    </SidebarContent>

    <SidebarFooter class="shrink-0 p-4 space-y-3">
      <div
        class="flex items-center justify-between px-2 bg-white/5 rounded-xl p-2.5 border border-white/5 transition-all duration-300"
        :class="state === 'collapsed' ? 'flex-col gap-3 py-4' : 'px-2 py-3'">
        <div class="flex items-center gap-2.5">
          <Moon v-if="isDark" :size="16" class="text-bg-nfuko-yellow shrink-0" />
          <Sun v-else :size="16" class="text-bg-nfuko-yellow shrink-0" />
          <span v-if="state === 'expanded'" class="text-xs font-semibold text-nfuko-nav-text tracking-wide">Dark
            Mode</span>
        </div>
        <button v-if="state === 'expanded'" @click="toggleDarkMode"
          class="relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300"
          :class="isDark ? 'bg-nfuko-yellow' : 'bg-white/10'">
          <span class="inline-flex h-4 w-4 rounded-full bg-white transition-transform duration-300 shadow-xl"
            :class="isDark ? 'translate-x-5' : 'translate-x-0.5'" />
        </button>
        <button v-else @click="toggleDarkMode" class="rounded-lg p-1 hover:bg-white/10 transition-colors">
          <Moon v-if="!isDark" :size="14" class="text-nfuko-nav-text" />
          <Sun v-else :size="14" class="text-bg-nfuko-yellow" />
        </button>
      </div>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
