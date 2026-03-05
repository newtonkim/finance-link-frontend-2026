<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getInitials } from '@/composables/useInitials';
import type { BreadcrumbItem } from '@/types';

withDefaults(
    defineProps<{
        breadcrumbs?: BreadcrumbItem[];
    }>(),
    {
        breadcrumbs: () => [],
    },
);

const authStore = useAuthStore();
const user = computed(() => authStore.user);

// Mock team members for the header avatars
const teamMembers = [
    { name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice' },
    { name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob' },
    { name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie' },
];
</script>

<template>
    <header
        class="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/70 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
        <!-- Left: Trigger + Breadcrumbs -->
        <div class="flex items-center gap-2">
            <SidebarTrigger class="-ml-1" />
            <template v-if="breadcrumbs && breadcrumbs.length > 0">
                <Breadcrumbs :breadcrumbs="breadcrumbs" />
            </template>
        </div>

        <!-- Right: Header Actions -->
        <div class="flex items-center gap-4">
            <!-- Team Avatars Stack -->
            <div class="hidden items-center md:flex">
                <div class="flex -space-x-2 mr-2">
                    <Avatar v-for="member in teamMembers" :key="member.name"
                        class="h-8 w-8 border-2 border-white dark:border-neutral-900">
                        <AvatarImage :src="member.avatar" :alt="member.name" />
                        <AvatarFallback>{{ getInitials(member.name) }}</AvatarFallback>
                    </Avatar>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs font-medium text-[#001d22]/50">+2</span>
                    <Button variant="ghost" size="icon"
                        class="h-8 w-8 rounded-full border border-[#d1dfdb] bg-white text-[#001d22]">
                        <Plus class="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div class="h-6 w-px bg-[#d1dfdb] hidden md:block"></div>

            <!-- Notification Bell -->
            <button class="relative rounded-full p-2 text-[#001d22] hover:bg-[#e2edea]">
                <Bell class="h-5 w-5" />
                <span
                    class="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#001d22] text-[10px] font-bold text-white border-2 border-white">
                    24
                </span>
            </button>

            <!-- Search Bar -->
            <div class="relative hidden lg:block">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search class="h-4 w-4 text-[#001d22]/40" />
                </div>
                <input type="text" placeholder="Search anything"
                    class="h-10 w-64 rounded-xl border border-[#d1dfdb] bg-white pl-10 pr-12 text-sm focus:border-[#001d22] focus:outline-none" />
                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                    <kbd
                        class="pointer-events-none rounded border border-[#d1dfdb] bg-[#f0f7f5] px-1.5 py-0.5 text-[10px] font-medium text-[#001d22]/40">
                        ⌘ K
                    </kbd>
                </div>
            </div>

            <!-- User Dropdown -->
            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <button class="flex items-center gap-2 rounded-xl p-1 hover:bg-[#e2edea]">
                        <Avatar class="h-8 w-8 rounded-lg overflow-hidden">
                            <AvatarImage v-if="user?.avatar" :src="user.avatar" :alt="user.name" />
                            <AvatarFallback class="rounded-lg">{{ getInitials(user?.name) }}</AvatarFallback>
                        </Avatar>
                        <ChevronDown class="h-4 w-4 text-[#001d22]/40" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-56 mt-1">
                    <UserMenuContent v-if="user" :user="user" />
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </header>
</template>
