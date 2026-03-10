<template>
    <!-- If item is an array -->
    <template v-if="Array.isArray(item)">
        <template v-for="subItem in item" :key="subItem.path" @click="handleClick">
            <div v-auth="subItem.permissions">

                <RouterLink :to="getRoutePath(subItem)" v-slot="{ isActive }" v-auth="subItem?.permissions">
                    <div :class="[
                        'capitalize p-2   transition-all duration-200  text-black/70  hover:text-neutral-800 hover:font-bold hover:bg-white/80 rounded-md hover:font-semibold hover:text-neutral-500    hover:border-b-0',
                        isCurrentUrl(getRoutePath(subItem))
                            ? 'font-bo font-semibold text-neutral-500 dark:text-neutral-500 bg-ugYellow border-b-1 border-gray-100'
                            : '  '
                    ]">

                        <component v-if="subItem?.icon" :is="subItem.icon" :size="20" class="size-5" />
                        {{ subItem.label }}
                    </div>
                </RouterLink>
            </div>
        </template>

    </template>

    <!-- If item is a single object -->
    <RouterLink v-else :to="item?.path" v-slot="{ isActive }" @click="handleClick" v-auth="item?.permissions">
        <div :class="[
            'capitalize',
            isCurrentUrl(subItem?.path)
                ? 'bg-ugYellow text-ugBlack shadow-lg'
                : 'peer/menu-button flex w-full items-center gap-2 overflow-hidden p-2 text-left outline-hidden ring-sidebar-ring focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 h-8 text-sm px-3 py-5 rounded-xl transition-all duration-200 text-[#9BB5A5]/60 hover:bg-white/5 hover:text-white'

        ]">

            <component v-if="item?.icon" :is="item.icon" :size="20" />
            {{ item?.label }}
        </div>
    </RouterLink>
</template>

<script setup>
const route = useRoute();
import { useRouter, useRoute } from 'vue-router';

const props = defineProps({
    item: {
        type: [Array, Object],
        required: true
    },
    title: String,
    prifix: String,
    onClick: Function
})

const handleClick = () => {
    props.onClick && props.onClick()
}
const isCurrentUrl = (path) => {
    return route.path === path;
};
function getRoutePath(route) {

    return `/${props.prifix}/${route.path}`;
}
</script>