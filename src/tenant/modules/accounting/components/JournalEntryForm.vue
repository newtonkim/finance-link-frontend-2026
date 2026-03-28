<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Drawer } from '@/Global'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { journalEntriesApi } from '@/tenant/apis/journalEntries/journalEntriesApi'
import { chartOfAccountsApi } from '@/tenant/apis/chartOfAccounts/chartOfAccountsApi'
import { formatMoneyValue } from '@/Global'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits(['update:open', 'saved'])

interface JournalLine {
  id: string
  chart_of_account_id: string | number | null
  description: string
  debit_amount: number | ''
  credit_amount: number | ''
}

const form = ref({
  entry_date: new Date().toISOString().split('T')[0],
  reference: '',
  description: '',
})

const lines = ref<JournalLine[]>([])
const loading = ref(false)
const errors = ref<Record<string, string[]>>({})
const accounts = ref<any[]>([])

// Fetch Eligible Accounts
async function fetchAccounts() {
  if (accounts.value.length > 0) return
  try {
    const res = await chartOfAccountsApi.list({ list: 1 } as any)
    const all = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
    accounts.value = all
      .filter(a => a.is_postable && a.allow_manual)
      .map(a => ({ id: a.id, name: `${a.gl_code} - ${a.name}` }))
  } catch (e) {
    console.error('Failed to fetch accounts', e)
  }
}

// Reset form
function resetForm() {
  form.value = {
    entry_date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
  }
  lines.value = [
    createEmptyLine(),
    createEmptyLine()
  ]
  errors.value = {}
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    resetForm()
    await fetchAccounts()
  }
})

function createEmptyLine(): JournalLine {
  return {
    id: Math.random().toString(36).substring(7),
    chart_of_account_id: '',
    description: '',
    debit_amount: '',
    credit_amount: ''
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

// Enforce DR/CR exclusivity and auto-add rows
function handleAmountChange(index: number, type: 'debit' | 'credit') {
  const line = lines.value[index]
  if (type === 'debit' && Number(line.debit_amount) > 0) line.credit_amount = ''
  if (type === 'credit' && Number(line.credit_amount) > 0) line.debit_amount = ''
  
  // If editing the very last row, automatically add a new row to ensure there's always space
  if (index === lines.value.length - 1 && (Number(line.debit_amount) > 0 || Number(line.credit_amount) > 0 || String(line.chart_of_account_id) !== '')) {
    addLine()
  }
}

// Calculations
const totalDebit = computed(() => lines.value.reduce((sum, line) => sum + (Number(line.debit_amount) || 0), 0))
const totalCredit = computed(() => lines.value.reduce((sum, line) => sum + (Number(line.credit_amount) || 0), 0))
const inBalance = computed(() => totalDebit.value > 0 && Math.abs(totalDebit.value - totalCredit.value) < 0.01)

function formatMoney(amount: number) {
  return formatMoneyValue(amount)
}

async function handleSubmit() {
  // Clear empty lines from submission (lines with no account and no debits/credits)
  const validLines = lines.value.filter(l => String(l.chart_of_account_id) !== '' || Number(l.debit_amount) > 0 || Number(l.credit_amount) > 0)
  
  if (validLines.length < 2) {
    return toast.error('A journal entry must have at least two populated lines.')
  }
  if (!inBalance.value) {
    return toast.error('Journal entry is out of balance.')
  }

  loading.value = true
  errors.value = {}
  try {
    const payload = {
      ...form.value,
      lines: validLines.map(l => ({
        chart_of_account_id: l.chart_of_account_id,
        description: l.description,
        debit_amount: Number(l.debit_amount) || 0,
        credit_amount: Number(l.credit_amount) || 0
      }))
    }
    await journalEntriesApi.store(payload)
    toast.success('Journal Entry posted successfully.')
    emit('saved')
    emit('update:open', false)
  } catch (error: any) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    } else {
      toast.error(error.response?.data?.message || 'Failed to post journal entry.')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Drawer
    :open="open"
    @update:open="emit('update:open', $event)"
    title="Create Manual Journal Entry"
    width="w-full max-w-5xl"
    showFooter
    @submit="handleSubmit"
  >
    <template #body>
      <div class="flex flex-col gap-6">
        <!-- Header Info -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Entry Date <span class="text-red-500">*</span></label>
            <input
              v-model="form.entry_date"
              type="date"
              class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
            <span v-if="errors.entry_date" class="text-xs text-red-500">{{ errors.entry_date[0] }}</span>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Reference Number</label>
            <input
              v-model="form.reference"
              type="text"
              class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="e.g. INV-2023-01"
            />
            <span v-if="errors.reference" class="text-xs text-red-500">{{ errors.reference[0] }}</span>
          </div>
          
          <div class="flex flex-col gap-1.5 lg:col-span-3">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Description / Memo <span class="text-red-500">*</span></label>
            <input
              v-model="form.description"
              type="text"
              class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="Enter a description for this journal entry..."
            />
            <span v-if="errors.description" class="text-xs text-red-500">{{ errors.description[0] }}</span>
          </div>
        </div>

        <hr class="border-neutral-100 dark:border-neutral-800" />

        <!-- Lines Grid -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Journal Lines</h3>
            <button
              type="button"
              @click="addLine"
              class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Plus class="h-3.5 w-3.5" />
              Add Row
            </button>
          </div>

          <div class="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm dark:border-neutral-800">
            <table class="w-full min-w-[800px] text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/40">
                <tr>
                  <th class="px-4 py-2.5 text-left font-medium text-neutral-500 w-8">#</th>
                  <th class="px-4 py-2.5 text-left font-medium text-neutral-500 w-1/3">Account</th>
                  <th class="px-4 py-2.5 text-left font-medium text-neutral-500">Description</th>
                  <th class="px-4 py-2.5 text-right font-medium text-neutral-500 w-32">Debit (DR)</th>
                  <th class="px-4 py-2.5 text-right font-medium text-neutral-500 w-32">Credit (CR)</th>
                  <th class="px-4 py-2.5 text-center font-medium text-neutral-500 w-12"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                <tr v-for="(line, index) in lines" :key="line.id" class="group">
                  <td class="px-4 py-2 text-center text-xs text-neutral-400">{{ index + 1 }}</td>
                  <td class="px-4 py-2">
                    <SearchableSelect
                      v-model="line.chart_of_account_id"
                      :options="accounts"
                      placeholder="Select Account"
                      state="coa_select"
                      @update:modelValue="handleAmountChange(index, 'debit')"
                    />
                    <span v-if="errors[`lines.${index}.chart_of_account_id`]" class="block text-[10px] text-red-500 mt-1">Required</span>
                  </td>
                  <td class="px-4 py-2">
                    <input
                      v-model="line.description"
                      type="text"
                      placeholder="Optional memo..."
                      class="w-full rounded-md border-transparent bg-transparent px-2 py-1.5 text-sm hover:border-neutral-200 focus:border-nfuko-primary focus:bg-white focus:ring-0"
                    />
                  </td>
                  <td class="px-4 py-2">
                    <input
                      v-model="line.debit_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-full rounded-md border-transparent bg-transparent px-2 py-1.5 text-right text-sm font-mono hover:border-neutral-200 focus:border-nfuko-primary focus:bg-white focus:ring-0"
                      placeholder="0.00"
                      @input="handleAmountChange(index, 'debit')"
                    />
                    <span v-if="errors[`lines.${index}.debit_amount`]" class="block text-right text-[10px] text-red-500 mt-1">Invalid</span>
                  </td>
                  <td class="px-4 py-2">
                    <input
                      v-model="line.credit_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-full rounded-md border-transparent bg-transparent px-2 py-1.5 text-right text-sm font-mono hover:border-neutral-200 focus:border-nfuko-primary focus:bg-white focus:ring-0"
                      placeholder="0.00"
                      @input="handleAmountChange(index, 'credit')"
                    />
                    <span v-if="errors[`lines.${index}.credit_amount`]" class="block text-right text-[10px] text-red-500 mt-1">Invalid</span>
                  </td>
                  <td class="px-4 py-2 text-center text-red-500">
                    <button
                      type="button"
                      @click="removeLine(index)"
                      class="rounded p-1 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-neutral-50 dark:bg-neutral-800/40 font-semibold border-t-2 border-neutral-200">
                <tr>
                  <td colspan="3" class="px-4 py-3 text-right text-neutral-600">Totals:</td>
                  <td class="px-4 py-3 text-right font-mono text-neutral-900">{{ formatMoney(totalDebit) }}</td>
                  <td class="px-4 py-3 text-right font-mono text-neutral-900">{{ formatMoney(totalCredit) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Balance Status -->
          <div class="flex items-center justify-end gap-3 mt-2">
            <span class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Status:</span>
            <div
              class="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
              :class="inBalance ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
            >
              {{ inBalance ? 'IN BALANCE' : 'OUT OF BALANCE' }}
            </div>
            <div v-if="!inBalance && (totalDebit > 0 || totalCredit > 0)" class="text-xs font-mono font-medium text-red-500 ml-2">
              Diff: {{ formatMoney(Math.abs(totalDebit - totalCredit)) }}
            </div>
          </div>

        </div>
      </div>
    </template>
    
    <template #actions>
      <div class="flex w-full items-center justify-between gap-3">
        <button
          type="button"
          @click="emit('update:open', false)"
          class="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="!inBalance || loading"
          class="flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-50"
          :class="inBalance ? 'bg-green-600 hover:bg-green-700' : 'bg-neutral-400'"
        >
          {{ loading ? 'Posting...' : 'Post Journal Entry' }}
        </button>
      </div>
    </template>
  </Drawer>
</template>
