<template>
    <table class="w-full min-w-[800px] text-left border-collapse p-5">
        <!-- HEAD -->
        <thead class="sticky top-0 z-40 bg-white  shadow-sm hover dark:bg-neutral-900  rounded-sm ">
            <tr class="px-4 py-3 font-bold text-neutral-700 dark:text-white ">
                <th v-for="col in columns" :key="col.key" :class="[
                    'py-2 text-[14px]  capitalize px-2 dark:text-white font-semibold border-b dark:border-slate-700 bg-neutral-50/50 dark:bg-neutral-600/50 border-b border-neutral-100 dark:border-neutral-800',
                    col.key === 'actions' ? 'text-center' : '',
                    col.sticky ? `sticky z-30 ${col.sticky}-0  da rk:bg-neutral-900` : '',
                    col.key === 'actions' ? 'text-center sticky z-30 right-0 d ark:bg-neutral-900 ' : '',
                    //   col.width ? `w-[${col.width}px]` : ''
                ]">
                    {{ col.label }}
                </th>
                <th v-if="$slots.actions" class="text-right">Actions</th>
            </tr>
        </thead>

        <!-- BODY -->
        <tbody class="">
            <tr v-if="!dataFilter()?.length">
                <td :colspan="columns.length + ($slots.actions ? 1 : 0)"
                    class="py-8 text-center text-sm text-neutral-500">
                    <EmptySvg />
                </td>
            </tr>

            <tr v-for="(item, idx) in dataFilter()" :key="item.id"
                :class="idx < dataFilter().length - 1 ? 'border-b border-neutral-50 dark:border-neutral-800' : ''">

                <td v-for="col in columns" :key="col.key" :class="[
                    'py-3 text-[14px] text-neutral-500 dark:text-neutral-400 ',
                    col.sticky ? `sticky z-30 ${col.sticky}-0 dark:bg-neutral-900` : '',
                    col.width ? `w-[${col.width}px]` : '',
                    col.class || '',
                    col.key === 'actions' ? 'text-center sticky z-30 right-0 dark:bg-neutral-900 ' : '',
                ]

                    " class="px-2">
                    <!-- ACTION SLOT -->
                    <div v-if="col.key === 'actions'" class="flex justify-center gap-2  ">
                        <button v-for="action in col?.show ?? []" :key="action" @click="handleAction(item, action)"
                            :class="action_config?.[action]?.class">
                            <component :is="action_config?.[action]?.icon" class="h-3.5 w-3.5" />
                            <span v-if="action !== 'delete'">{{ action }}</span>
                        </button>
                    </div>

                    <!-- DEFAULT CELL -->
                    <template v-else>
                        <slot v-if="$slots[col.key]" :name="col.key" :item="item" />
                        <span v-else>{{ col.type ? dataFomater(item[col.key], col.type) :
                            item[col.key] }}</span>
                        <!-- <span v-else>{{ item[col.key] ?? '—' }}</span> -->
                    </template>
                </td>

                <!-- EXTRA ACTIONS -->
                <td v-if="$slots.actions" class="text-right">
                    <slot name="actions" :item="item" />
                </td>
            </tr>
        </tbody>

    </table>
</template>
<script setup lang="ts">
import { PropType } from 'vue';
import { dataFomater } from '../util';
import { EmptySvg } from '../..';




const props = defineProps({
    handleAction: { type: Function, required: true },
    dataFilter: { type: Function, required: true },
    data: { type: Object as PropType<any>, required: true },
    columns: { type: Array as PropType<any[]>, required: true },
    action_config: { type: Object as PropType<any>, required: true }
});
</script>