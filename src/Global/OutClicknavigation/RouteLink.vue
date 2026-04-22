<template>
    <!-- If item is an array -->
    <template v-if="Array.isArray(item)">
        <template v-for="subItem in item" :key="subItem.path">

            <div v-if="subItem.type === 'header'"
                :class="subItem.titleStyle === 'green'
                    ? 'px-4 py-2 mb-2 rounded-lg bg-nfuko-primary text-white font-bold text-[11px] uppercase tracking-wider'
                    : 'px-4 py-2 mb-2 rounded-lg bg-nfuko-primary/10 dark:bg-bg-nfuko-yellow/10 text-nfuko-primary dark:text-bg-nfuko-yellow font-bold text-[11px] uppercase tracking-wider'">
                {{ subItem.label }}
            </div>
            <div v-else v-auth="subItem.permissions" @click="() => handleClick(subItem)">
                <RouterLink v-if="(subItem?.showSideBar == false) ? false : true" :to="getRoutePath(subItem)" v-slot="{ isActive }"
                    v-auth="subItem?.permissions">
                    <div :class="[
                        'flex capitalize p-2 capitalize flex-1 font-medium text-[13px] tracking-wide transition-colors duration-200 transition-all duration-200 text-black/70 hover:text-neutral-800 hover:font-bold rounded-md hover:font-semibold hover:text-neutral-500 hover:border-b-0',
                        isCurrentUrl(getRoutePath(subItem))
                            ? ' '
                            : ' dark:text-neutral-400 dark:hover:text-white'
                    ]">
                        <component v-if="subItem?.icon" :is="subItem.icon" :size="20" class="size-5" />
                        {{ subItem.label }}
                    </div>
                </RouterLink>
            </div>
        </template>

    </template>
    <!-- If item is a single object -->
    <RouterLink v-else :to="'/' + (props.prifix ?? 'tenant') + '/' + item?.path" v-slot="{ isActive }" @click="() => handleClick(item)"
        v-auth="item?.permissions">

        <div :class="[
            ' px-1 peer/menu-button flex w-full items-center gap-2 overflow-hidden  text-left outline-hidden ring-sidebar-ring focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground     [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 h-9 text-sm rounded-xl transition-all duration-200 text-nfuko-nav-text/60 hover:bg-white/5 hover:text-white capitalize font-medium tracking-wide text-nfuko-nav-text group-hover:text-white flex',
            isCurrentUrl('/' + (props.prifix ?? 'tenant') + '/' + item?.path, currentRoute)
                ? 'bg-nfuko-nav-active text-white'
                : ''

        ]">
            <component v-if="item?.icon" :is="item.icon" :size="20" class="shrink-0" />
            <span v-if="state === 'expanded'" class="flex-1 font-medium text-[13px] tracking-wide transition-colors duration-200 text-nfuko-nav-text group-hover:text-white">
                {{ item?.label }}
            </span>
        </div>
    </RouterLink>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useSidebar } from '@/Global/ui/sidebar/utils';

const { state } = useSidebar();
const currentRoute = ref(null);
const props = defineProps({
    item: {
        type: [Array, Object],
        required: true
    },
    title: String,
    prifix: String,
    onClick: Function
})

const handleClick = (item) => {
    currentRoute.value = null
    if (props.onClick) props.onClick()
    currentRoute.value = item?.path
}
const isCurrentUrl = (path, route) => {

    return route?.path === path;

};
function getRoutePath(route) {

    return `/${props.prifix}/${route.path}`;
}
 
</script>