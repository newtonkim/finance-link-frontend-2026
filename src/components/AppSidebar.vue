<script setup lang="ts">
import { Link, usePage } from '@inertiajs/vue3';

import {
    LayoutGrid,
    ChevronDown,
    ChevronRight,
    Users,
    Store,
    CreditCard,
    Settings,
    Moon,
    Sun,
    Wallet,
    HandCoins,
    ArrowUpDown,
    MapPin,
    Mail,
    BookOpen,
} from 'lucide-vue-next';
import type { LucideProps } from 'lucide-vue-next';
import { ref, computed } from 'vue';
import type { FunctionalComponent } from 'vue';
import NavUser from '@/components/NavUser.vue';
import {
} from '@/components/ui/dropdown-menu';
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
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarRail,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/composables/useCurrentUrl';
import { dashboard } from '@/routes';
import AppLogo from './AppLogo.vue';

interface NavItem {
    title: string;
    href?: string | any;
    icon: FunctionalComponent<LucideProps>;
    children?: { title: string; href: string; }[];
}

const page = usePage();
const { isCurrentUrl } = useCurrentUrl();
const { state } = useSidebar();

// Collapsible state
const expandedMenus = ref<Record<string, boolean>>({
    Products: false,
    Orders: true,
    Settings: false,
});

function toggleMenu(name: string) {
    expandedMenus.value[name] = !expandedMenus.value[name];
}

// Dark mode toggle
const isDark = ref(document.documentElement.classList.contains('dark'));
function toggleDarkMode() {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle('dark', isDark.value);
}

// Main navigation items
const mainItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
];

const settingsItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [
        {
            title: 'Settings',
            icon: Settings,
            children: [
                { title: 'General Settings', href: '#' },
                { title: 'Notifications', href: '#' },
            ],
        },
    ];

    if (!page.props.auth?.is_platform_admin) {
        items[0].children?.push({ title: 'System Settings', href: '/settings/system' });
        items[0].children?.push({ title: 'Savings Products', href: '/savings-products' });
        items[0].children?.push({ title: 'Transaction Charges', href: '/savings-products' });
    }

    return items;
});

const centralItems: NavItem[] = [
    { title: 'Platform Dashboard', href: '/api/v1/central/dashboard/summary', icon: LayoutGrid },
    { title: 'Tenants', href: '/central/tenants', icon: Store },
    { title: 'Licenses', href: '/central/licenses', icon: CreditCard },
    { title: 'Platform Users', href: '/platform-users', icon: Users },
];

const tenantItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
    { title: 'Members', href: '/members', icon: Users },
    { title: 'Members Account', href: '/savings-accounts', icon: Wallet },
    { title: 'Group Savings', href: '/savings-groups', icon: Users },
    { title: 'Loans', href: '#', icon: HandCoins },
    { title: 'Transactions', href: '#', icon: ArrowUpDown },
    { title: 'Chart of Accounts', href: '/chart-of-accounts', icon: BookOpen },
];

// const secondaryTenantItems = [];
</script>

<template>
    <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader class="p-4">
            <!-- Platform Admin Header -->
            <SidebarMenu v-if="page.props.auth?.is_platform_admin">
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" as-child>
                        <Link :href="dashboard()">
                            <AppLogo />
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>

            <!-- Tenant Header (from image) -->
            <template v-else>
                <div class="flex flex-col gap-4 px-2 py-2 overflow-hidden">
                    <div class="flex items-center gap-3">
                        <!-- Larger Logo -->
                        <div v-if="page.props.auth?.tenant?.settings?.logo_url"
                            class="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl border border-white/10 transition-all duration-500"
                            :class="state === 'expanded' ? 'h-14 w-14' : 'h-8 w-8'">
                            <img :src="page.props.auth?.tenant?.settings?.logo_url" alt="Logo"
                                class="h-full w-full object-contain p-1" />
                        </div>
                        <div v-else
                            class="flex shrink-0 items-center justify-center rounded-2xl bg-[#C9A84C] text-[#0A2318] shadow-xl transition-all duration-500"
                            :class="state === 'expanded' ? 'h-14 w-14' : 'h-8 w-8'">
                            <LayoutGrid :class="state === 'expanded' ? 'h-7 w-7' : 'h-5 w-5'" />
                        </div>

                        <!-- Name and Slogan -->
                        <div v-if="state === 'expanded'" class="flex flex-col min-w-0">
                            <span
                                class="text-lg font-bold leading-tight tracking-tight text-white font-['Playfair_Display'] italic">
                                {{ page.props.auth?.tenant?.name || 'Prodex' }}
                            </span>
                            <span v-if="page.props.auth?.tenant?.settings?.slogan"
                                class="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9BB5A5]/80">
                                {{ page.props.auth?.tenant?.settings?.slogan }}
                            </span>
                        </div>
                    </div>

                    <!-- Contact Information (Only visible when expanded) -->
                    <div v-if="state === 'expanded'" class="mt-2 flex flex-col gap-2.5 border-t border-white/5 pt-4">
                        <div v-if="page.props.auth?.tenant?.settings?.address"
                            class="flex items-start gap-2 text-[#9BB5A5]">
                            <MapPin class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9A84C]" />
                            <span class="text-[10px] font-medium leading-normal tracking-wide">{{
                                page.props.auth?.tenant?.settings?.address }}</span>
                        </div>
                        <div v-if="page.props.auth?.tenant?.settings?.email"
                            class="flex items-center gap-2 text-[#9BB5A5]">
                            <Mail class="h-3.5 w-3.5 shrink-0 text-[#C9A84C]" />
                            <span class="text-[10px] font-medium truncate tracking-wide">{{
                                page.props.auth?.tenant?.settings?.email
                                }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </SidebarHeader>

        <SidebarContent class="overflow-y-auto">
            <!-- Platform Admin Sidebar Items -->
            <SidebarGroup v-if="page.props.auth?.is_platform_admin">
                <SidebarGroupLabel class="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Main
                </SidebarGroupLabel>
                <SidebarMenu>
                    <template v-for="item in mainItems" :key="item.title">
                        <SidebarMenuItem v-if="!item.children">
                            <SidebarMenuButton as-child :is-active="item.href ? isCurrentUrl(item.href) : false"
                                :tooltip="item.title">
                                <Link :href="item.href || '#'">
                                    <component :is="item.icon" />
                                    <span>{{ item.title }}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </template>
                </SidebarMenu>
            </SidebarGroup>

            <!-- TENANT MAIN section -->
            <SidebarGroup v-if="!page.props.auth?.is_platform_admin">
                <SidebarGroupLabel
                    class="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9BB5A5] opacity-50 px-4 py-3">
                    Navigation
                </SidebarGroupLabel>
                <SidebarMenu>
                    <template v-for="item in tenantItems" :key="item.title">
                        <SidebarMenuItem>
                            <SidebarMenuButton as-child :is-active="item.href ? isCurrentUrl(item.href) : false"
                                :tooltip="item.title"
                                class="px-0 py-2.5 hover:bg-white/5 transition-all duration-200 group relative">
                                <Link :href="item.href" class="flex w-full items-center justify-between pl-4 pr-3">
                                    <div class="flex items-center gap-3">
                                        <component :is="item.icon" class="h-4.5 w-4.5 transition-colors duration-200"
                                            :class="isCurrentUrl(item.href) ? 'text-[#C9A84C]' : 'text-[#9BB5A5] group-hover:text-[#C9A84C]'" />
                                        <span
                                            class="font-medium text-[13px] tracking-wide transition-colors duration-200"
                                            :class="isCurrentUrl(item.href) ? 'text-[#C9A84C]' : 'text-[#9BB5A5] group-hover:text-white'">
                                            {{ item.title }}
                                        </span>
                                    </div>
                                    <span v-if="item.title === 'Members' && page.props.memberCount"
                                        class="flex items-center justify-center h-4.5 px-1.5 min-w-[18px] rounded-full bg-[#C9A84C] text-[9px] font-bold text-[#0A2318] shadow-lg">
                                        {{ page.props.memberCount }}
                                    </span>

                                    <!-- Active Indicator -->
                                    <div v-if="isCurrentUrl(item.href)"
                                        class="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-[#C9A84C] rounded-r-full shadow-[0_0_10px_rgba(201,168,76,0.5)]">
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </template>
                </SidebarMenu>
            </SidebarGroup>



            <!-- CENTRAL section -->
            <SidebarGroup v-if="page.props.auth?.is_platform_admin">
                <SidebarGroupLabel class="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Central Admin
                </SidebarGroupLabel>
                <SidebarMenu>
                    <template v-for="item in centralItems" :key="item.title">
                        <SidebarMenuItem>
                            <SidebarMenuButton as-child :is-active="item.href ? isCurrentUrl(item.href) : false"
                                :tooltip="item.title">
                                <Link :href="item.href">
                                    <component :is="item.icon" />
                                    <span>{{ item.title }}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </template>
                </SidebarMenu>
            </SidebarGroup>

            <!-- SETTINGS section -->
            <SidebarGroup>
                <SidebarGroupLabel
                    class="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9BB5A5] opacity-50 px-4 py-3">
                    Configuration
                </SidebarGroupLabel>
                <SidebarMenu>
                    <template v-for="item in settingsItems" :key="item.title">
                        <SidebarMenuItem v-if="!item.children">
                            <SidebarMenuButton as-child :tooltip="item.title">
                                <Link :href="item.href || '#'">
                                    <component :is="item.icon" />
                                    <span>{{ item.title }}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem v-else>
                            <SidebarMenuButton :tooltip="item.title" @click="toggleMenu(item.title)"
                                class="cursor-pointer">
                                <component :is="item.icon" />
                                <span class="flex-1">{{ item.title }}</span>
                                <component :is="expandedMenus[item.title] ? ChevronDown : ChevronRight" :size="14"
                                    class="text-neutral-400" />
                            </SidebarMenuButton>
                            <SidebarMenuSub v-show="expandedMenus[item.title]">
                                <SidebarMenuSubItem v-for="child in item.children" :key="child.title">
                                    <SidebarMenuSubButton as-child>
                                        <Link :href="child.href">
                                            <span>{{ child.title }}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        </SidebarMenuItem>
                    </template>
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>

        <SidebarFooter class="p-4 space-y-4">
            <!-- Platform Admin Simple Footer Toggle -->
            <div v-if="page.props.auth?.is_platform_admin" class="flex items-center justify-between px-3 py-2">
                <span class="text-sm"
                    :class="page.props.auth?.is_platform_admin ? 'text-white/60' : 'text-neutral-600'">Dark
                    Mode</span>
                <button @click="toggleDarkMode"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="page.props.auth?.is_platform_admin ? 'bg-white/10' : 'bg-neutral-200'">
                    <span
                        class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white transition-transform"
                        :class="isDark ? 'translate-x-6' : 'translate-x-1'">
                    </span>
                </button>
            </div>

            <!-- Tenant Footer with Upgrade Card -->
            <template v-else>
                <!-- Dark Mode Toggle -->
                <div class="flex items-center justify-between px-2 bg-white/5 rounded-xl p-3 border border-white/5">
                    <div class="flex items-center gap-2.5">
                        <Moon v-if="isDark" :size="16" class="text-[#C9A84C]" />
                        <Sun v-else :size="16" class="text-[#C9A84C]" />
                        <span class="text-xs font-semibold text-[#9BB5A5] tracking-wide">Dark Mode</span>
                    </div>
                    <button @click="toggleDarkMode"
                        class="relative inline-flex h-5.5 w-10 items-center rounded-full transition-all duration-300 ring-offset-[#0A2318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
                        :class="isDark ? 'bg-[#C9A84C]' : 'bg-white/10'">
                        <span
                            class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white transition-transform duration-300 shadow-xl"
                            :class="isDark ? 'translate-x-5.5' : 'translate-x-0.5'">
                        </span>
                    </button>
                </div>
            </template>

            <NavUser class="mt-2" />
        </SidebarFooter>
        <SidebarRail />
    </Sidebar>
</template>
