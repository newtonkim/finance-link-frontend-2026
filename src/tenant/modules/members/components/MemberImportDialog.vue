<script setup lang="ts">
import { ref, computed } from 'vue'
import { Upload, Download, AlertCircle, CheckCircle2, Trash2, X } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Spinner } from '@/Global'
import { membersApi } from '@/tenant/apis/members/membersApi'
import * as XLSX from 'xlsx'

export interface ImportRow {
  name: string; phone: string; gender: string; marital_status: string
  nationality: string; address: string; email: string; dob: string
  other_contact: string; initial_deposit: string; date_joined: string
  savings_balance: string; shares_quantity: string; account_number: string; employee_number: string
}

const PREVIEW_COLS: { key: keyof ImportRow; label: string; required: boolean; width: string }[] = [
  { key: 'name',            label: 'Name',            required: true,  width: 'min-w-[130px]' },
  { key: 'phone',           label: 'Phone',           required: true,  width: 'min-w-[110px]' },
  { key: 'gender',          label: 'Gender',          required: true,  width: 'min-w-[105px]' },
  { key: 'marital_status',  label: 'Marital Status',  required: true,  width: 'min-w-[130px]' },
  { key: 'address',         label: 'Address',         required: true,  width: 'min-w-[150px]' },
  { key: 'nationality',     label: 'Nationality',     required: false, width: 'min-w-[100px]' },
  { key: 'email',           label: 'Email',           required: false, width: 'min-w-[150px]' },
  { key: 'dob',             label: 'Date of Birth',   required: false, width: 'min-w-[110px]' },
  { key: 'other_contact',   label: 'Other Contact',   required: false, width: 'min-w-[110px]' },
  { key: 'initial_deposit', label: 'Initial Deposit', required: false, width: 'min-w-[110px]' },
  { key: 'date_joined',     label: 'Date Joined',     required: false, width: 'min-w-[110px]' },
  { key: 'savings_balance', label: 'Savings Balance', required: false, width: 'min-w-[115px]' },
  { key: 'shares_quantity', label: 'Shares Qty',      required: false, width: 'min-w-[90px]'  },
  { key: 'account_number',  label: 'Account No.',     required: false, width: 'min-w-[110px]' },
  { key: 'employee_number', label: 'Employee No.',    required: false, width: 'min-w-[110px]' },
]

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ imported: [] }>()

const step = ref<'upload' | 'preview'>('upload')
const importFile = ref<File | null>(null)
const previewRows = ref<ImportRow[]>([])
const parseError = ref<string | null>(null)
const importLoading = ref(false)
const templateLoading = ref(false)
const importResult = ref<{ imported: number; errors: string[] } | null>(null)

const errorRowCount = computed(() => previewRows.value.filter(rowHasError).length)

function rowHasError(row: ImportRow) {
  return !row.name || !row.phone || !row.gender || !row.marital_status || !row.address
}

function formatCellDate(val: unknown): string {
  if (!val && val !== 0) return ''
  if (val instanceof Date) {
    return `${val.getFullYear()}-${String(val.getMonth() + 1).padStart(2, '0')}-${String(val.getDate()).padStart(2, '0')}`
  }
  return String(val).trim()
}

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  if (!file) return
  importFile.value = file
  parseError.value = null
  importResult.value = null
  await parseFile(file)
}

async function parseFile(file: File) {
  try {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]!]
    if (!ws) { parseError.value = 'Could not read sheet from file.'; return }
    const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    let dataStart = 0
    for (let i = 0; i < Math.min(raw.length, 5); i++) {
      const cell = String(raw[i]?.[0] ?? '').trim().toLowerCase()
      if (cell === 'name' || cell === 'name *' || cell === 'full name') { dataStart = i + 1; break }
    }

    const dataRows = raw.slice(dataStart).filter(r => String(r[0] ?? '').trim() !== '')
    if (dataRows.length === 0) { parseError.value = 'No data rows found.'; return }

    previewRows.value = dataRows.map(r => ({
      name: String(r[0] ?? '').trim(), phone: String(r[1] ?? '').trim(),
      gender: String(r[2] ?? '').trim().toLowerCase(),
      marital_status: String(r[3] ?? '').trim().toLowerCase(),
      nationality: String(r[4] ?? '').trim() || 'Uganda',
      address: String(r[5] ?? '').trim(), email: String(r[6] ?? '').trim(),
      dob: formatCellDate(r[7]), other_contact: String(r[8] ?? '').trim(),
      initial_deposit: String(r[9] ?? '').trim(), date_joined: formatCellDate(r[10]),
      savings_balance: String(r[11] ?? '').trim(), shares_quantity: String(r[12] ?? '').trim(),
      account_number: String(r[13] ?? '').trim(), employee_number: String(r[14] ?? '').trim(),
    }))
    step.value = 'preview'
  } catch (err: unknown) {
    parseError.value = `Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}

async function downloadTemplate() {
  if (templateLoading.value) return
  templateLoading.value = true
  try {
    const res = await membersApi.downloadTemplate()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([res.data]))
    link.download = 'members-import-template.xlsx'
    document.body.appendChild(link); link.click(); link.remove()
  } finally {
    templateLoading.value = false
  }
}

async function submitImport() {
  if (importLoading.value || previewRows.value.length === 0) return
  importLoading.value = true
  importResult.value = null
  try {
    const res = await membersApi.importJson(previewRows.value)
    importResult.value = { imported: res.data.imported, errors: res.data.errors ?? [] }
    if (res.data.imported > 0) emit('imported')
  } finally {
    importLoading.value = false
  }
}

function resetToUpload() {
  step.value = 'upload'; importFile.value = null
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent :class="step === 'preview' ? 'w-[95vw] max-w-none' : 'max-w-md'">
      <DialogHeader>
        <DialogTitle>{{ step === 'preview' ? 'Preview & Edit Import Data' : 'Import Members' }}</DialogTitle>
      </DialogHeader>

      <!-- Upload step -->
      <template v-if="step === 'upload'">
        <div class="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
          <p class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">Step 1 — Download the Excel template</p>
          <button :disabled="templateLoading" @click="downloadTemplate"
            class="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
            <Download class="h-4 w-4" />
            {{ templateLoading ? 'Downloading…' : 'Download Template' }}
          </button>
          <p class="mt-2 text-xs text-neutral-400">Fill in your member data then select the file below.</p>
        </div>

        <div class="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
          <p class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">Step 2 — Select your completed file to preview &amp; verify</p>
          <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-600 hover:border-nfuko-primary/60 hover:text-nfuko-primary transition-colors dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
            <Upload class="h-5 w-5 shrink-0" />
            <span class="truncate">{{ importFile ? importFile.name : 'Choose .xlsx, .xls or .csv file…' }}</span>
            <input type="file" accept=".xlsx,.xls,.csv" class="sr-only" @change="onFileChange" />
          </label>
          <p v-if="parseError" class="mt-2 flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle class="h-3.5 w-3.5 shrink-0" />{{ parseError }}
          </p>
          <p v-else class="mt-2 text-xs text-neutral-400">The file will open in a preview table where you can edit or delete rows before importing.</p>
        </div>

        <DialogFooter class="flex justify-end gap-2 pt-2">
          <Button variant="outline" @click="open = false"><X class="mr-1.5 h-4 w-4" />Close</Button>
        </DialogFooter>
      </template>

      <!-- Preview step -->
      <template v-else>
        <div class="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-2.5 dark:bg-neutral-800/60">
          <div class="flex items-center gap-2.5 text-sm">
            <span class="font-semibold text-neutral-900 dark:text-white">{{ previewRows.length }}</span>
            <span class="text-neutral-500">rows loaded</span>
            <span v-if="errorRowCount > 0"
              class="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle class="h-3 w-3" />{{ errorRowCount }} incomplete
            </span>
            <span v-else class="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle2 class="h-3 w-3" />All rows valid
            </span>
          </div>
          <button @click="resetToUpload" class="text-xs font-medium text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300">← Change file</button>
        </div>

        <div class="max-h-[55vh] overflow-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
          <table class="w-full border-collapse text-xs">
            <thead class="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-800">
              <tr>
                <th class="border-b border-neutral-200 px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-700">#</th>
                <th v-for="col in PREVIEW_COLS" :key="col.key"
                  class="border-b border-neutral-200 px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap dark:border-neutral-700"
                  :class="col.required ? 'text-neutral-600 dark:text-neutral-300' : 'text-neutral-400'">
                  {{ col.label }}<span v-if="col.required" class="ml-0.5 text-red-500">*</span>
                </th>
                <th class="border-b border-neutral-200 px-2 py-2.5 dark:border-neutral-700"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in previewRows" :key="i"
                :class="rowHasError(row) ? 'bg-red-50/70 dark:bg-red-900/10' : i % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50/40 dark:bg-neutral-800/20'">
                <td class="border-b border-neutral-100 px-2 py-1 text-neutral-400 dark:border-neutral-800">{{ i + 1 }}</td>
                <td v-for="col in PREVIEW_COLS" :key="col.key" class="border-b border-neutral-100 px-1 py-1 dark:border-neutral-800" :class="col.width">
                  <select v-if="col.key === 'gender'" v-model="row[col.key]"
                    :class="['w-full rounded border bg-transparent px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-nfuko-primary/50', !row.gender ? 'border-red-400 bg-red-50/50 dark:bg-red-900/10' : 'border-neutral-200 dark:border-neutral-700']">
                    <option value="">— select —</option><option>male</option><option>female</option><option>other</option>
                  </select>
                  <select v-else-if="col.key === 'marital_status'" v-model="row[col.key]"
                    :class="['w-full rounded border bg-transparent px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-nfuko-primary/50', !row.marital_status ? 'border-red-400 bg-red-50/50 dark:bg-red-900/10' : 'border-neutral-200 dark:border-neutral-700']">
                    <option value="">— select —</option><option>single</option><option>married</option><option>divorced</option><option>widowed</option>
                  </select>
                  <input v-else v-model="row[col.key]"
                    :class="['w-full rounded border bg-transparent px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-nfuko-primary/50', col.required && !row[col.key] ? 'border-red-400 bg-red-50/50 dark:bg-red-900/10' : 'border-neutral-200 dark:border-neutral-700']" />
                </td>
                <td class="border-b border-neutral-100 px-1 py-1 dark:border-neutral-800">
                  <button @click="previewRows.splice(i, 1)" class="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20">
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="previewRows.length === 0" class="py-10 text-center text-sm text-neutral-400">All rows have been removed.</div>
        </div>

        <div v-if="importResult" class="space-y-2">
          <div v-if="importResult.imported > 0"
            class="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 class="h-4 w-4 shrink-0" />{{ importResult.imported }} member(s) imported successfully.
          </div>
          <div v-if="importResult.errors.length"
            class="rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 dark:border-red-900/30 dark:bg-red-900/10">
            <div class="mb-1 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
              <AlertCircle class="h-4 w-4 shrink-0" />{{ importResult.errors.length }} row(s) had errors:
            </div>
            <ul class="ml-6 max-h-32 list-disc overflow-y-auto space-y-0.5 text-xs text-red-600 dark:text-red-400">
              <li v-for="err in importResult.errors" :key="err">{{ err }}</li>
            </ul>
          </div>
        </div>

        <DialogFooter class="flex justify-end gap-2 pt-2">
          <Button variant="outline" @click="resetToUpload">← Back</Button>
          <Button :disabled="previewRows.length === 0 || importLoading"
            class="bg-nfuko-primary text-white hover:bg-nfuko-primary/90 disabled:opacity-60"
            @click="submitImport">
            <Spinner v-if="importLoading" class="mr-2" />
            {{ importLoading ? 'Importing…' : `Import ${previewRows.length} row(s)` }}
          </Button>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>
