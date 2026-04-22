<template>
    <div v-bind="$attrs" class="flex flex-col h-full py-2">

        <!-- Main nav items -->
        <div class="flex flex-col gap-1 flex-1">
            <template v-for="item in mainLinks" :key="item.path ?? item.label">
            <span v-if='!item?.children && item?.showSideBar === true' class='item '>
                <SidebarGroupLabel
                
                v-if="item.type == 'label' && item?.showSideBar === true" class="ring-sidebar-ring flex h-5 shrink-0 items-center rounded-md outline-hidden mt-6 transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 px-4  text-[10px] font-bold uppercase tracking-[0.1em] text-nfuko-nav-text/50">
                    {{ item.label }}
                </SidebarGroupLabel>

                <RouteLink v-else-if="!item?.children && item?.showSideBar === true" :item="item" :prifix="prefix" @click="() => toggleSubmenu(null)" />
            </span>
        <div v-else  >
        

                <div class="relative" v-if="item?.showSideBar === true">
                    
                    <div v-auth="item?.permissions" :to="item?.path" @click="toggleSubmenu(item.label ?? null)"
                        class="w-full  2 flex items-center   py-2 rounded-xl transition-all duration-200 text-nfuko-nav-text hover:bg-white/5 hover:text-white cursor-pointer hover:px-2 peer/menu-button flex w-full items-center gap-2 overflow-hidden  text-left outline-hidden ring-sidebar-ring focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground     [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 h-9 text-sm rounded-xl transition-all duration-200 text-nfuko-nav-text/60 hover:bg-white/5 hover:text-white capitalize font-medium tracking-wide text-nfuko-nav-text group-hover:text-white flex">
                        <div class="flex justify-between  items-center" :class="state === 'expanded' ? 'w-full' : ''">
                            <div class="flex w-full items-center gap-3">
                                <component :is="item.icon" :size="20" />
                                <span class="text-sm font-medium capitalize">{{ item.label }}</span>
                            </div>
                            <div class="hov er:px-2 l items-center gap-2 overflow-hidden  text-left outline-hidden ring-sidebar-ring focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50   aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground     [&>span:last-child]:truncate   text-sm rounded-xl transition-all duration-200 text-nfuko-nav-text/60 hover:bg-white/5 hover:text-white capitalize font-medium tracking-wide text-nfuko-nav-text group-hover:text-white ">
                                {{ Store.showSubmenu === item?.label ? "▾" : "▸" }}
                            </div>
                        </div>
                    </div>
                    <div v-if="Store.showSubmenu === item?.label && item?.children"
                        class="absolute left-full top-0 ml-4 flex z-[9999] transition-all border border-neutral-100 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
                        <template v-for="(child, index) in item.children" :key="index">
                            <div v-auth="child?.permissions" class="w-[240px] flex flex-col py-3">
                                <div
                                    :class="child.titleStyle === 'green'
                                        ? 'px-4 py-2 mx-3 mb-2 rounded-lg bg-nfuko-primary/95 text-white font-bold text-[11px] uppercase tracking-wider'
                                        : 'px-4 py-2 mx-3 mb-2 rounded-lg bg-nfuko-primary/10 dark:bg-bg-nfuko-yellow/10 text-nfuko-primary dark:text-bg-nfuko-yellow font-bold text-[11px] uppercase tracking-wider'">
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
        
        </div>
            </template>
        </div>


    </div>
</template>

<script setup lang="ts">
import { computed,onMounted ,onUnmounted} from 'vue';
 
defineOptions({ inheritAttrs: false })
import RouteLink from "./RouteLink.vue";
import { SidebarGroupLabel,useSidebar } from '@/Global';
import { pomPinia } from 'septor-store';
import type { MenuRoutes } from '@/Global/types/helpers';

const props = defineProps<{
    links: MenuRoutes[]
    prefix?: string
}>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Store = pomPinia() as any;
const { state } = useSidebar()

const mainLinks = computed(() => props.links)

const toggleSubmenu = (label: string | undefined | null) => {
    if (Store.showSubmenu === label) {
        Store.showSubmenu = null
    } else {
        Store.showSubmenu = label
    }
}
onMounted(() => {
    // window.addEventListener('click', ()=> toggleSubmenu(null));
});

onUnmounted(() => {
    window.removeEventListener('click', ()=> toggleSubmenu(null));
});
</script>
<style scoped>
.item:empty {
  display: none !important;
}
</style>