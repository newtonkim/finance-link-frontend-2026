<template>
    <div v-bind="$attrs">
    <div v-for="item in links" :key="item.path" class="">
        <SidebarGroupLabel v-if="links.type == 'label' && item?.showSideBar === true"
            class="px-3 text-[10px] font-bold uppercase tracking-widest text-nfuko-nav-text/40 mb-1 text-sm font-semibold">
            {{ item.label }}
        </SidebarGroupLabel>
        <!-- Item WITHOUT children -->
        <RouteLink v-else-if="!item?.children && item?.showSideBar === true" :item="item"
            @click="() => toggleSubmenu(null)" />

        <!-- Item WITH children -->
        <div v-else class="relative" v-if="item?.showSideBar === true">

            <div :to="item?.path" @click="toggleSubmenu(item.label)"
                class="
        
        w-full flex items-center gap-2 px-2.5 py-1 rounded-xl peer/menu-button flex w-full items-center gap-2 overflow-hidden  text-left outline-hidden ring-sidebar-ring focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 h-8 text-sm   rounded-xl transition-all duration-200 text-nfuko-nav-text/60 hover:bg-white/5 hover:text-white   ">
                <div class="flex justify-between w-full items-center">
                    <div class="flex w-full items-center">
                        <component :is="item.icon" :size="20" />
                        <span class="px-2 text-sm font-medium capitalize">{{ item.label }}</span>
                    </div>

                    <div>
                        {{ Store.showSubmenu === item?.label ? "▾" : "▸" }}
                    </div>
                </div>
            </div>
            <div v-if="Store.showSubmenu === item?.label && item?.children"
                class="
          border border-neutral-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900
        max-w-[50em]  flex absolute left-full top-0 mt-0 ml-6   rounded-xl py-2 shadow-md shadow-black/20 border  transition-all z-[9999]   dark: bg-nfuko-primary">
                <template v-for="(child, index) in item.children" :key="index">
                    <div v-auth="subItem?.permissions" class="w-[40em] items-center gap-4 px-6 py-1">

                        <div
                            class="w-full flex items-center my-1 gap-0 px-4 py-2 rounded-md  bg-nfuko-primary/90  dark:text-white">
                            {{ child.title }}
                        </div>
                        <RouteLink :prifix="item.prifix" :item="child.items" :title="child.title"
                            @click="toggleSubmenu(false)" />
                    </div>
                </template>


            </div>
        </div>
    </div>
    </div>
</template>

<script setup>
defineOptions({ inheritAttrs: false })
import RouteLink from "./RouteLink.vue";
import { SidebarGroupLabel } from '@/Global';
import { pomPinia } from 'septor-store';
const props = defineProps(['links']);
const Store = pomPinia();

const toggleSubmenu = (label) => {
    if (Store.showSubmenu === label) {
        Store.showSubmenu = null
    } else {
        Store.showSubmenu = label
    }

}


</script>