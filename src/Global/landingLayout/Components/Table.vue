<template>
  <div :class="props.class"
    class="overflow-x-auto max-h-[64vh] border-0 border-neutral-100 dark:border-neutral-800 rounded-2xl sh adow-sm dark:bg-neutral-900 bg-white custom-scrollbar">
    <tableLoader v-if="!Array.isArray(dataFilter)" :numberindex="numberindex" :columns="localColumns" />

    <table v-else class="table-auto text-left bo rder-collapse w-full striped-table">
      <thead class="sticky top-0 z-40 bg-white dark:bg-neutral-900 shadow-sm">
        <tr class="border-b border-neutral-100 dark:border-neutral-800">
          <th v-if="numberindex" class="p-2 px-3 py-4 text-xs font-semibold tracking-wide text-neutral-700 capitalize">
            S/N</th>
          <th v-if="checkBox" class="p-2 px-3 py-4 text-xs font-semibold tracking-wide text-neutral-700 capitalize">#</th>

          <th v-for="(col, index) in localColumns" draggable="true" @dragstart="onDragStart(index)" @dragover.prevent
            @drop="onDrop(index)" :key="col.key" :class="[
              `${col.key === 'actions' || col.key === 'action' ? 'hide-on-print' : ''}`,

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
      <tbody cla ss=" text-sm text-neutral-600 dark:text-neutral-400">
        <tr v-if="!dataFilter?.length">
          <td :colspan="localColumns.length + ($slots.actions ? 1 : 0)"
            class="py-8 text-center text-sm text-neutral-500">
            <EmptySvg />
          </td>
        </tr>
        <tr v-for="(item, idx) in dataFilter" :key="item?.id ?? idx" :class="[
        'hover:bg-nfuko-action/2 dark:hover:bg-neutral-800  hover:shadow-sm  hover:cursor-pointer transition-all duration-200',
          rowClass,
          Number(idx) < dataFilter.length - 1 ? 'border-b border-neutral-50 dark:border-neutral-800' : ''

        ]">
        <!-- {{ selected }} -->
          <td v-if="numberindex" :class="[

            'px-3 py-3 truncate text-[14px] text-neutral-500 dark:text-neutral-400 capitalize',
            'sticky z-30 left-0 bg-white dark:bg-neutral-900'
          ]">{{ idx + 1 }}</td>
          <td v-if="checkBox" class="p-2  py-1 text-xs font-semibold tracking-wide text-neutral-700 capitalize">
            <div  >
                <label  :key="idx+45" >
                    <input type="checkbox" :value="(item?.id??idx)+23" @click="()=>checkedAndSelectdValue(item)" class="w-4 h-4 accent-nfuko-primary-600 cursor-pointer" />
                    <span
                        class="text-sm capitalize text-neutral-700 dark:text-neutral-200 group-hover:text-nfuko-primary-600 transition">
                        {{ item.label }}
                    </span>
                </label>
            </div>
          </td>
          <td v-for="col in localColumns" :key="col.key" :class="[
            `${col.key === 'actions' || col.key === 'action' ? 'hide-on-print' : ''}`,

            'px-3 py-3 truncate text-[14px] text-neutral-500 dark:text-neutral-400 capitalize',
            col.sticky ? `sticky z-30 ${col.sticky}-0 dark:bg-neutral-900 bg-white` : '',
            col.class || '',
            col.key === 'actions'
              ? 'text-center sticky z-30 right-0 dark:bg-neutral-900 bg-white'
              : ''
          ]" :style="getColumnStyle(col)">
            <div :class="[`${col?.class}`, 'truncate']" :style="getColumnStyle(col)">
            
              <div v-if="col.key === 'actions'" class="flex justify-center gap-2 capitalize-table-action text-[14px]">
                <template v-for="action in col?.show ?? []" :key="action">
                  <Imploading v-if="action == 'share'"
                    class="p-2 cursor-pointer hover:bg-nfuko-default hover:text-gray-400  hover:border hover:border-accent bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-ugYellow rounded-sm transition-all"
                    :items='sharedropdown' @select="(v: any)=>props.handleAction?.({...item,action:v?.value}, 'share')" icon="LucideSend" />

                  <button v-else type="button" @click="() => props.handleAction?.(item, action)" v-auth="permissions?.[action]"
                    :class="action_config?.[action]?.class" class=" ">
                    <component :is="action_config?.[action]?.icon" class="h-2 w-2" />
                    <span v-if="action !== 'delete'">{{ action }}</span>
                  </button>
                </template>
                <div v-if="$slots.actions" class="text-right">
                  <slot name="actions" :item="item" />
                </div>
              </div>
              <div v-else class="text-[14px]">
                <slot v-if="$slots[col.key]" :name="col.key" :item="item" />
                <span v-else-if="col.copy">
                  <CopyData :show="item[col?.key]" :copy="item[col?.key]" />
                </span>
                <span v-else-if="checkIfObjectPlain(item[col.key])">
                  <table class="table table-bordered">
                    <tbody>
                      <tr v-for="[key, value] in Object.entries(item[col.key])" :key="key">
                        <td v-if="value"><span>{{ key }}</span></td>
                        <td v-if="value" class="px-1 ">:<span class="px-2 ">{{ value }}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </span>
                <span v-else v-html="col.type ? dataFomater(item[col?.key], col.type) : item[col.key]"></span>
              </div>
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
import { CopyData, checkIfObjectPlain, Imploading } from '@/Global'
import { EmptySvg } from '../..'
import tableLoader from './tableLoader.vue'
import { ref, watch } from 'vue'

const props = defineProps({
  rowClass: { type: String, required: false },
  numberindex: { type: Boolean, required: false },
  checkBox: { type: Boolean, required: false,default:false },
  class: { type: String, required: false },
  handleAction: { type: Function, required: false },
  dataFilter: { type: Array as PropType<any[]>, required: true },
  data: { type: Object as PropType<any>, required: false },
  columns: { type: Array as PropType<any[]>, required: true },
  action_config: { type: Object as PropType<any>, required: false },
  permissions: { type: Object, required: false },
})
const sharedropdown = ref<any>([
  { label: "whats app", value: "whats-app", },
  { label: "sms", value: "sms", },
  { label: "gmail", value: "gmail", },
])
const resizingCol = ref<number | null>(null)
const selected = ref<any>({})
const startX = ref<any>(0)
const startWidth = ref<any>(0)
const localColumns = ref<any>([...props.columns])
watch(
  () => props.columns,
  (val) => (localColumns.value = [...val]),
  { deep: true }
)

function startResize(e: MouseEvent, index: any) {
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
function onDragStart(index: any) {
  dragIndex.value = index
}
function onDrop(index: any) {
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
    ...col.style,
  }
}
function checkedAndSelectdValue(item: any) {
  const checked=JSON.stringify(item)
  if (selected.value[checked]) {
    delete selected.value[checked]
  } else {
    selected.value[checked] = item
  }
  // console.log(item);
  
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
tbody td *{
  font-size: 14px;
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