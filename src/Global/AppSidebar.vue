<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
    LayoutGrid,
    ChevronRight,
    Users,
    Store,
    CreditCard,
    Settings,
    Moon,
    Sun,
} from 'lucide-vue-next';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarRail,
    useSidebar,
} from '@/Global';
import { useAuthStore } from '@/stores/auth';
import { reactive } from 'vue';

const router = useRouter();
const route = useRoute();
const { state } = useSidebar();

// Helper to check active route
const isCurrentUrl = (path: string) => {
    return route.path === path;
};

// Dark mode toggle
const isDark = ref(document.documentElement.classList.contains('dark'));
function toggleDarkMode() {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle('dark', isDark.value);
}

// Navigation items
const centralItems = [
    { title: 'Platform Dashboard', href: '/central/dashboard', icon: LayoutGrid },
    { title: 'Tenants', href: '/central/tenants', icon: Store },
    { title: 'Licenses', href: '/central/licenses', icon: CreditCard },
    { title: 'Platform Users', href: '/central/platform-users', icon: Users },
];

const configItems = [
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        children: [
            { title: 'General', href: '/central/settings' },
            { title: 'Notifications', href: '/settings/notifications' },
            { title: 'Billing', href: '/settings/billing' },
        ],
    },
];

const navigate = (href: string) => {
    router.push(href);
};
const openMenus = reactive<Record<string, boolean>>({});
</script>

<template>
    <Sidebar collapsible="icon" variant="inset" class="bg-[#001d22] text-white border-r-0">
        <SidebarHeader class="p-6">
            <div class="flex items-center gap-3">
                <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-white">
                    <div class="size-5 rounded-[4px] bg-[#001d22]"></div>
                </div>
                <div v-if="state === 'expanded'" class="flex flex-col">
                    <span class="text-base font-bold tracking-tight text-white">Mfuko Pro</span>
                </div>
            </div>
        </SidebarHeader>

        <SidebarContent class="px-3">
            <!-- CENTRAL ADMIN section -->
            <SidebarGroup class="mt-4">
                <SidebarGroupLabel class="px-3 text-[10px] font-bold uppercase tracking-widest text-[#9BB5A5]/40 mb-2">
                    Central Admin
                </SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem v-for="item in centralItems" :key="item.title">
                        <SidebarMenuButton @click="navigate(item.href)" :tooltip="item.title"
                            class="px-3 py-5 rounded-xl transition-all duration-200"
                            :class="isCurrentUrl(item.href) ? 'bg-white/10 text-white' : 'text-[#9BB5A5]/60 hover:bg-white/5 hover:text-white'">
                            <component :is="item.icon" class="size-5" />
                            <span class="text-sm font-medium">{{ item.title }}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            <!-- CONFIGURATION section -->
            <SidebarMenuItem v-for="item in configItems" :key="item.title" style="list-style: none;">
                <SidebarMenuButton
                    @click="item.children ? (openMenus[item.title] = !openMenus[item.title]) : navigate(item.href)"
                    :tooltip="item.title" class="px-3 py-5 rounded-xl transition-all duration-200 flex items-center"
                    :class="isCurrentUrl(item.href) ? ' ' : 'text-[#9BB5A5]/60 hover:bg-white/5 hover:text-white'">
                    <component :is="item.icon" class="size-5" />
                    <span class="flex-1 text-sm font-medium">{{ item.title }}</span>
                    <ChevronRight v-if="item.children && state === 'expanded'" class="size-4 opacity-40 ml-auto"
                        :class="openMenus[item.title] ? 'rotate-90' : ''" />
                </SidebarMenuButton>

                <!-- Nested children -->
                <SidebarMenu v-if="item.children && openMenus[item.title]" class="ml-6 mt-2">
                    <SidebarMenuItem v-for="child in item.children" :key="child.title">
                        <SidebarMenuButton @click="navigate(child.href)"
                            class="px-3 py-3 rounded-xl transition-all duration-200 text-[#9BB5A5]/60 hover:bg-white/5 hover:text-white"
                            :class="isCurrentUrl(child.href) ? 'bg-white/10 text-white' : ''">
                            <span class="text-sm">{{ child.title }}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarMenuItem>
        </SidebarContent>

        <SidebarFooter class="p-4 mt-auto">
            <div v-if="state === 'expanded'" class="mb-4 flex items-center justify-between px-3 py-2">
                <span class="text-sm font-medium text-[#9BB5A5]/60">Dark Mode</span>
                <button @click="toggleDarkMode"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                    :class="isDark ? 'bg-white/20' : 'bg-white/5'">
                    <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 shadow-sm"
                        :class="isDark ? 'translate-x-6' : 'translate-x-1'" />
                </button>
            </div>
        </SidebarFooter>
        <SidebarRail />
    </Sidebar>
</template>

<style scoped>
:deep(.bg-sidebar) {
    background-color: #001d22;
}
</style>
