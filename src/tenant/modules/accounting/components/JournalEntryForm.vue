<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Drawer, formatMoneyValue } from '@/Global'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { List, Paperclip, Plus, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { journalEntriesApi } from '@/tenant/apis/journalEntries/journalEntriesApi'
import { chartOfAccountsApi } from '@/tenant/apis/chartOfAccounts/chartOfAccountsApi'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits(['update:open', 'saved'])

interface JournalLine {
  id: string
  chart_of_account_id: string | number | null
  description: string
  cost_centre: string
  debit_amount: number | ''
  credit_amount: number | ''
}

const today = new Date().toISOString().split('T')[0]
const form = ref({
  entry_date: today,
  period: today.slice(0, 7),
  entry_type: 'ADJUSTING',
  currency: 'UGX',
  reference: '',
  description: '',
})

const lines = ref<JournalLine[]>([])
const loading = ref(false)
const submitMode = ref<'draft' | 'posted'>('posted')
const errors = ref<Record<string, string[]>>({})
const accounts = ref<Array<{ id: number; name: string }>>([])

const entryTypes = [
  { value: 'ADJUSTING', label: 'Adjusting' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'OPENING', label: 'Opening' },
  { value: 'CLOSING', label: 'Closing' },
  { value: 'REVERSAL', label: 'Reversal' },
]

const currencies = [
  { value: 'UGX', label: 'UGX - Ugandan Shilling' },
  { value: 'USD', label: 'USD - US Dollar' },
]

const costCentres = ['Finance', 'Operations', 'Administration', 'Branch']

const periodOptions = computed(() => {
  const base = new Date(`${form.value.entry_date || today}T00:00:00`)
  return [-1, 0, 1].map(offset => {
    const date = new Date(base.getFullYear(), base.getMonth() + offset, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return {
      value,
      label: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    }
  })
})

const totalDebit = computed(() => lines.value.reduce((sum, line) => sum + (Number(line.debit_amount) || 0), 0))
const totalCredit = computed(() => lines.value.reduce((sum, line) => sum + (Number(line.credit_amount) || 0), 0))
const inBalance = computed(() => totalDebit.value > 0 && Math.abs(totalDebit.value - totalCredit.value) < 0.01)
const entryNoPreview = computed(() => `JE-${new Date(form.value.entry_date || today).getFullYear()}-...`)

watch(() => form.value.entry_date, value => {
  if (value) form.value.period = value.slice(0, 7)
})

watch(() => props.open, async isOpen => {
  if (!isOpen) return
  resetForm()
  await fetchAccounts()
})

async function fetchAccounts() {
  if (accounts.value.length > 0) return
  try {
    const res = await chartOfAccountsApi.list({ list: 1 } as any)
    const all = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
    accounts.value = all
      .filter((account: any) => account.is_active && account.is_postable && account.allow_manual)
      .map((account: any) => ({ id: account.id, name: `${account.gl_code} - ${account.name}` }))
  } catch {
    toast.error('Failed to load chart of accounts.')
  }
}

function resetForm() {
  form.value = {
    entry_date: today,
    period: today.slice(0, 7),
    entry_type: 'ADJUSTING',
    currency: 'UGX',
    reference: '',
    description: '',
  }
  lines.value = [createEmptyLine(), createEmptyLine()]
  errors.value = {}
}

function createEmptyLine(): JournalLine {
  return {
    id: Math.random().toString(36).slice(2),
    chart_of_account_id: '',
    description: '',
    cost_centre: 'Finance',
    debit_amount: '',
    credit_amount: '',
  }
}

function addLine() {
  lines.value.push(createEmptyLine())
}

function removeLine(index: number) {
  if (lines.value.length <= 2) {
    toast.error('A journal entry must have at least 2 lines.')
    return
  }
  lines.value.splice(index, 1)
}

function handleAmountChange(index: number, type: 'debit' | 'credit') {
  const line = lines.value[index]
  if (type === 'debit' && Number(line.debit_amount) > 0) line.credit_amount = ''
  if (type === 'credit' && Number(line.credit_amount) > 0) line.debit_amount = ''
}

function populatedLines() {
  return lines.value.filter(line =>
    String(line.chart_of_account_id || '') !== '' ||
    Number(line.debit_amount) > 0 ||
    Number(line.credit_amount) > 0 ||
    line.description.trim() !== '',
  )
}

function validateClient(mode: 'draft' | 'posted') {
  const validLines = populatedLines()

  if (!form.value.description.trim()) {
    toast.error('Enter a description or memo.')
    return false
  }

  if (validLines.length < 2) {
    toast.error('A journal entry must have at least two populated lines.')
    return false
  }

  const hasInvalidLine = validLines.some(line =>
    !line.chart_of_account_id ||
    (Number(line.debit_amount) <= 0 && Number(line.credit_amount) <= 0) ||
    (Number(line.debit_amount) > 0 && Number(line.credit_amount) > 0),
  )

  if (hasInvalidLine) {
    toast.error('Each line needs an account and either a debit or a credit.')
    return false
  }

  if (mode === 'posted' && !inBalance.value) {
    toast.error('Journal entry is out of balance.')
    return false
  }

  return true
}

async function submit(status: 'draft' | 'posted') {
  if (!validateClient(status)) return

  submitMode.value = status
  loading.value = true
  errors.value = {}

  try {
    await journalEntriesApi.store({
      ...form.value,
      status,
      lines: populatedLines().map(line => ({
        chart_of_account_id: line.chart_of_account_id,
        description: line.description,
        cost_centre: line.cost_centre,
        debit_amount: Number(line.debit_amount) || 0,
        credit_amount: Number(line.credit_amount) || 0,
      })),
    })

    toast.success(status === 'posted' ? 'Journal entry posted successfully.' : 'Journal draft saved successfully.')
    emit('saved')
    emit('update:open', false)
  } catch (error: any) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    }
    toast.error(error.response?.data?.message || 'Failed to save journal entry.')
  } finally {
    loading.value = false
  }
}

function fmt(amount: number) {
  return formatMoneyValue(amount)
}
</script>

<template>
  <Drawer
    :open="open"
    @update:open="emit('update:open', $event)"
    title="New journal entry"
    width="w-full max-w-6xl"
  >
    <template #body>
      <div class="flex flex-col gap-7">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <h2 class="text-2xl font-bold text-neutral-950 dark:text-white">New journal entry</h2>
            <span class="rounded-full bg-amber-50 px-4 py-1 text-sm font-bold tracking-wide text-amber-800">DRAFT</span>
          </div>
          <span class="font-mono text-lg font-semibold text-neutral-500">{{ entryNoPreview }}</span>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Entry date</span>
            <input v-model="form.entry_date" type="date" class="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
            <span v-if="errors.entry_date" class="text-xs text-red-500">{{ errors.entry_date[0] }}</span>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Period</span>
            <select v-model="form.period" class="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
              <option v-for="period in periodOptions" :key="period.value" :value="period.value">{{ period.label }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Entry type</span>
            <select v-model="form.entry_type" class="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
              <option v-for="type in entryTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Currency</span>
            <select v-model="form.currency" class="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
              <option v-for="currency in currencies" :key="currency.value" :value="currency.value">{{ currency.label }}</option>
            </select>
          </label>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Description / memo</span>
          <textarea v-model="form.description" rows="3" placeholder="Describe the purpose of this entry..." class="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
          <span v-if="errors.description" class="text-xs text-red-500">{{ errors.description[0] }}</span>
        </label>

        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <List class="h-4 w-4 text-neutral-500" />
            <h3 class="text-sm font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">Entry Lines</h3>
          </div>

          <div class="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <table class="w-full min-w-[980px] text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-600">Account</th>
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-600">Description</th>
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-600">Cost Centre</th>
                  <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-600">Debit</th>
                  <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-600">Credit</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr v-for="(line, index) in lines" :key="line.id">
                  <td class="px-4 py-3">
                    <SearchableSelect v-model="line.chart_of_account_id" :options="accounts" placeholder="Select account" />
                  </td>
                  <td class="px-4 py-3">
                    <input v-model="line.description" type="text" placeholder="Line memo" class="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" />
                  </td>
                  <td class="px-4 py-3">
                    <select v-model="line.cost_centre" class="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-950 dark:text-white">
                      <option v-for="centre in costCentres" :key="centre" :value="centre">{{ centre }}</option>
                    </select>
                  </td>
                  <td class="px-4 py-3">
                    <input v-model="line.debit_amount" type="number" min="0" step="0.01" placeholder="0.00" @input="handleAmountChange(index, 'debit')" class="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-right font-mono text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" />
                  </td>
                  <td class="px-4 py-3">
                    <input v-model="line.credit_amount" type="number" min="0" step="0.01" placeholder="0.00" @input="handleAmountChange(index, 'credit')" class="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-right font-mono text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-950 dark:text-white" />
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button type="button" @click="removeLine(index)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:border-neutral-700">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <button type="button" @click="addLine" class="flex w-full items-center gap-2 border-t border-neutral-200 px-5 py-4 text-left text-sm font-semibold text-neutral-800 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800/50">
              <Plus class="h-4 w-4" />
              Add line
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">Balance Check</span>
            <span class="rounded-full px-3 py-1 text-xs font-bold" :class="inBalance ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
              {{ inBalance ? 'Balanced' : 'Out of balance' }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-6 text-right">
            <div>
              <p class="text-xs font-semibold text-neutral-500">Total debits</p>
              <p class="font-mono text-xl font-bold text-neutral-950 dark:text-white">{{ fmt(totalDebit) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-neutral-500">Total credits</p>
              <p class="font-mono text-xl font-bold text-neutral-950 dark:text-white">{{ fmt(totalCredit) }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 rounded-xl border border-dashed border-neutral-300 px-5 py-5 text-sm font-semibold text-neutral-500 dark:border-neutral-700">
          <Paperclip class="h-5 w-5" />
          Attach supporting documents (invoices, receipts, approvals)
        </div>
      </div>
    </template>

    <template #actions>
      <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" @click="emit('update:open', false)" class="rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-sm font-bold text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
          Discard
        </button>
        <button type="button" @click="submit('draft')" :disabled="loading" class="rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-sm font-bold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
          {{ loading && submitMode === 'draft' ? 'Saving...' : 'Save draft' }}
        </button>
        <button type="button" @click="submit('posted')" :disabled="loading || !inBalance" class="rounded-lg bg-nfuko-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-nfuko-primary/90 disabled:opacity-50">
          {{ loading && submitMode === 'posted' ? 'Posting...' : 'Post entry' }}
        </button>
      </div>
    </template>
  </Drawer>
</template>
