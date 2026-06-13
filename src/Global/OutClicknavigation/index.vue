<template>
    <div v-bind="$attrs" class="flex flex-col h-full py-1">
        <div class="flex flex-col gap-0.5 flex-1">
            <template v-for="item in mainLinks" :key="item.path ?? item.label">

                <!-- Section label -->
                <SidebarGroupLabel
                    v-if="item.type === 'label' && item?.showSideBar === true"
                    class="flex h-5 shrink-0 items-center mt-5 mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 group-data-[collapsible=icon]:hidden">
                    {{ item.label }}
                </SidebarGroupLabel>

                <!-- Regular nav link (no children) -->
                <span v-else-if="!item?.children && item?.showSideBar === true">
                    <RouteLink :item="item" :prifix="prefix" :badge="getBadge(item)" @click="() => toggleSubmenu(null)" />
                </span>

                <!-- Expandable nav item (has children / submenu) -->
                <div v-else-if="item?.showSideBar === true" class="relative">
                    <div v-auth="item?.permissions" @click="toggleSubmenu(item.label ?? null)"
                        class="flex items-center gap-3 w-full px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 text-white/55 hover:text-white hover:bg-white/8 group">
                        <component :is="item.icon" :size="18" class="shrink-0" />
                        <span v-if="state === 'expanded'" class="flex-1 text-[13px] font-medium capitalize">{{ item.label }}</span>
                        <span v-if="state === 'expanded'" class="text-white/30 text-xs">
                            {{ Store.showSubmenu === item?.label ? '▾' : '›' }}
                        </span>
                    </div>

                    <!-- Submenu flyout -->
                    <div v-if="Store.showSubmenu === item?.label && item?.children"
                        class="absolute left-full top-0 ml-3 z-9999 border border-neutral-100 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
                        <template v-for="(child, index) in item.children" :key="index">
                            <div v-auth="child?.permissions" class="w-72 flex flex-col py-3">
                                <div :class="child.titleStyle === 'green'
                                    ? 'px-4 py-1.5 mx-3 mb-2 rounded-lg bg-[#052659] text-white font-bold text-[11px] uppercase tracking-wider'
                                    : 'px-4 py-1.5 mx-3 mb-2 rounded-lg bg-[#001020]/10 dark:bg-nfuko-yellow/10 text-[#001020] dark:text-nfuko-yellow font-bold text-[11px] uppercase tracking-wider'">
                                    {{ child.title }}
                                </div>
                                <div class="px-2">
                                    <RouteLink :prifix="item.prifix" :item="child.items" :title="child.title"
                                        @click="toggleSubmenu(null)" />
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted } from 'vue';

defineOptions({ inheritAttrs: false })
import RouteLink from "./RouteLink.vue";
import { SidebarGroupLabel, useSidebar } from '@/Global';
import { pomPinia } from 'septor-store';
import type { MenuRoutes } from '@/Global/types/helpers';

const props = defineProps<{
    links: MenuRoutes[]
    prefix?: string
}>();

const Store = pomPinia() as any;
const { state } = useSidebar()

const mainLinks = computed(() => props.links)

function getBadge(item: any): number | null {
    if (!item?.badgeKey) return null
    const keys = (item.badgeKey as string).split('.')
    let val: any = Store
    for (const key of keys) {
        val = val?.[key]
        if (val === undefined || val === null) return null
    }
    return typeof val === 'number' && val > 0 ? val : null
}

const toggleSubmenu = (label: string | undefined | null) => {
    if (Store.showSubmenu === label) {
        Store.showSubmenu = null
    } else {
        Store.showSubmenu = label
    }
}

onUnmounted(() => {
    window.removeEventListener('click', () => toggleSubmenu(null));
});
</script>

<style scoped>
.hover\:bg-white\/8:hover {
    background-color: rgba(255, 255, 255, 0.08);
}
</style>
