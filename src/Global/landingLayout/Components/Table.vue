<template>
  <div class=" ">
    <table class="w-full table-auto text-left border-collapse  ">
      <!-- HEAD -->
      <thead v-once class="sticky top-0 z-40 bg-white shadow-sm dark:bg-neutral-900 rounded-sm">
        <tr class="font-bold text-neutral-700 dark:text-white">
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
           'py-3 px-3 text-sm font-semibold text-gray-700 dark:text-white border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-[14px] capitalize',
                        col.key === 'actions' ? 'text-center' : '',
                        col.sticky ? `sticky z-30 ${col.sticky}-0 dark:bg-neutral-900 bg-white w-fit` : '',
                        col.key.toLowerCase() === 'actions' ? 'text-center sticky z-30 right-0 dark:bg-neutral-900 bg-white' : '',
                        col.class || ''
            ]"
            :style="getColumnStyle(col)"
          >
            <slot v-if="$slots[`${col.key}Header`]" :name="col.key" />
            <span v-else>{{ col.label }}</span>
           
          </th>
          <!-- <th v-if="$slots.actions" class="
            
    text-sm font-semibold
    text-gray-700 dark:text-white
    border-b border-gray-200 dark:border-slate-700
    text-[14px] capitalize text-center
    sticky right-0 z-30
    bg-white dark:bg-neutral-900
       ">Actions</th>
       -->
    </tr> 
      </thead>

      <!-- BODY -->
      <tbody>
        <tr v-if="!dataFilter?.length">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)"
              class="py-8 text-center text-sm text-neutral-500">
            <EmptySvg />
          </td>
        </tr>

        <tr v-for="(item, idx) in dataFilter" :key="item?.id ?? idx"
            :class="Number(idx) < dataFilter.length - 1 ? 'border-b border-neutral-50 dark:border-neutral-800' : ''">
          <td
            v-for="col in columns"
            :key="col.key"
            :class="[
              'px-3 py-3 text-[14px] text-neutral-500 dark:text-neutral-400 capitalize',
              col.sticky ? `sticky z-30 ${col.sticky}-0 dark:bg-neutral-900 bg-white` : '',
              col.class || '',
              col.key === 'actions' ? 'text-center sticky z-30 right-0 dark:bg-neutral-900 bg-white' : ''
            ]"
            :style="getColumnStyle(col)"
          >
            <!-- ACTION SLOT -->
            <div v-if="col.key === 'actions'" class="flex justify-center gap-2 capitalize-table-action">
                <template   v-for="action in col?.show ?? []" :key="action">
                    <button type="button" @click="handleAction(item, action)"
                    v-auth="permissions?.[action]"
                    :class="action_config?.[action]?.class">
                    <component :is="action_config?.[action]?.icon" class="h-3.5 w-3.5" />
                    <span v-if="action !== 'delete'">{{ action }}</span>
                  </button>
                  
                </template>
                <div v-if="$slots.actions" class="text-right">
             <slot name="actions" :item="item" />
           </div> 
            </div>
            <!-- permissions -->

            <!-- DEFAULT CELL -->
            <template v-else> 
              <slot v-if="$slots[col.key]" :name="col.key" :item="item" />
              <span v-else v-html="col.type ? dataFomater(item[col?.key], col.type) : item[col.key]"></span>
            </template>
          </td>

          <!-- EXTRA ACTIONS -->
          <!-- <td v-if="$slots.actions" class="text-right">
            <slot name="actions" :item="item" />
          </td> -->
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { dataFomater } from '../util';
import { EmptySvg } from '../..';

const props = defineProps({
  handleAction: { type: Function, required: true },
  dataFilter: { type: Array, required: true },
  data: { type: Object as PropType<any>, required: true },
  columns: { type: Array as PropType<any[]>, required: true },
  action_config: { type: Object as PropType<any>, required: true },
    permissions: { type: Object, required: false },
});

function getColumnStyle(col: any) {
    const width =
        typeof col.width
            ? col.width + 'px' // convert numeric to percentage
            : col.width;


    return {
        'min-width': width,
        minWidth: col.width ? (typeof col.width === 'number' ? col.width + 'px' : col.width) : undefined,
        ...(col.style || {})
    };
}
</script>

<style scoped>
.capitalize-table-action > * {
  @apply capitalize;
}
</style>