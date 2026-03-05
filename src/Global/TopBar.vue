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
    <header class="flex h-16 shrink-0 items-center gap-2 px-6 border-b border-neutral-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 justify-between">
        <div class="flex items-center gap-4">
            <LayoutGrid class="size-5 text-neutral-400" />
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage class="text-neutral-900 font-semibold">{{ title }}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </div>

        <div class="flex items-center gap-4 flex-1 max-w-md mx-8">
            <div class="relative w-full">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <Input
                    placeholder="Search anything"
                    class="pl-10 h-10 bg-neutral-100 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-[#031512]/10"
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 uppercase text-[10px] font-bold text-neutral-400">
                    <span>⌘</span>
                    <span>K</span>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-3">
            <div class="flex -space-x-2 mr-2">
                <Avatar class="size-8 border-2 border-white">
                    <AvatarImage src="https://github.com/nutlope.png" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Avatar class="size-8 border-2 border-white">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>AS</AvatarFallback>
                </Avatar>
                <Avatar class="size-8 border-2 border-white">
                    <AvatarImage src="https://github.com/weijunext.png" />
                    <AvatarFallback>WK</AvatarFallback>
                </Avatar>
                <div class="size-8 rounded-full bg-neutral-100 text-[10px] font-bold flex items-center justify-center text-neutral-500 border-2 border-white">
                    +2
                </div>
            </div>

            <Button variant="ghost" size="icon" class="rounded-full bg-neutral-100/50 hover:bg-neutral-100">
                <Plus class="size-5 text-neutral-600" />
            </Button>

            <div class="h-8 w-px bg-neutral-200 mx-1"></div>

            <Button variant="ghost" size="icon" class="relative rounded-full hover:bg-neutral-100">
                <Bell class="size-5 text-neutral-600" />
                <span class="absolute top-2 right-2 size-4 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-[8px] font-bold">
                    24
                </span>
            </Button>

            <div class="size-10 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-sm text-neutral-600 border border-neutral-200 cursor-pointer hover:bg-neutral-200 transition-colors">
                NK
            </div>
        </div>
    </header>
</template>
