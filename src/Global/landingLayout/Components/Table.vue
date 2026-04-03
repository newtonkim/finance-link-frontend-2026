<template>
  <div
  :class="class"
    class="overflow-x-auto max-h-[64vh] border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm dark:bg-neutral-900 bg-white custom-scrollbar">
    <table class="table-auto text-left bo rder-collapse w-full striped-table">
      <thead class="sticky top-0 z-40 bg-white dark:bg-neutral-900 shadow-sm">
        <tr class="border-b border-neutral-100 dark:border-neutral-800">
             <th v-if="numberindex" class="p-2 px-3 py-4 text-xs font-semibold tracking-wide text-neutral-700 capitalize">S/N</th>
             <th v-if="checkBox" class="p-2 px-3 py-4 text-xs font-semibold tracking-wide text-neutral-700 capitalize">check</th>

          <th v-for="(col, index) in localColumns" draggable="true" @dragstart="onDragStart(index)" @dragover.prevent
            @drop="onDrop(index)" :key="col.key" :class="[
              'p-2 px-3 py-4 text-xs font-semibold tracking-wide text-neutral-700 capitalize',
              col.key === 'actions' ? 'text-center' : '',
              col.sticky ? `sticky z-30 ${col.sticky}-0 dark:bg-neutral-900 bg-white` : '',
              col.key.toLowerCase() === 'actions'
                ? 'text-center sticky z-30 right-0 dark:bg-neutral-900 bg-white'
                : '',
              col.class || ''
            ]" :style="getColumnStyle(col)">

            <slot v-if="$slots[`${col.key}Header`]" :name="col.key" />
            <span v-else>{{ col.label }}</span>
            <div class="resizer" @mousedown="startResize($event, index)"></div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!dataFilter?.length">
          <td :colspan="localColumns.length + ($slots.actions ? 1 : 0)"
            class="py-8 text-center text-sm text-neutral-500">
            <EmptySvg />
          </td>
        </tr>
        <tr v-for="(item, idx) in dataFilter" :key="item?.id ?? idx"
          :class="[
            rowClass,
            Number(idx) < dataFilter.length - 1 ? 'border-b border-neutral-50 dark:border-neutral-800' : ''

          ]"
          >
          <td v-if="numberindex" :class="[

            'px-3 py-3 truncate text-[14px] text-neutral-500 dark:text-neutral-400 capitalize',
            'sticky z-30 left-0 bg-white dark:bg-neutral-900'
          ]">{{ idx + 1 }}</td>
            <td v-if="checkBox" class="p-2 px-3 py-4 text-xs font-semibold tracking-wide text-neutral-700 capitalize">
               <!-- <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 py-3 max-h-[58vh] overflow-y-auto custom-scrollbar">
                
                <label  :key="idx+45"
                    class="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border border-transparent hover:border-nfuko-primary-300 hover:bg-nfuko-primary-50 dark:hover:bg-neutral-800 transition group">
                    <input type="checkbox" :value="id+23" v-model="selected"
                        class="w-4 h-4 accent-nfuko-primary-600 cursor-pointer" />
                    <span
                        class="text-sm capitalize text-neutral-700 dark:text-neutral-200 group-hover:text-nfuko-primary-600 transition">
                        {{ label }}
                    </span>
                </label>
            </div> -->
            </td>
          <td v-for="col in localColumns" :key="col.key" :class="[
            'px-3 py-3 truncate text-[14px] text-neutral-500 dark:text-neutral-400 capitalize',
            col.sticky ? `sticky z-30 ${col.sticky}-0 dark:bg-neutral-900 bg-white` : '',
            col.class || '',
            col.key === 'actions'
              ? 'text-center sticky z-30 right-0 dark:bg-neutral-900 bg-white'
              : ''
          ]" :style="getColumnStyle(col)">
            <div :class="col.class" :style="getColumnStyle(col)">
              <div v-if="col.key === 'actions'" class="flex justify-center gap-2 capitalize-table-action">
                <template v-for="action in col?.show ?? []" :key="action">
                  <button type="button" @click="handleAction(item, action)" v-auth="permissions?.[action]"
                    :class="action_config?.[action]?.class" class="py-2">
                    <component :is="action_config?.[action]?.icon" class="h-2.5 w-2.5" />
                    <span v-if="action !== 'delete'">{{ action }}</span>
                  </button>
                </template>
                <div v-if="$slots.actions" class="text-right">
                  <slot name="actions" :item="item" />
                </div>
              </div>
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
                        <td v-if="value" class="px-1 ">:<span  class="px-2 ">{{ value }}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </span>
                <span v-else v-html="col.type ? dataFomater(item[col?.key], col.type) : item[col.key]"></span>
              </template>
            </div>
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
import { ref, watch } from 'vue'

const props = defineProps({
  rowClass: { type: String, required: false },
  numberindex: { type: Boolean, required: false },
  checkBox: { type: Boolean, required: false },
  class: { type: String, required: false },
  handleAction: { type: Function, required: true },
  dataFilter: { type: Array, required: true },
  data: { type: Object as PropType<any>, required: true },
  columns: { type: Array as PropType<any[]>, required: true },
  action_config: { type: Object as PropType<any>, required: true },
  permissions: { type: Object, required: false },
})
const resizingCol = ref<number | null>(null)
const startX = ref(0)
const startWidth = ref(0)
const localColumns = ref([...props.columns])
watch(
  () => props.columns,
  (val) => (localColumns.value = [...val]),
  { deep: true }
)

function startResize(e: MouseEvent, index: number) {
  resizingCol.value = index
  startX.value = e.clientX
  startWidth.value = parseInt(localColumns.value[index].width) || 150
  document.addEventListener('mousemove', resizeColumn)
  document.addEventListener('mouseup', stopResize)
}

function resizeColumn(e: MouseEvent) {
  if (resizingCol.value === null) return
  const diff = e.clientX - startX.value
  const newWidth = startWidth.value + diff
  localColumns.value[resizingCol.value].width =
    Math.max(80, newWidth) + 'px'
}

function stopResize() {
  resizingCol.value = null
  document.removeEventListener('mousemove', resizeColumn)
  document.removeEventListener('mouseup', stopResize)
}
const dragIndex = ref<number | null>(null)
function onDragStart(index: number) {
  dragIndex.value = index
}
function onDrop(index: number) {
  if (dragIndex.value === null) return
  const dragged = localColumns.value[dragIndex.value]
  localColumns.value.splice(dragIndex.value, 1)
  localColumns.value.splice(index, 0, dragged)
  dragIndex.value = null
}
function getColumnStyle(col: any) {
  if (!col.width) return col.style || {}
  const width = typeof col.width === 'number' ? col.width + 'px' : col.width
  return {
    width,
    ...(col.style || {}),
  }
}

</script>

<style scoped>
.capitalize-table-action>* {
  @apply capitalize;
}

th {
  cursor: grab;
}

th:active {
  cursor: grabbing;
}

.resizer {
  width: 6px;
  cursor: col-resize;
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  z-index: 50;
  background: transparent;
}

.resizer:hover {
  background: rgba(10, 163, 127, 0.5);
  /* blue line */
}
</style>