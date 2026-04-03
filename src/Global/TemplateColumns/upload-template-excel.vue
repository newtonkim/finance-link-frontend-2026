<script setup lang="ts">
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import Table from '../landingLayout/Components/Table.vue'
import { Upload } from 'lucide-vue-next'
import { ACTION_CONFIG, fetchTableData } from '../landingLayout/util'
import { pomPinia } from 'septor-store'
import SheetFooter from '../ui/sheet/SheetFooter.vue'
import { createUrl, formDataFormat } from '../Helpers'
import { failedUploads } from '.'

const Store = pomPinia()

// props
const props = defineProps({
    duplicatedBy: {
        type: Array as () => string[],
        default: () => [],
    },
    url: {
        type: String,
        required: true,
    },
    submit: {
        required: true,
    },
    submitUrl: {
        type: String,
        required: false,
    },
    uploadTrick: {
        type: String,

        default: 'indexed'
    }
})

// refs
const fileInput = ref<HTMLInputElement | null>(null)
const excelColumns = ref<any[]>([])
const excelData = ref<any[]>([])
const excelChunks = ref<any[]>([])
const failedChunks = ref<any[]>([])
const duplicates = ref<any[]>([])
const showDuplicateList = ref(false)
const usedFile = ref(null)
// pagination
const currentPage = ref(1)
const pageSize = ref(50)

const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return excelData.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
    return Math.ceil(excelData.value.length / pageSize.value)
})

// helpers
const normalizeKey = (header: string) =>
    header
        ?.toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')

// actions
function handleAction(item: any, action: string) {
    if (action === 'delete') {
        excelData.value = excelData.value.filter(
            (row: any) => row.index !== item.index
        )
    }
}

// file triggers
function triggerFileInput() {
    fileInput.value?.click()
}

function handleFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) readExcel(file)
    usedFile.value = file
}

function handleDrop(event: DragEvent) {
    const file = event.dataTransfer?.files?.[0]
    if (file) readExcel(file)
}

// read excel
function readExcel(file: File) {
    const reader = new FileReader()

    reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]

        const allRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            raw: false,
            dateNF: 'yyyy-mm-dd'
        })

        const headers = allRows[0]
        const rows = allRows.slice(1)

        // columns
        excelColumns.value = headers.map((header: string) => ({
            key: normalizeKey(header),
            label: header,
            name: header,
            width: 'fit-content',
        }))

        // chunking
        const chunkSize = 5000
        excelChunks.value = []

        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize).map((row, rowIndex) => {
                const obj: any = {}

                headers.forEach((header: string, colIndex: number) => {
                    const key = normalizeKey(header)
                    obj[key] = row[colIndex] ?? null
                })

                obj.index = i + rowIndex
                obj.actions = []
                return obj
            })

            excelChunks.value.push(chunk)
        }

        excelData.value = excelChunks.value.flat()

        // detect duplicates
        if (props.duplicatedBy.length)
            duplicates.value = findDuplicatesByMultipleKeys(
                excelData.value,
                props.duplicatedBy
            )

        currentPage.value = 1
    }

    reader.readAsArrayBuffer(file)
}

// duplicate detection
function findDuplicatesByMultipleKeys(data: any[], keys: string[]) {
    const seen = new Set<string>()
    const dupes: any[] = []

    data.forEach((item) => {
        const compositeKey = keys.map((k) => item[k]).join('|')
        if (seen.has(compositeKey)) {
            dupes.push(item)
        } else {
            seen.add(compositeKey)
        }
    })

    return dupes
}

// submit
async function submitImportData() {
    const chunkSize = 1000

    for (let i = 0; i < excelData.value.length; i += chunkSize) {
        const chunk = excelData.value.slice(i, i + chunkSize)

        const payload: Record<string, any> = {}
        let collection: Record<string, any> = {}

        if (props.uploadTrick == 'indexed') {
            chunk.forEach((row, index) => {
                const cleanRow = { ...row }
                delete cleanRow.actions

                for (const key in cleanRow) {
                    payload[`${key}[${index}]`] = cleanRow[key]
                }
            })
            collection = formDataFormat({
                file: usedFile.value,
                ...payload

            })
        } else {
            chunk.forEach((row, index) => {
                delete row.actions
            })
            const data= {
                  file: usedFile.value,
                collection: { rows: chunk }  
            }
            
            if(i>1){ // send file once
                delete data.file
                
            }
            collection = formDataFormat(data)
        }

        const res = await fetchTableData({
            data: collection,
            saveData: false,
            props: {
                time: 0,
                ...props,
                reload: false,
                state: props.url + "import-data",
                url: createUrl(props.url, props.submitUrl ?? "import-data")
                // url: createUrl(props.url, "import-data")
            },
            Store
        })

        if (res?.payload?.failed?.length) {
            failedChunks.value = [
                ...failedChunks.value,
                ...res.payload.failed
            ]
        }
    }
}
</script>

<template>
    <div>
        <div class="p-3 max-w-6xl mx-auto h-[80vh] bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg">

            <h1 class="text-lg font-bold mb-4 text-center">
                Excel Upload Table {{ submit }}
            </h1>

            <div class="border-2 border-dashed border-gray-300 dark:border-gray-700 px-10 py-4 text-center rounded-2xl cursor-pointer transition-all
             hover:border-gray-400 hover:bg-nfuko-primary/10 dark:hover:bg-gray-800 mb-8" @dragover.prevent
                @drop.prevent="handleDrop" @click="triggerFileInput">
                <Upload size="15"
                    class="mx-auto mb-3 w-12 h-8 text-nfuko-primary dark:text-blue-400 dark:text-blue-300" />
                <p class="text-gray-600 dark:text-gray-400 text-lg font-medium">
                    Drag & drop your Excel file here <br />
                    <span class="text-sm text-gray-400 dark:text-gray-500">(or click to select)</span>
                </p>
                <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" accept=".xlsx, .xls" />
            </div>

            <div v-if="duplicates.length"
                class="mb-4 border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">

                <!-- Header -->
                <div class="flex items-center justify-between bg-red-100 dark:bg-red-900/40 px-4 py-3 cursor-pointer"
                    @click="showDuplicateList = !showDuplicateList">
                    <div class="text-red-700 dark:text-red-300 font-medium">
                        Found {{ duplicates.length }} duplicate row(s)
                    </div>

                    <div class="text-red-600 dark:text-red-300 text-sm">
                        {{ showDuplicateList ? 'Hide' : 'Show' }}
                    </div>
                </div>

                <!-- Content -->
                <div v-if="showDuplicateList" class="bg-white dark:bg-gray-900 p-3 max-h-60 overflow-auto">
                    <Table :dataFilter="duplicates" :columns="excelColumns" :handleAction="handleAction"
                        :action_config="ACTION_CONFIG" />
                </div>
            </div>

            <div class="bg-white rounded shadow overflow-auto h-[46vh]">
                <failedUploads :data="failedChunks" v-if="Store?.['import-data']" />

                <Table :rowClass="(row) => row.isDuplicate ? 'bg-red-100 dark:bg-red-900/40' : ''"
                    :dataFilter="paginatedData" :columns="excelColumns" :handleAction="handleAction"
                    :action_config="ACTION_CONFIG" />


            </div>

            <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white dark:bg-gray-900">

                <div class="text-sm text-gray-600 dark:text-gray-400">
                    Page <span class="font-semibold text-gray-800 dark:text-gray-200">{{ currentPage }}</span>
                    of
                    <span class="font-semibold text-gray-800 dark:text-gray-200">{{ totalPages }}</span>
                </div>

                <div class="flex items-center gap-2">

                    <button type="button" @click="currentPage--" :disabled="currentPage === 1" class="px-3 py-1.5 text-sm rounded-lg border transition
                   bg-white dark:bg-gray-800
                   border-gray-300 dark:border-gray-700
                   hover:bg-gray-100 dark:hover:bg-gray-700
                   disabled:opacity-40 disabled:cursor-not-allowed">
                        ← Prev
                    </button>

                    <div class="flex items-center gap-1">
                        <button type="button" v-for="page in totalPages" :key="page" @click="currentPage = page"
                            class="px-3 py-1.5 text-sm rounded-lg transition" :class="[
                                page === currentPage
                                    ? 'bg-emerald-600 text-white shadow'
                                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                            ]">
                            {{ page }}
                        </button>
                    </div>

                    <button type="button" @click="currentPage++" :disabled="currentPage === totalPages" class="px-3 py-1.5 text-sm rounded-lg border transition
                   bg-white dark:bg-gray-800
                   border-gray-300 dark:border-gray-700
                   hover:bg-gray-100 dark:hover:bg-gray-700
                   disabled:opacity-40 disabled:cursor-not-allowed">
                        Next →
                    </button>

                </div>
            </div>
        </div>

        <SheetFooter
            class="p-2 z-50  sticky bottom-0 border-0 border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">

            <div class="flex w-full gap-3 items-center justify-between">
                <div>
                    <Button variant="outline" disabled
                        class="flex-1 h-11 w-full  font-bold border-neutral-200 dark:border-neutral-800">
                        Close
                    </Button>
                </div>
                <div>
                    <Button type="button" @click="submitImportData"
                        class="flex-1 h-11  w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors">
                        <span type="button"> Save</span>
                    </Button>
                </div>
            </div>

        </SheetFooter>
    </div>
</template>