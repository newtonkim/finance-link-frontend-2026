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
  ChevronDown,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  useSidebar,
} from '@/Global/ui/sidebar'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/Global/ui/collapsible'
import NavUser from '@/Global/NavUser.vue'
import { useTenantContextStore } from '@/stores/tenantContext'
import { membersApi } from '@/tenant/apis/members/membersApi'

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
  { title: 'Loans', href: '/tenant/loans', icon: HandCoins },
  { title: 'Transactions', href: '/tenant/transactions', icon: ArrowUpDown },
  { title: 'Chart of Accounts', href: '/tenant/chart-of-accounts', icon: BookOpen },
]

const settingsSubItems = [
  { title: 'General Settings', href: '/tenant/settings/general' },
  { title: 'Notifications', href: '/tenant/settings/notifications' },
  { title: 'System Settings', href: '/tenant/settings/system' },
  { title: 'Savings Products', href: '/tenant/settings/savings-products' },
  { title: 'Transaction Charges', href: '/tenant/settings/transaction-charges' },
]

const tenant = tenantStore.currentTenant as any

const memberCount = ref<number | null>(null)

onMounted(async () => {
  try {
    const res = await membersApi.list({ page: 1 })
    memberCount.value = res.data?.meta?.total ?? res.data?.total ?? null
  } catch {
    // silently ignore — badge just won't show
  }
})
</script>

<template>
  <Sidebar collapsible="icon" variant="inset" class="bg-[#0A2318] text-white border-r-0">
    <!-- Header: SACCO brand -->
    <SidebarHeader class="p-4">
      <div class="flex items-center gap-3">
        <div
          class="flex shrink-0 items-center justify-center rounded-2xl bg-[#C9A84C] text-[#0A2318] shadow-xl transition-all duration-500"
          :class="state === 'expanded' ? 'h-14 w-14' : 'h-8 w-8'">
          <LayoutGrid :class="state === 'expanded' ? 'h-7 w-7' : 'h-5 w-5'" />
        </div>

        <div v-if="state === 'expanded'" class="flex flex-col min-w-0">
          <span class="text-lg font-bold leading-tight tracking-tight text-white italic">
            {{ tenant?.name ?? 'SACCO Portal' }}
          </span>
          <span v-if="tenant?.settings?.slogan"
            class="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#9BB5A5]/80">
            {{ tenant.settings.slogan }}
          </span>
        </div>
      </div>

      <!-- Contact info when expanded -->
      <div v-if="state === 'expanded' && (tenant?.settings?.address || tenant?.settings?.email)"
        class="mt-4 flex flex-col gap-2 border-t border-white/5 pt-4">
        <div v-if="tenant?.settings?.address" class="flex items-start gap-2 text-[#9BB5A5]">
          <MapPin class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9A84C]" />
          <span class="text-[10px] font-medium leading-normal">{{ tenant.settings.address }}</span>
        </div>
        <div v-if="tenant?.settings?.email" class="flex items-center gap-2 text-[#9BB5A5]">
          <Mail class="h-3.5 w-3.5 shrink-0 text-[#C9A84C]" />
          <span class="text-[10px] font-medium truncate">{{ tenant.settings.email }}</span>
        </div>
      </div>
    </SidebarHeader>

    <SidebarContent class="px-2 overflow-y-auto">
      <!-- NAVIGATION -->
      <SidebarGroup>
        <SidebarGroupLabel class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9BB5A5]/50">
          Navigation
        </SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in navItems" :key="item.title">
            <SidebarMenuButton :tooltip="item.title" @click="router.push(item.href)"
              class="relative px-0 py-2.5 hover:bg-white/5 transition-all duration-200 group">
              <div class="flex w-full items-center gap-3 pl-4 pr-3">
                <component :is="item.icon" class="h-4 w-4 transition-colors duration-200"
                  :class="isActive(item.href) ? 'text-[#C9A84C]' : 'text-[#9BB5A5] group-hover:text-[#C9A84C]'" />
                <span class="flex-1 font-medium text-[13px] tracking-wide transition-colors duration-200"
                  :class="isActive(item.href) ? 'text-[#C9A84C]' : 'text-[#9BB5A5] group-hover:text-white'">
                  {{ item.title }}
                </span>
                <span v-if="item.href === '/tenant/members' && memberCount !== null"
                  class="min-w-[20px] rounded-full bg-[#C9A84C] px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-[#0A2318]">
                  {{ memberCount }}
                </span>
              </div>
              <!-- Active left indicator -->
              <div v-if="isActive(item.href)"
                class="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-[#C9A84C] rounded-r-full shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <!-- CONFIGURATION -->
      <SidebarGroup class="mt-2">
        <SidebarGroupLabel class="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9BB5A5]/50">
          Configuration
        </SidebarGroupLabel>
        <SidebarMenu>
          <Collapsible :default-open="isSettingsActive" class="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger as-child>
                <SidebarMenuButton :tooltip="'Settings'"
                  class="px-0 py-2.5 hover:bg-white/5 transition-all duration-200 group">
                  <div class="flex w-full items-center gap-3 pl-4 pr-3">
                    <Settings class="h-4 w-4 transition-colors duration-200"
                      :class="isSettingsActive ? 'text-[#C9A84C]' : 'text-[#9BB5A5] group-hover:text-[#C9A84C]'" />
                    <span class="flex-1 font-medium text-[13px] tracking-wide transition-colors duration-200"
                      :class="isSettingsActive ? 'text-[#C9A84C]' : 'text-[#9BB5A5] group-hover:text-white'">
                      Settings
                    </span>
                    <ChevronDown
                      class="h-4 w-4 text-[#9BB5A5]/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub class="border-[#9BB5A5]/10">
                  <SidebarMenuSubItem v-for="sub in settingsSubItems" :key="sub.title">
                    <SidebarMenuSubButton as="button" @click="router.push(sub.href)" :is-active="isActive(sub.href)"
                      class="text-[#9BB5A5]/70 hover:text-white transition-colors duration-200 cursor-pointer"
                      :class="isActive(sub.href) ? '!text-[#C9A84C] font-semibold' : ''">
                      <span>{{ sub.title }}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="p-4 space-y-3">
      <!-- Dark mode toggle -->
      <div class="flex items-center justify-between px-2 bg-white/5 rounded-xl p-3 border border-white/5">
        <div class="flex items-center gap-2.5">
          <Moon v-if="isDark" :size="16" class="text-[#C9A84C]" />
          <Sun v-else :size="16" class="text-[#C9A84C]" />
          <span class="text-xs font-semibold text-[#9BB5A5] tracking-wide">Dark Mode</span>
        </div>
        <button @click="toggleDarkMode"
          class="relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300"
          :class="isDark ? 'bg-[#C9A84C]' : 'bg-white/10'">
          <span class="inline-flex h-4 w-4 rounded-full bg-white transition-transform duration-300 shadow-xl"
            :class="isDark ? 'translate-x-5' : 'translate-x-0.5'" />
        </button>
      </div>
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
