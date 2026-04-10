<template>
  <div class="space-y-3 h-sc reen f lex flex-col overflow-hidden">

    <div v-for="(section, sIndex) in columns" :key="sIndex" class="flex flex-col rounded-2xl  
             bg-white dark:bg-neutral-900 shadow-lg px-2 hover:shadow-md transition-all duration-200 overflow-hidden">

      <!-- Header -->
      <header v-if="section.header" class="flex items-center justify-between px-1 py-2 
               bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <h3 class="text-sm font-semibold tracking-wide text-neutral-700 dark:text-white">
          {{ t(section.header) }}
        </h3>
      </header>

      <!-- TABLE -->
      <div v-if="section.type.toLowerCase() === 'table'" class="flex-1 overflow-auto h-full py-2">
        <Table :handleAction="handleAction" :action_config="ACTION_CONFIG" :dataFilter="section?.list"
          :data="section?.list" :columns="section.column" class="shadow-lg">
          <template v-for="(_, name) in $slots" #[name]="slotProps">

            <slot :name="name" v-bind="slotProps || {}" />
          </template>
        </Table>
      </div>
      <!-- DESCRIPTIONS -->
      <div v-else-if="section.type.toLowerCase() === 'descriptions'" class="py-3">
        <div class="grid gap-2" :style="gridStyle(section.column)">
          <div v-for="item in section.list" :key="item.key" class="rounded-xl border border-neutral-200 dark:border-neutral-800 
                   dark:bg-neutral-900 p-3 
                   hover:bg-white dark:hover:bg-neutral-800 transition">
            <!-- Label -->
            <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              {{ t(item.label) }}
            </span>

            <!-- Value -->
            <div class="mt-0 text-sm text-neutral-700 dark:text-neutral-200 break-words" :class="{
              'text-right': item.align === 'right',
              'text-center': item.align === 'center'
            }">
              <!-- SLOT -->
              <component v-if="getSlot(item)" :is="getSlot(item)" :value="data[item.key]" :row="data" />

              <!-- JSON -->
              <template v-else-if="isObjectJSON(data[item.key])">
                <div class="space-y-1 text-xs">
                  <template v-if="!Array.isArray(parseJSON(data[item.key]))">
                    <div v-for="(val, key) in parseJSON(data[item.key])" :key="key" class="flex justify-between gap-2">
                      <span class="text-neutral-400">
                        {{ key.replaceAll('_', ' ') }}
                      </span>
                      <span class="font-medium">
                        {{ val }}
                      </span>
                    </div>
                  </template>

                  <template v-else>
                    <div v-for="(val, index) in parseJSON(data[item.key])" :key="index" class="flex justify-between">
                      <span class="text-neutral-400">{{ index }}</span>
                      <span>{{ val }}</span>
                    </div>
                  </template>
                </div>
              </template>

              <!-- NORMAL -->
              <template v-else>
                <div class="relative group cursor-pointer">

                  <!-- Copy -->
                  <CopyData v-if="item.copy" :copy="stringToshow(item, data)" />

                  <!-- Text -->
                  <span v-else class="line-clamp-2" v-html="stringToshow(item, data)" />

                  <!-- Tooltip -->
                  <div v-if="data?.[item.key]?.length > 20" class="absolute left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block
                           bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 
                           max-w-xs w-max whitespace-normal break-words z-50 shadow-lg">
                    {{ stringToshow(item, data) }}
                  </div>

                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <!-- <slot name="actions" :item="data" /> -->
  </div>
</template>

<script setup>
import { isJSON } from "../Helpers"
import { CopyData } from "@/Global"
import Table from "../landingLayout/Components/Table.vue"
import { ACTION_CONFIG, dataFomater } from "../landingLayout/util"


const props = defineProps({
  data: { type: Object, default: () => ({}) },
  columns: { type: Array, default: () => [] },
  slots: { type: Object, default: () => ({}) }
})

function t(key) {
  return key
}

function gridStyle(column = 2) {
  return {
    gridTemplateColumns: `repeat(${column}, minmax(0, 1fr))`
  }
}

function formatValue(val) {
  if (val === null || val === undefined || val === "") return "—"
  return val
}

function parseJSON(val) {
  return isJSON(val)
}

function isObjectJSON(val) {
  const parsed = parseJSON(val)
  return parsed !== null && typeof parsed === "object"
}

function renderValue(item) {
  const value = props.data[item.key]
  if (item.format) {
    return item.format(value)
  }

  return formatValue(value)
}

function getSlot(item) {
  if (item?.slots?.default) {
    return props.slots[item.slots.default]
  }
  return null
}

const handleAction = async (item, action) => {

  //  console.log("Action:", action)
  //  console.log("Item:", item)

}
function stringToshow(item, data) {
  const collection = item.type ? dataFomater(data[item.key], item.type) : renderValue(item)
  return collection
}
</script>