<template>
    <div class="px-4 flex  h-[80vh]  bg-neutral-50 dark:bg-neutral-900 overflow-y-auto">
        <div
            class="w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 flex flex-col">
            <div
                class="flex items-center justify-between px-2 py-2 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
                <h1 class="text-xl font-semibold tracking-tight">
                    Select Columns
                </h1>
                <Button type='button' @click="toggleAll"
                    class="text-xs px-3 py-1 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                    {{ allSelected ? 'Unselect All' : 'Select All' }}
                </Button>

            </div>
            <div class="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800">
                <div class="relative">
                    <input v-model="search" type="text" placeholder="Search columns..."
                        class="w-full pl-10 pr-3 py-2 text-sm border rounded-xl bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-nfuko-primary-500 transition" />
                    <span class="absolute left-3 top-2.5 text-neutral-400 text-sm">
                        <SearchCheck :size="15" />
                    </span>
                </div>
            </div>
            <div class="  overflow-y-auto h-[60vh]">
                <!-- <div class=" max-h-[calc(100vh-250px)] overflow-y-auto"> -->

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 py-3  overflow-y-auto custom-scrollbar h-[]">
                    <label v-for="(label, key) in filteredData" :key="key"
                        class="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border border-transparent hover:border-nfuko-primary-300 hover:bg-nfuko-primary-50 dark:hover:bg-neutral-800 transition group">
                        <input :checked="defaults.includes(label)" type="checkbox" :value="key" v-model="selected"
                            class="w-4 h-4 accent-nfuko-primary-600 cursor-pointer"  @input="checkTheInput" />
                        <span
                            class="text-sm capitalize text-neutral-700 dark:text-neutral-200 group-hover:text-nfuko-primary-600 transition">
                            {{ displayLabel(label) }}
                        </span>
                    </label>
                </div>
            </div>
            <div
                class="flex items-center justify-between px-5 py-1 bottom-0 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 sticky bottom-0">
                <span class="text-xs text-neutral-500">
                    {{ selected.length }} selected
                </span>

                <Button type='button' @click="exportColumns"
                    class="px-4 py-2 text-sm font-medium bg-nfuko-primary-600 text-white rounded-xl hover:bg-nfuko-primary-700 active:scale-95 transition">
                    Export
                </Button>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { SearchCheck } from 'lucide-vue-next'
import { computed, onMounted, ref, watch, type PropType } from 'vue'
import * as XLSX from 'xlsx'
import { pomPinia } from 'septor-store'

import { fetchTableData } from '../landingLayout/util'
import { notify } from '../Toasters'
const Store = pomPinia()

const props: any = defineProps({
    data: {
        type: Object,
        required: true, // { key: "Label" }
    },
    url: {
        type: String,
        required: false,
    },
    defaults: {
        type: Array as PropType<string[]>,
        default: () => [],
        required: false, // { key: "Label" }
    },
    rows: {
        type: Array,
        default: () => [], // actual table data
    },
    templateDisplayLabels: {
        type: Array as PropType<string[]>,

        required: false,
    },
})

const selected = ref<string[]>([])
const search = ref('')
const collection = ref(props.data)

const filteredData = computed(() => {


    if (!search.value) return collection.value



    return Object.fromEntries(
        Object.entries(collection.value).filter(([_, value]) => {
            return String(value).toLowerCase().includes(search.value.toLowerCase())
        }
        )
    )
})

const allSelected = computed(() =>
    selected.value.length === collection.value&& Object.keys(collection.value).length
)
function displayLabel(items: any) {
    const lable = []
    if (props.templateDisplayLabels && Array.isArray(props.templateDisplayLabels)) {
        props.templateDisplayLabels.forEach(element => {
            // console.log(element,items);

            lable.push(items[element] ?? element)

        });

        return lable.join(',')
    } else {
        return items
    }

}

const toggleAll = () => {
    if (allSelected.value) {
        selected.value = []
    } else {
        selected.value = Object.keys(collection.value)
    }
}
async function handleTableAction(item: any = {}, action: string, drawer = true) {
    const res = await fetchTableData({
        data: { ...item, },
        props: {
            ...props,
            reload: false, // dont refectch data
            //   reload: false, // dont refectch data
            state: "downloadTemplate",
            url: props.url,
        },
        Store,
    });
    collection.value = res?.payload?.data ?? res?.payload ?? res


}
onMounted(() => {
    collection.value=props.data
    selected.value = [...(selected.value ?? []), ...(props.defaults ?? [])];
   
    // console.log(selected.value);
    

    if (props?.url) {
        handleTableAction(props?.url, null)
    }
})
watch(() => selected.value, (val) => {
    // dont touch the defaults
    // selected.value = [...(selected.value ?? []), ...(props.defaults ?? [])];
},{
    immediate: true,
    deep: true})

    function checkTheInput(e: any) {
// alert()
if(props.defaults.includes(e.target.value)){
    selected.value = [...(selected.value ?? []), ...(props.defaults ?? [])];
  notify({
    type: 'error',
    msg: 'Default columns cannot be unchecked',

})
}
    // selected.value = [...(selected.value ?? []), ...(props.defaults ?? [])];
        
        // if (e.target.checked) {
        //     selected.value.push(e.target.value)
        // } else {
        //     selected.value = selected.value.filter(item => item !== e.target.value)
        // }

    }

const exportColumns = () => {
    const date = new Date().toISOString().slice(0, 10)
    const filename = `${location.pathname}`
        .toLowerCase()
        .replace(/\//g, '_')
        .replace(/\s+/g, '_')
        .replace(/[^\w-]/g, '')

    const fullFileName = `${filename}_template_${date}.xlsx`
    if (!selected.value.length) return
    if (!props.rows.length) {
        const headers = selected.value.map(key => `${key}`.toLocaleUpperCase()
            .replace(/\//g, '_')
            .replace(/\s+/g, '_')
            .replace(/[^\w-]/g, ''))

        const worksheet = XLSX.utils.aoa_to_sheet([headers])
        const workbook = XLSX.utils.book_new()

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Columns')
        XLSX.writeFile(workbook, fullFileName)
        return
    }

    const filteredRows = props.rows.map((row: any) => {
        const newRow: any = {}
        selected.value.forEach(key => {
            newRow[collection.value[key]] = `${row[key]}`.toLocaleUpperCase()
        })
        return newRow
    })
    const worksheet = XLSX.utils.json_to_sheet(filteredRows)
    worksheet['!cols'] = selected.value.map(() => ({ wch: 20 }))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export')
    const fileName = `export_${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(workbook, fileName)
}
</script>