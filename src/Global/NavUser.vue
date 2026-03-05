<script setup lang="ts">
import { ChevronsUpDown } from 'lucide-vue-next';
import { computed } from 'vue';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/Global/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/Global/ui/sidebar';
import UserInfo from '@/Global/UserInfo.vue';
import UserMenuContent from './UserMenuContent.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const { isMobile, state } = useSidebar();
</script>

<template>
    <SidebarMenu>
        <SidebarMenuItem>
            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <SidebarMenuButton size="lg"
                        class="data-[state=open]:bg-white/10 data-[state=open]:text-white hover:bg-white/5 transition-all duration-200"
                        data-test="sidebar-menu-button">
                        <UserInfo v-if="user" :user="user" />
                        <ChevronsUpDown class="ml-auto size-4 text-white/40" />
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-[#031512] text-white border-white/10" :side="isMobile
                        ? 'bottom'
                        : state === 'collapsed'
                            ? 'left'
                            : 'bottom'
                    " align="end" :side-offset="4">
                    <UserMenuContent v-if="user" :user="user" />
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    </SidebarMenu>
</template>
