<template>
    <div>
        <div class="p-3 max-w-6xl mx-auto h-[80vh]   bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg">
            <h1 class="text-lg font-extrabold mb-4 text-gray-800 dark:text-gray-100 text-center">
                Excel Upload Table {{ submit }}
            </h1>
            <div class="border-2 border-dashed border-gray-300 dark:border-gray-700 p-10 text-center rounded-2xl cursor-pointer transition-all
             hover:border-gray-400 hover:bg-nfuko-primary/10 dark:hover:bg-gray-800 mb-8" @dragover.prevent
                @drop.prevent="handleDrop" @click="triggerFileInput">
                <Upload size="15"
                    class="mx-auto mb-3 w-12 h-12 text-nfuko-primary dark:text-blue-400 dark:text-blue-300" />
                <p class="text-gray-600 dark:text-gray-400 text-lg font-medium">
                    Drag & drop your Excel file here <br />
                    <span class="text-sm text-gray-400 dark:text-gray-500">(or click to select)</span>
                </p>
                <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" accept=".xlsx, .xls" />
            </div>
            <div v-if="duplicates.length" class="mb-4 p-4 bg-red-100 dark:bg-red-800 text-red-700 rounded-lg">
                Found {{ duplicates.length }} duplicated row(s) by <strong>{{ duplicateKey }}</strong>.
            </div>


            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-x-auto h-[47vh]">
                <failedUploads :data="failedChunks"  v-if="Store?.['import-data']"/>
                <Table v-if="excelData.length && excelColumns.length" :dataFilter="excelData" :columns="excelColumns"
                    :data="{}" :handleAction="handleAction" :action_config="ACTION_CONFIG" />
                <div v-else class="py-16 text-center text-gray-400 dark:text-gray-500 text-lg">
                    No data loaded. Upload an Excel file to get started.
                </div>
            </div>
        </div>

        <SheetFooter
            class="p-2 z-50 sticky bottom-0 border-0 border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">

            <div class="flex w-full gap-3 items-center justify-between">
                <div>
                    <Button variant="outline" disabled
                        class="flex-1 h-11 w-full  font-bold border-neutral-200 dark:border-neutral-800">
                        Close
                    </Button>
                </div>

                <div>
                    <!-- @click="handleSave" -->
                    <Button type="button" @click="submitImportData"
                        class="flex-1 h-11  w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors">
                        <span type="button"> Save</span>

                    </Button>
                </div>
            </div>

        </SheetFooter>
    </div>
</template>

<style scoped>
div[draggable] {
    transition: all 0.2s ease;
}

div[draggable]:hover {
    transform: translateY(-2px);
}

.table-auto th,
.table-auto td {
    transition: background 0.2s ease;
}

.table-auto tr:hover {
    background-color: rgba(10, 163, 127, 0.05);
}
</style>

<script setup lang="ts">
import { ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import Table from '../landingLayout/Components/Table.vue'
import { Upload } from 'lucide-vue-next'
import { ACTION_CONFIG, fetchTableData } from '../landingLayout/util'
const duplicateKey = ref<string>('')
const emits = defineEmits(['row-click', 'action-click', 'update:data',])
const fileInput = ref<HTMLInputElement | null>(null)
const duplicates = ref<any[][]>([])
const excelColumns = ref<any[]>([])
const formData = ref<any[]>([])
const excelData = ref<any[]>([])
import { pomPinia } from 'septor-store';
import SheetFooter from '../ui/sheet/SheetFooter.vue'
import { createUrl } from '../Helpers'
import { failedUploads } from '.'
const Store = pomPinia();

const chunkSize = 5000 // e.g., 5000 rows per chunk
const excelChunks = ref<any[]>([])
const failedChunks = ref<any[]>([])
const props = defineProps({
    duplicatedBy: {
        type: Array as () => string[],
        required: true,
        default: () => [],
    },
    url: {
        type: String,
        required: true,
    },
    submit: {

        required: true,
    }

})
// Mock action & config
function handleAction(item: any, action: string) {
    if (action === 'delete') {
        const iremove = Number(item.index)
        excelData.value = excelData.value.filter((row: any) => row.index !== iremove)
    } else if (action === 'edit') {
        // handle edit action

    }
}


// Trigger file input
function triggerFileInput() {
    fileInput.value?.click()
}

// Handle file selection
function handleFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) readExcel(file)
}

// Handle drag & drop
function handleDrop(event: DragEvent) {
 
    const file = event.dataTransfer?.files?.[0]
    if (file) readExcel(file)
}


function readExcel(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Convert all rows including proper date formatting
        const allRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false, // <-- converts Excel dates to strings automatically
            dateNF: 'yyyy-mm-dd' // optional: format dates consistently
        })

        const headers = allRows[0]
        const dataRows = allRows.slice(1)

        // Generate column definitions
        excelColumns.value = headers.map((header: string) => ({
            key: header.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            label: header,
            name: header,
            width: 'fit-content',
        }))

        // Chunk data for performance
        excelChunks.value = []
        for (let i = 0; i < dataRows.length; i += chunkSize) {
            const chunk = dataRows.slice(i, i + chunkSize).map((row: any[]) => {
                const obj: any = {}
                headers.forEach((header: string, colIndex: number) => {
                    const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_')
                    obj[key] = row[colIndex] ?? null
                })
                obj.actions = []
                return obj
            })
            excelChunks.value.push(chunk)
        }
        excelData.value = excelChunks.value[0]
    }
    reader.readAsArrayBuffer(file)
}

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



async function submitImportData() {
    const groupedPayload: any[] = []

    // console.log(excelData.value);
    for (let i = 0; i < excelData.value.length; i += 100) { // let chunk size be 100 for example 
        const chunk = excelData.value.slice(i, i + 10)

        const collectFields: Record<string, any> = {}
        chunk.forEach((row: any, index: number) => {
            const cleanRow = { ...row }
            delete cleanRow.actions
            for (const key in cleanRow) {
                collectFields[`${key}[${index}]`] = cleanRow[key]
            }
        });
        groupedPayload.push(collectFields)
    }
    for (const data of groupedPayload) {
      const res=  await fetchTableData({
            data,
            saveData: false,
            props: {
                time:3,
                ...props,
                reload: false,// dont refectch data 
                state: props.url + "import-data",
                url: createUrl(props.url, "import-data")
            }, Store
        });
        if (res?.payload?.failed?.length) {
            console.log(res.payload.failed);
            
            failedChunks.values=[...failedChunks.value,...res.payload.failed]
        }
    }
}


</script> my value dont matchj the heraders y