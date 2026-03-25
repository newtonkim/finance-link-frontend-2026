<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Drawer } from '@/Global'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { toast } from 'vue-sonner'
import { chartOfAccountsApi } from '@/tenant/apis/chartOfAccounts/chartOfAccountsApi'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits(['update:open', 'saved'])

// Form State
const form = ref({
  gl_code: '',
  name: '',
  account_type: 'ASSET',
  normal_balance: 'DR',
  parent_id: '' as string | number | null,
  is_control: false,
  is_postable: true,
  is_active: true,
  allow_manual: true,
  account_subtype: '',
  ifrs_category: '',
})

interface Account { id: number; gl_code: string; name: string; is_control?: boolean }
const parentAccounts = ref<Account[]>([])

const loading = ref(false)
const errors = ref<Record<string, string[]>>({})

// Reset form and fetch parents when opened
watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    form.value = {
      gl_code: '',
      name: '',
      account_type: 'ASSET',
      normal_balance: 'DR',
      parent_id: '',
      is_control: false,
      is_postable: true,
      is_active: true,
      allow_manual: true,
      account_subtype: '',
      ifrs_category: '',
    }
    errors.value = {}
    
    // Fetch all accounts for the parent dropdown
    try {
      const res = await chartOfAccountsApi.list({ list: 1 } as any)
      parentAccounts.value = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
      if (!form.value.gl_code) {
        form.value.gl_code = generateGlCode(form.value.account_type)
      }
    } catch (e) {
      console.error('Failed to load parent accounts')
    }
  }
})

function generateGlCode(type: string) {
  const prefixMap: Record<string, string> = { ASSET: '1', LIABILITY: '2', EQUITY: '3', INCOME: '4', EXPENSE: '5' }
  const prefix = prefixMap[type] || '1'
  const matching = parentAccounts.value
    .map(a => parseInt(a.gl_code))
    .filter(code => !isNaN(code) && String(code).startsWith(prefix))
  
  if (matching.length > 0) return String(Math.max(...matching) + 1)
  return prefix + '000'
}

watch(() => form.value.account_type, (newType) => {
  if (props.open && parentAccounts.value.length > 0) {
    form.value.gl_code = generateGlCode(newType)
  }
})

const parentOptions = computed(() => {
  return parentAccounts.value
    .filter(acc => !acc.is_control)
    .map(acc => ({
      id: acc.id,
      name: `${acc.gl_code} - ${acc.name}`
    }))
})

async function handleSubmit() {
  loading.value = true
  errors.value = {}
  try {
    const payload = { ...form.value }
    if (payload.parent_id === '') payload.parent_id = null
    await chartOfAccountsApi.store(payload)
    toast.success('Chart of Account created successfully')
    emit('saved')
    emit('update:open', false)
  } catch (error: any) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    } else {
      toast.error(error.response?.data?.message || 'Failed to create chart of account')
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
    title="Create Chart of Account"
    width="w-[500px]"
    showFooter
    @submit="handleSubmit"
  >
    <template #body>
      <div class="flex flex-col gap-5">
        <!-- Account Type & Name -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Account Type <span class="text-red-500">*</span></label>
            <select
              v-model="form.account_type"
              class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
              <option value="EQUITY">Equity</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
            <span v-if="errors.account_type" class="text-xs text-red-500">{{ errors.account_type[0] }}</span>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Account Name <span class="text-red-500">*</span></label>
            <input
              v-model="form.name"
              type="text"
              class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="e.g. Cash in Hand"
            />
            <span v-if="errors.name" class="text-xs text-red-500">{{ errors.name[0] }}</span>
          </div>
        </div>

        <!-- GL Code & Normal Balance -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">GL Code <span class="text-red-500">*</span></label>
            <input
              v-model="form.gl_code"
              type="text"
              class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="e.g. 1000"
            />
            <span v-if="errors.gl_code" class="text-xs text-red-500">{{ errors.gl_code[0] }}</span>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Normal Balance <span class="text-red-500">*</span></label>
            <select
              v-model="form.normal_balance"
              class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="DR">Debit (DR)</option>
              <option value="CR">Credit (CR)</option>
            </select>
            <span v-if="errors.normal_balance" class="text-xs text-red-500">{{ errors.normal_balance[0] }}</span>
          </div>
        </div>

        <!-- Parent Account -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Parent Account (Optional)</label>
          <SearchableSelect
            v-model="form.parent_id"
            :options="parentOptions"
            placeholder="Search for account..."
            state="parent_account"
          />
          <span v-if="errors.parent_id" class="text-xs text-red-500">{{ errors.parent_id[0] }}</span>
        </div>

        <!-- Subtype & IFRS -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Account Subtype</label>
            <input
              v-model="form.account_subtype"
              type="text"
              class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="e.g. Current Asset"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">IFRS Category</label>
            <input
              v-model="form.ifrs_category"
              type="text"
              class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="e.g. Cash and Equivalents"
            />
          </div>
        </div>

        <!-- Toggles -->
        <div class="flex flex-col gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50 mt-2">
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="form.is_control" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary" />
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Control Account (Header Only)</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="form.is_postable" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary" />
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Postable (Accepts transactions)</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary" />
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Active</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="form.allow_manual" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary" />
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Allow Manual Journal Entries</span>
          </label>
        </div>
      </div>
    </template>
    
    <!-- We omit #actions to use Drawer's default Close/Save footer -->
  </Drawer>
</template>
