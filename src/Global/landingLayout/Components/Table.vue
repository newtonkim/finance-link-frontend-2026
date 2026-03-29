<template>
  <div
    class="overflow-x-auto h-[64vh] border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm dark:bg-neutral-900 bg-white custom-scrollbar"
  >
    <table class="table-auto text-left border-collapse w-full ">
      <!-- Table Head -->
      <thead v-once class="sticky top-0 z-40 bg-white dark:bg-neutral-900 shadow-sm">
        <tr class="border-b border-neutral-100 dark:border-neutral-800">
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              'p-2 px-3 py-4 text-xs font-semibold tracking-wide text-neutral-700 capitalize',
              col.key === 'actions' ? 'text-center' : '',
              col.sticky ? `sticky z-30 ${col.sticky}-0 dark:bg-neutral-900 bg-white` : '',
              col.key.toLowerCase() === 'actions'
                ? 'text-center sticky z-30 right-0 dark:bg-neutral-900 bg-white'
                : '',
              col.class || ''
            ]"
            :style="getColumnStyle(col)"
          >
            <slot v-if="$slots[`${col.key}Header`]" :name="col.key" />
            <span v-else>{{ col.label }}</span>
          </th>
        </tr>
      </thead>

      <!-- Table Body -->
      <tbody>
        <tr v-if="!dataFilter?.length">
          <td
            :colspan="columns.length + ($slots.actions ? 1 : 0)"
            class="py-8 text-center text-sm text-neutral-500"
          >
            <EmptySvg />
          </td>
        </tr>

        <tr
          v-for="(item, idx) in dataFilter"
          :key="item?.id ?? idx"
          :class="Number(idx) < dataFilter.length - 1 ? 'border-b border-neutral-50 dark:border-neutral-800' : ''"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            :class="[
              'px-3 py-3 truncate text-[14px] text-neutral-500 dark:text-neutral-400 capitalize',
              col.sticky ? `sticky z-30 ${col.sticky}-0 dark:bg-neutral-900 bg-white` : '',
              col.class || '',
              col.key === 'actions'
                ? 'text-center sticky z-30 right-0 dark:bg-neutral-900 bg-white'
                : ''
            ]"
            :style="getColumnStyle(col)"
          >
            <!-- Actions Column -->
            <div v-if="col.key === 'actions'" class="flex justify-center gap-2 capitalize-table-action">
              <template v-for="action in col?.show ?? []" :key="action">
                <button
                  type="button"
                  @click="handleAction(item, action)"
                  v-auth="permissions?.[action]"
                  :class="action_config?.[action]?.class"
                  class="py-2"
                >
                  <component :is="action_config?.[action]?.icon" class="h-2.5 w-2.5" />
                  <span v-if="action !== 'delete'">{{ action }}</span>
                </button>
              </template>

              <div v-if="$slots.actions" class="text-right">
                <slot name="actions" :item="item" />
              </div>
            </div>

            <!-- Other Columns -->
            <template v-else>
              <slot v-if="$slots[col.key]" :name="col.key" :item="item" />
              <span v-else-if="col.copy">
                <CopyData :show="item[col?.key]" :copy="item[col?.key]" />
              </span>
              <span v-else-if="checkIfObjectPlain(item[col.key])">
                <table class="table table-bordered">
                  <tbody>
                    <tr v-for="[key, value] in Object.entries(item[col.key])" :key="key">
                      <td v-if="value"><span>{{ key }}</span></td>
                      <td v-if="value">: <span>{{ value }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </span>
              <span v-else v-html="col.type ? dataFomater(item[col?.key], col.type) : item[col.key]"></span>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { dataFomater } from '../util'
import { CopyData, checkIfObjectPlain } from '@/Global'
import { EmptySvg } from '../..'

const props = defineProps({
  handleAction: { type: Function, required: true },
  dataFilter: { type: Array, required: true },
  data: { type: Object as PropType<any>, required: true },
  columns: { type: Array as PropType<any[]>, required: true },
  action_config: { type: Object as PropType<any>, required: true },
  permissions: { type: Object, required: false },
})

// Fixed: use minWidth instead of maxWidth for table columns
function getColumnStyle(col: any) {
  if (!col.width) return col.style || {}
  const width = typeof col.width === 'number' ? col.width + 'px' : col.width
  return {
    width,
    minWidth: width,
    ...col.style,
  }
}
</script>

<style scoped>
.capitalize-table-action > * {
  @apply capitalize;
}
</style>