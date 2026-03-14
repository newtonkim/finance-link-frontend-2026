<script setup lang="ts">
import { Search, Bell, Plus, LayoutGrid } from 'lucide-vue-next';
import { Button, DropdownMenuTrigger, Input, Avatar, AvatarFallback, AvatarImage, DropdownMenu, DropdownMenuContent } from '@/Global';
import UserMenuContent from '@/Global/UserMenuContent.vue';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/Global/ui/breadcrumb';
import { useAuthStore } from '@/stores/auth';
import { computed } from 'vue';
import { getInitials } from './Helpers';

defineProps<{
    title: string;
}>();
const authStore = useAuthStore();
const user = computed(() => authStore.user);
const userName = computed(() => String(user.value?.name ?? 'User'));

</script>

<template>
    <header
        class="flex h-16 shrink-0 items-center gap-2 px-6 border-b border-neutral-100 dark:border-white/10 bg-white/50 dark:bg-[#111111]/80 backdrop-blur-sm sticky top-0 z-10 justify-between">
        <div class="flex items-center gap-3">
            <div class="size-8 rounded-lg bg-neutral-100 dark:bg-white/10 flex items-center justify-center">
                <LayoutGrid class="size-4 text-neutral-600 dark:text-neutral-300" />
            </div>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage class="text-neutral-900 dark:text-white font-bold text-sm">{{ title }}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </div>



        <div class="flex items-center gap-4 flex-1 max-w-sm mx-12">
            <div class="relative w-full">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500" />
                <Input placeholder="Search anything"
                    class="pl-10 h-10 bg-[#F1F5F9] dark:bg-white/10 border-none rounded-[14px] focus-visible:ring-1 focus-visible:ring-[ bg-nfuko-primary]/5 dark:focus-visible:ring-white/10 text-sm dark:text-white dark:placeholder-neutral-500" />
                <div
                    class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-[2px] text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
                    <span
                        class="bg-white/50 dark:bg-white/10 px-1 rounded border border-neutral-200/50 dark:border-white/10">⌘</span>
                    <span
                        class="bg-white/50 dark:bg-white/10 px-1 rounded border border-neutral-200/50 dark:border-white/10">K</span>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <div class="flex -space-x-3 mr-2">
                <Avatar
                    class="size-8 border-[2.5px] border-white dark:border-[#111111] grayscale hover:grayscale-0 transition-all cursor-pointer">
                    <AvatarImage src="https://i.pravatar.cc/150?u=1" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Avatar
                    class="size-8 border-[2.5px] border-white dark:border-[#111111] grayscale hover:grayscale-0 transition-all cursor-pointer">
                    <AvatarImage src="https://i.pravatar.cc/150?u=2" />
                    <AvatarFallback>AS</AvatarFallback>
                </Avatar>
                <Avatar
                    class="size-8 border-[2.5px] border-white dark:border-[#111111] grayscale hover:grayscale-0 transition-all cursor-pointer">
                    <AvatarImage src="https://i.pravatar.cc/150?u=3" />
                    <AvatarFallback>WK</AvatarFallback>
                </Avatar>
                <div
                    class="size-8 rounded-full bg-neutral-100 dark:bg-white/10 text-[10px] font-bold flex items-center justify-center text-neutral-500 dark:text-neutral-400 border-[2.5px] border-white dark:border-[#111111] cursor-pointer hover:bg-neutral-200 dark:hover:bg-white/20">
                    +2
                </div>
            </div>

            <Button variant="ghost" size="icon"
                class="rounded-lg bg-neutral-50 dark:bg-white/10 hover:bg-neutral-100 dark:hover:bg-white/20 size-9 border border-neutral-100 dark:border-white/10 shadow-sm">
                <Plus class="size-4 text-neutral-600 dark:text-neutral-300" />
            </Button>

            <div class="h-6 w-px bg-neutral-200 dark:bg-white/10 mx-1"></div>

            <Button variant="ghost" size="icon"
                class="relative rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 size-9">
                <Bell class="size-5 text-neutral-600 dark:text-neutral-300" />
                <span
                    class="absolute -top-1 -right-1 size-5 bg-[#F1F5F9] dark:bg-white/10 border-2 border-white dark:border-[#111111] rounded-full flex items-center justify-center text-[9px] font-extrabold text-neutral-900 dark:text-white shadow-sm">
                    24
                </span>
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger>
                    <div
                        class="size-8 rounded-full bg-[#F1F5F9] dark:bg-white/10 flex items-center justify-center font-bold text-xs text-neutral-600 dark:text-neutral-300 border border-neutral-200/50 dark:border-white/10 cursor-pointer hover:bg-neutral-200 dark:hover:bg-white/20 transition-all shadow-sm">
                        {{ getInitials(userName) }}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-56">
                    <UserMenuContent :user="user" />
                </DropdownMenuContent>
            </DropdownMenu>

        </div>
    </header>
</template>
