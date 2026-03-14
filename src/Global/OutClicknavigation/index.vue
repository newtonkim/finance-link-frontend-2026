<template>
    <div v-bind="$attrs" class="flex flex-col h-full py-2">

        <!-- Main nav items -->
        <div class="flex flex-col gap-1 flex-1">
            <template v-for="item in mainLinks" :key="item.path ?? item.label">
                <SidebarGroupLabel v-if="item.type == 'label' && item?.showSideBar === true"
                    class="px-3 text-[10px] font-bold uppercase tracking-widest text-nfuko-nav-text/40 mb-1">
                    {{ item.label }}
                </SidebarGroupLabel>

                <RouteLink v-else-if="!item?.children && item?.showSideBar === true" :item="item"
                    @click="() => toggleSubmenu(null)" />
            </template>
        </div>

        <!-- Footer: Settings and items with children, pinned to bottom -->
        <div class="flex flex-col gap-1 pt-3 border-t border-white/10">
            <template v-for="item in footerLinks" :key="item.path ?? item.label">
                <!-- Item WITH children -->
                <div class="relative" v-if="item?.showSideBar === true">
                    <div :to="item?.path" @click="toggleSubmenu(item.label)"
                        class="w-full flex items-center gap-3 px-3 py-2.5 h-12 rounded-xl transition-all duration-200 text-nfuko-nav-text/60 hover:bg-white/5 hover:text-white cursor-pointer">
                        <div class="flex justify-between w-full items-center">
                            <div class="flex w-full items-center gap-3">
                                <component :is="item.icon" :size="20" />
                                <span class="text-sm font-medium capitalize">{{ item.label }}</span>
                            </div>
                            <div class="text-xs opacity-60">
                                {{ Store.showSubmenu === item?.label ? "▾" : "▸" }}
                            </div>
                        </div>
                    </div>
                    <div v-if="Store.showSubmenu === item?.label && item?.children"
                        class="border border-neutral-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 max-w-[50em] flex absolute left-full bottom-0 mb-0 ml-6 rounded-xl py-2 shadow-md shadow-black/20 transition-all z-[9999]">
                        <template v-for="(child, index) in item.children" :key="index">
                            <div v-auth="child?.permissions" class="w-[40em] items-center gap-4 px-6 py-1">
                                <div
                                    class="w-full flex items-center my-1 gap-0 px-4 py-2 rounded-md bg-nfuko-primary/90 dark:text-white">
                                    {{ child.title }}
                                </div>
                                <RouteLink :prifix="item.prifix" :item="child.items" :title="child.title"
                                    @click="toggleSubmenu(false)" />
                            </div>
                        </template>
                    </div>
                </div>
            </template>
        </div>

    </div>
</template>

<script setup>
import { computed } from 'vue';
defineOptions({ inheritAttrs: false })
import RouteLink from "./RouteLink.vue";
import { SidebarGroupLabel } from '@/Global';
import { pomPinia } from 'septor-store';
const props = defineProps(['links']);
const Store = pomPinia();

const mainLinks = computed(() => props.links?.filter(item => !item?.children) ?? [])
const footerLinks = computed(() => props.links?.filter(item => item?.children) ?? [])

const toggleSubmenu = (label) => {
    if (Store.showSubmenu === label) {
        Store.showSubmenu = null
    } else {
        Store.showSubmenu = label
    }
}
</script>
