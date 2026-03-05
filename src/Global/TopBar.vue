<script setup lang="ts">
import { Search, Bell, Plus, LayoutGrid } from 'lucide-vue-next';
import { Input } from '@/Global/ui/input';
import { Button } from '@/Global/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/Global/ui/avatar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/Global/ui/breadcrumb';

defineProps<{
    title: string;
}>();
</script>

<template>
    <header
        class="flex h-16 shrink-0 items-center gap-2 px-6 border-b border-neutral-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 justify-between">
        <div class="flex items-center gap-3">
            <div class="size-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                <LayoutGrid class="size-4 text-neutral-600" />
            </div>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage class="text-neutral-900 font-bold text-sm">{{ title }}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </div>

        <div class="flex items-center gap-4 flex-1 max-w-sm mx-12">
            <div class="relative w-full">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <Input placeholder="Search anything"
                    class="pl-10 h-10 bg-[#F1F5F9] border-none rounded-[14px] focus-visible:ring-1 focus-visible:ring-[#001d22]/5 text-sm" />
                <div
                    class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-[2px] text-[10px] font-bold text-neutral-400">
                    <span class="bg-white/50 px-1 rounded border border-neutral-200/50">⌘</span>
                    <span class="bg-white/50 px-1 rounded border border-neutral-200/50">K</span>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <div class="flex -space-x-3 mr-2">
                <Avatar
                    class="size-8 border-[2.5px] border-white grayscale hover:grayscale-0 transition-all cursor-pointer">
                    <AvatarImage src="https://i.pravatar.cc/150?u=1" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Avatar
                    class="size-8 border-[2.5px] border-white grayscale hover:grayscale-0 transition-all cursor-pointer">
                    <AvatarImage src="https://i.pravatar.cc/150?u=2" />
                    <AvatarFallback>AS</AvatarFallback>
                </Avatar>
                <Avatar
                    class="size-8 border-[2.5px] border-white grayscale hover:grayscale-0 transition-all cursor-pointer">
                    <AvatarImage src="https://i.pravatar.cc/150?u=3" />
                    <AvatarFallback>WK</AvatarFallback>
                </Avatar>
                <div
                    class="size-8 rounded-full bg-neutral-100 text-[10px] font-bold flex items-center justify-center text-neutral-500 border-[2.5px] border-white cursor-pointer hover:bg-neutral-200">
                    +2
                </div>
            </div>

            <Button variant="ghost" size="icon"
                class="rounded-lg bg-neutral-50 hover:bg-neutral-100 size-9 border border-neutral-100 shadow-sm">
                <Plus class="size-4 text-neutral-600" />
            </Button>

            <div class="h-6 w-px bg-neutral-200 mx-1"></div>

            <Button variant="ghost" size="icon" class="relative rounded-lg hover:bg-neutral-100 size-9">
                <Bell class="size-5 text-neutral-600" />
                <span
                    class="absolute -top-1 -right-1 size-5 bg-[#F1F5F9] border-2 border-white rounded-full flex items-center justify-center text-[9px] font-extrabold text-neutral-900 shadow-sm">
                    24
                </span>
            </Button>

            <div
                class="size-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center font-bold text-xs text-neutral-600 border border-neutral-200/50 cursor-pointer hover:bg-neutral-200 transition-all shadow-sm">
                NK
            </div>
        </div>
    </header>
</template>
