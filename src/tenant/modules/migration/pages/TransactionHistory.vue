<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { Button, Spinner } from '@/Global'
import { migrationApi, type MigrationImportResult } from '../apis/migrationApi'
import TemplateDownloadCard from '../components/TemplateDownloadCard.vue'
import MigrationFileStep from '../components/MigrationFileStep.vue'
import MigrationResultPanel from '../components/MigrationResultPanel.vue'
import PreviewTableTransactions, { type TxRow } from '../components/PreviewTableTransactions.vue'

const router = useRouter()

const step       = ref<'upload' | 'preview'>('upload')
const file       = ref<File | null>(null)
const rows       = ref<TxRow[]>([])
const parseError = ref<string | null>(null)
const loading    = ref(false)
const result     = ref<MigrationImportResult | null>(null)

const errorCount = computed(() =>
  rows.value.filter(r => !r.member_number || !r.account_number || !r.type || !r.amount || !r.transaction_date).length
)

function formatDate(val: unknown): string {
  if (val instanceof Date) {
    return `${val.getFullYear()}-${String(val.getMonth()+1).padStart(2,'0')}-${String(val.getDate()).padStart(2,'0')}`
  }
  return String(val ?? '').trim()
}

async function onFileSelected(f: File) {
  file.value = f
  parseError.value = null
  result.value = null
  try {
    const buffer = await f.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]!]
    if (!ws) { parseError.value = 'Could not read sheet.'; return }
    const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    let start = 0
    for (let i = 0; i < Math.min(raw.length, 5); i++) {
      const cell = String(raw[i]?.[0] ?? '').trim().toLowerCase()
      if (cell === 'member number *' || cell === 'member number' || cell === 'member_number') { start = i + 1; break }
    }

    rows.value = raw.slice(start)
      .filter(r => String(r[0] ?? '').trim() !== '')
      .map(r => ({
        member_number:    String(r[0] ?? '').trim(),
        account_number:   String(r[1] ?? '').trim(),
        type:             String(r[2] ?? '').trim().toLowerCase(),
        amount:           String(r[3] ?? '').trim(),
        transaction_date: formatDate(r[4]),
        narration:        String(r[5] ?? '').trim(),
        payment_mode:     String(r[6] ?? '').trim().toLowerCase() || 'cash',
        reference:        String(r[7] ?? '').trim(),
      }))

    if (rows.value.length === 0) { parseError.value = 'No data rows found in file.'; return }
    step.value = 'preview'
  } catch (e: unknown) {
    parseError.value = `Failed to parse: ${e instanceof Error ? e.message : 'Unknown error'}`
  }
}

async function submit() {
  if (loading.value || rows.value.length === 0) return
  loading.value = true
  result.value = null
  try {
    const res = await migrationApi.importTransactionHistoryJson(rows.value as unknown as Record<string, string>[])
    result.value = res.data
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-5 p-6 max-w-6xl">
    <div class="flex items-center gap-3">
      <button @click="router.push('/tenant/migration')" class="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">← Migration Hub</button>
      <span class="text-neutral-300 dark:text-neutral-700">/</span>
      <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Transaction History Import</h1>
    </div>

    <div class="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400">
      Transactions are sorted by date before processing. The <strong>Running Balance</strong> column lets you verify no account goes negative.
    </div>

    <!-- Upload step -->
    <template v-if="step === 'upload'">
      <TemplateDownloadCard
        title="Step 1 — Download the Transaction History template"
        from="transactions-template"
        description="Fill in member number, account, type (deposit/withdrawal), amount, and date for each transaction."
        filename="transaction-history-template.xlsx"
        :download-fn="migrationApi.downloadTransactionHistoryTemplate"
      />
      <MigrationFileStep :file="file" :parse-error="parseError" @change="onFileSelected" />
    </template>

    <!-- Preview step -->
    <template v-else>
      <div class="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-2.5 dark:bg-neutral-800/60">
        <div class="flex items-center gap-3 text-sm">
          <span class="font-semibold text-neutral-900 dark:text-white">{{ rows.length }} rows loaded</span>
          <span v-if="errorCount" class="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">{{ errorCount }} incomplete</span>
          <span v-else class="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">All rows valid</span>
        </div>
        <button @click="step = 'upload'; file = null" class="text-xs text-neutral-500 underline hover:text-neutral-700">← Change file</button>
      </div>

      <PreviewTableTransactions :rows="rows" @delete="rows.splice($event, 1)" />

      <MigrationResultPanel v-if="result" :imported="result.imported" :errors="result.errors" />

      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="step = 'upload'; file = null">← Back</Button>
        <Button :disabled="rows.length === 0 || loading"
          class="bg-nfuko-primary text-white hover:bg-nfuko-primary/90 disabled:opacity-60"
          @click="submit">
          <Spinner v-if="loading" class="mr-2" />
          {{ loading ? 'Importing…' : `Import ${rows.length} transaction(s)` }}
        </Button>
      </div>
    </template>
  </div>
</template>
