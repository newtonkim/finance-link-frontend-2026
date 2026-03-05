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
} from '@/Global/ui/sidebar';
import NavUser from '@/Global/NavUser.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const { state } = useSidebar();
const authStore = useAuthStore();

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
const mainItems = [
    { title: 'Dashboard', href: '/', icon: LayoutGrid },
];

const centralItems = [
    { title: 'Platform Dashboard', href: '/central/dashboard', icon: LayoutGrid },
    { title: 'Tenants', href: '/central/tenants', icon: Store },
    { title: 'Licenses', href: '/central/licenses', icon: CreditCard },
    { title: 'Platform Users', href: '/platform-users', icon: Users },
];

const configItems = [
    { title: 'Settings', href: '/settings', icon: Settings },
];

const navigate = (href: string) => {
    router.push(href);
};
</script>

<template>
    <Sidebar collapsible="icon" variant="inset" class="bg-[#031512] text-white border-r-0">
        <SidebarHeader class="p-6">
            <div class="flex items-center gap-3">
                <div class="flex aspect-square size-10 items-center justify-center rounded-xl bg-white">
                    <div class="size-6 rounded-md bg-[#031512]"></div>
                </div>
                <div v-if="state === 'expanded'" class="flex flex-col">
                    <span class="text-lg font-bold tracking-tight">Mfuko Pro</span>
                </div>
            </div>
        </SidebarHeader>

        <SidebarContent class="px-3">
            <!-- MAIN section -->
            <SidebarGroup>
                <SidebarGroupLabel class="px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2">
                    Main
                </SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem v-for="item in mainItems" :key="item.title">
                        <SidebarMenuButton
                            @click="navigate(item.href)"
                            :tooltip="item.title"
                            class="px-3 py-6 rounded-xl transition-all duration-200"
                            :class="isCurrentUrl(item.href) ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'"
                        >
                            <component :is="item.icon" class="size-5" />
                            <span class="text-sm font-medium">{{ item.title }}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            <!-- CENTRAL ADMIN section -->
            <SidebarGroup class="mt-4">
                <SidebarGroupLabel class="px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2">
                    Central Admin
                </SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem v-for="item in centralItems" :key="item.title">
                        <SidebarMenuButton
                            @click="navigate(item.href)"
                            :tooltip="item.title"
                            class="px-3 py-5 rounded-xl transition-all duration-200"
                            :class="isCurrentUrl(item.href) ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'"
                        >
                            <component :is="item.icon" class="size-5" />
                            <span class="text-sm font-medium">{{ item.title }}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            <!-- CONFIGURATION section -->
            <SidebarGroup class="mt-4">
                <SidebarGroupLabel class="px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2">
                    Configuration
                </SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem v-for="item in configItems" :key="item.title">
                        <SidebarMenuButton
                            @click="navigate(item.href)"
                            :tooltip="item.title"
                            class="px-3 py-5 rounded-xl transition-all duration-200 flex items-center"
                            :class="isCurrentUrl(item.href) ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'"
                        >
                            <component :is="item.icon" class="size-5" />
                            <span class="flex-1 text-sm font-medium">{{ item.title }}</span>
                            <ChevronRight v-if="state === 'expanded'" class="size-4 opacity-40" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>

        <SidebarFooter class="p-4 mt-auto">
            <!-- Dark Mode Toggle -->
            <div v-if="state === 'expanded'" class="mb-4 flex items-center justify-between px-3 py-2">
                <span class="text-sm font-medium text-white/60">Dark Mode</span>
                <button
                    @click="toggleDarkMode"
                    class="relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200"
                    :class="isDark ? 'bg-white/20' : 'bg-white/10'"
                >
                    <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                        :class="isDark ? 'translate-x-7' : 'translate-x-1'"
                    />
                </button>
            </div>

            <NavUser />
        </SidebarFooter>
        <SidebarRail />
    </Sidebar>
</template>

<style scoped>
:deep(.bg-sidebar) {
    background-color: #031512;
}
</style>
