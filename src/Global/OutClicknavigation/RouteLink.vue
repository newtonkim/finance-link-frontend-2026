<template>
    <!-- Array of sub-items (submenu children) -->
    <template v-if="Array.isArray(item)">
        <template v-for="subItem in item" :key="subItem.path">
            <div v-if="subItem?.path" v-auth="subItem.permissions">
                <RouterLink
                    v-if="subItem?.showSideBar !== false"
                    :to="getRoutePath(subItem)"
                    custom
                    v-slot="{ isActive, navigate }"
                    v-auth="subItem?.permissions">
                    <div @click="navigate" :class="[
                        'group flex items-center gap-2.5 capitalize px-2 py-2 text-[13px] font-medium rounded-xl cursor-pointer transition-all duration-150',
                        isActive
                            ? 'bg-[rgba(0,80,216,0.07)] text-nfuko-primary font-semibold'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-nfuko-primary hover:bg-[#f0f4ff] dark:hover:bg-neutral-800/50'
                    ]">
                        <!-- Icon container -->
                        <div :class="[
                            'flex w-8 h-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150',
                            isActive
                                ? 'bg-[rgba(0,80,216,0.12)]'
                                : 'bg-neutral-100 dark:bg-neutral-800 group-hover:bg-[rgba(0,80,216,0.08)]'
                        ]">
                            <component
                                v-if="subItem?.icon"
                                :is="subItem.icon"
                                :size="14"
                                :class="isActive ? 'text-nfuko-primary' : 'text-neutral-400 group-hover:text-nfuko-primary'" />
                            <!-- Fallback: initial letter when no icon is set -->
                            <span v-else
                                class="text-[11px] font-black transition-colors duration-150"
                                :class="isActive ? 'text-nfuko-primary' : 'text-neutral-400 group-hover:text-nfuko-primary'">
                                {{ (subItem.label ?? '?')[0].toUpperCase() }}
                            </span>
                        </div>
                        <span class="flex-1 capitalize">{{ subItem.label }}</span>
                        <!-- Active dot indicator -->
                        <span v-if="isActive" class="size-[6px] rounded-full bg-nfuko-primary shrink-0 mr-1"></span>
                    </div>
                </RouterLink>
            </div>
        </template>
    </template>

    <!-- Single nav item -->
    <RouterLink
        v-else-if="item?.path"
        :to="'/' + (props.prifix ?? 'tenant') + '/' + item?.path"
        custom
        v-slot="{ isActive, navigate }"
        v-auth="item?.permissions">
        <div @click="navigate" :class="[
            'flex items-center gap-3 w-full px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 text-[13px] font-medium',
            isActive
                ? 'bg-nfuko-nav-active text-white'
                : 'text-white/55 hover:text-white hover:bg-white/8'
        ]">
            <component v-if="item?.icon" :is="item.icon" :size="18" class="shrink-0" />
            <span v-if="state === 'expanded'" class="flex-1 capitalize truncate">{{ item?.label }}</span>
            <!-- badge -->
            <span v-if="state === 'expanded' && badge"
                class="ml-auto shrink-0 min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center leading-none"
                :class="isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'">
                {{ badge }}
            </span>
        </div>
    </RouterLink>
</template>

<script setup lang="ts">
import { useSidebar } from '@/Global/ui/sidebar/utils';

const { state } = useSidebar();

const props = defineProps<{
    item: any
    prifix?: string
    title?: string
    badge?: number | null
}>()

function getRoutePath(route: any) {
    return `/${props.prifix}/${route.path}`
}
</script>

<style scoped>
.hover\:bg-white\/8:hover {
    background-color: rgba(255, 255, 255, 0.08);
}
</style>
