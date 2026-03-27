<template>
    <div class="space-y-4  capitalize ">

        <section v-for="(section, sIndex) in columns" :key="sIndex" class="overflow-hidden rounded-lg r border-neutral-200 dark:border-neutral-700   dark:bg-neutral-900  
            rounded-2xl border-neutral-100 bg-white   shadow-sm pb-5 dark:border-neutral-800 dark:bg-neutral-900
            ">
            <header v-if="section.header"
                class="flex items-center justify-between px-4  bg-nfuko-surface dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <h3 class="text-sm font-semibold py-3 tracking-wide text-neutral-700 dark:text-white">
                    {{ t(section.header) }}
                </h3>
            </header>
            <Table v-if="section.type.toLocaleLowerCase() === 'table'" :handleAction="handleAction"
                :action_config="ACTION_CONFIG" :dataFilter="section?.list" :data="section?.list"
                :columns="section.column" />
            <div v-else-if="section.type.toLocaleLowerCase() === 'descriptions'"
                class="grid gap-[1px] bg-neutral-200 dark:bg-neutral-700" :style="gridStyle(section.column)">
                <div v-for="item in section.list" :key="item.key"
                    class="flex flex-col bg-white  dark:bg-neutral-900 px-4 py-2.5 transition hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <span class="text-[10px] font-semibold tracking-wide text-neutral-400 uppercase mb-0">
                        {{ t(item.label) }}
                    </span>
                    <div class="text-sm font-medium text-neutral-700 dark:text-neutral-200 break-words"
                        :class="{ 'text-right': item.align === 'right', 'text-center': item.align === 'center' }">
                        <component v-if="getSlot(item)" :is="getSlot(item)" :value="data[item.key]" :row="data" />
                        <template v-else>
                            <template v-if="isObjectJSON(data[item.key])">
                                <div class="space-y-1 text-xs">
                                    <template v-if="!Array.isArray(parseJSON(data[item.key]))">
                                        <div v-for="(val, key) in parseJSON(data[item.key])" :key="key"
                                            class="flex justify-between gap-2">
                                            <span class="text-neutral-400">
                                                {{ key.replaceAll('_', ' ') }}
                                            </span>


                                            <span v-html="item.type ? dataFomater(val, item.type) : val"></span>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div v-for="(val, index) in parseJSON(data[item.key])" :key="index"
                                            class="flex justify-between">
                                            <span class="text-neutral-400">{{ index }}</span>
                                            <span>{{ val.replaceAll('_', ' ') }}</span>
                                        </div>
                                    </template>
                                </div>
                            </template>
                            <template v-else>

                                <div class="relative inl ine-block group cursor-pointer">
                                    <div v-if="item.copy">
                                        <CopyData :copy="stringToshow(item, data)" />
                                    </div>
                                    <span v-else class='line-clamp-2' v-html="stringToshow(item, data)"></span>
                                    <div v-if="data?.[item.key]?.length > 20"
                                        class="absolute left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block bg-black text-white text-xs rounded px-3 py-2 max-w-xs w-max min-w-[120px] whitespace-normal break-words z-[9999] shadow-lg">
                                        {{ stringToshow(item, data) }}
                                    </div>
                                </div>

                            </template>
                        </template>
                    </div>
                </div>
            </div>
        </section>
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