<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Drawer } from '@/Global'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { toast } from 'vue-sonner'
import { chartOfAccountsApi } from '@/tenant/apis/chartOfAccounts/chartOfAccountsApi'

const props = defineProps<{
  open: boolean
  lockedAccountType?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
  defaultParentGlCode?: string
  prefillName?: string
}>()

const emit = defineEmits(['update:open', 'saved'])

// Normal balance is determined by accounting convention, not user choice:
// assets/expenses are debit-normal; liabilities/equity/income are credit-normal.
const NORMAL_BALANCE_BY_TYPE: Record<string, 'DR' | 'CR'> = {
  ASSET: 'DR',
  EXPENSE: 'DR',
  LIABILITY: 'CR',
  EQUITY: 'CR',
  INCOME: 'CR',
}

// Asset and liability accounts have a fixed taxonomy; other types stay free-text.
const SUBTYPE_OPTIONS_BY_TYPE: Record<string, string[]> = {
  ASSET: ['Current Assets', 'Fixed Assets'],
  LIABILITY: ['Current Liabilities', 'Non-Current Liabilities'],
}

const form = ref({
  gl_code: '',
  name: '',
  account_type: 'ASSET',
  normal_balance: 'DR' as 'DR' | 'CR',
  parent_id: '' as string | number | null,
  is_control: false,
  is_postable: true,
  is_active: true,
  allow_manual: true,
  account_subtype: '',
  ifrs_category: '',
})

interface Account {
  id: number
  gl_code: string
  name: string
  is_control?: boolean
  account_type?: string
}
const parentAccounts = ref<Account[]>([])

const loading = ref(false)
const errors = ref<Record<string, string[]>>({})

const normalBalanceLabel = computed(() =>
  form.value.normal_balance === 'DR' ? 'Debit (DR)' : 'Credit (CR)',
)

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  INCOME: 'Income',
  EXPENSE: 'Expense',
}
const accountTypeLabel = computed(
  () => ACCOUNT_TYPE_LABEL[form.value.account_type] || form.value.account_type,
)

const subtypeOptions = computed(() => SUBTYPE_OPTIONS_BY_TYPE[form.value.account_type] ?? null)

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      form.value = {
        gl_code: '',
        name: props.prefillName ?? '',
        account_type: props.lockedAccountType ?? 'ASSET',
        normal_balance: (NORMAL_BALANCE_BY_TYPE[props.lockedAccountType ?? 'ASSET'] || 'DR') as 'DR' | 'CR',
        parent_id: '',
        is_control: false,
        is_postable: true,
        is_active: true,
        allow_manual: true,
        account_subtype: '',
        ifrs_category: '',
      }
      errors.value = {}

      try {
        const res = await chartOfAccountsApi.list({ list: 1 } as any)
        parentAccounts.value = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : []

        if (props.defaultParentGlCode) {
          const match = parentAccounts.value.find(
            (acc) => acc.gl_code === props.defaultParentGlCode && acc.is_control,
          )
          if (match) {
            form.value.parent_id = match.id
          }
        }

        if (!form.value.gl_code) {
          form.value.gl_code = generateGlCode(form.value.account_type, findParent(form.value.parent_id))
        }
      } catch (e) {
        console.error('Failed to load parent accounts')
      }
    }
  },
)

// 5-digit COA hierarchy:
//   Level 1 (x0000) — children step 1000 (e.g. 10000 → 11000, 12000, …)
//   Level 2 (xx000) — children step 100  (e.g. 11000 → 11100, 11200, …)
//   Level 3 (xxx00) — children step 1    (e.g. 11100 → 11101 … 11199)
//   Level 4 (xxxNN) — leaf, no children
// Given a parent, walk the hierarchy and return the next free slot under it.
// With no parent, fall back to "next free slot for this account type".
function generateGlCode(type: string, parent?: Account | null): string {
  if (parent && parent.gl_code) {
    const parentNum = parseInt(parent.gl_code)
    if (!isNaN(parentNum)) {
      let trailing = 0
      let n = parentNum
      while (n > 0 && n % 10 === 0) {
        trailing++
        n = Math.floor(n / 10)
      }

      if (trailing >= 2) {
        const step = trailing === 2 ? 1 : Math.pow(10, trailing - 1)
        const blockSize = Math.pow(10, trailing)
        const nextSiblingStart = parentNum + blockSize

        const childCodes = parentAccounts.value
          .map((a) => parseInt(a.gl_code))
          .filter((c) => !isNaN(c) && c > parentNum && c < nextSiblingStart)

        const candidate =
          childCodes.length > 0 ? Math.max(...childCodes) + step : parentNum + step

        if (candidate < nextSiblingStart) {
          return String(candidate).padStart(5, '0')
        }
        // Parent's child range is full — fall through to type-based fallback.
      }
    }
  }

  const prefixMap: Record<string, string> = {
    ASSET: '1',
    LIABILITY: '2',
    EQUITY: '3',
    INCOME: '4',
    EXPENSE: '5',
  }
  const prefix = prefixMap[type] || '1'
  const matching = parentAccounts.value
    .map((a) => parseInt(a.gl_code))
    .filter((code) => !isNaN(code) && String(code).startsWith(prefix))

  if (matching.length > 0) return String(Math.max(...matching) + 1)
  return prefix + '000'
}

function findParent(parentId: string | number | null): Account | null {
  if (parentId === '' || parentId === null || parentId === undefined) return null
  return parentAccounts.value.find((acc) => acc.id === Number(parentId)) ?? null
}

watch(
  () => form.value.account_type,
  (newType) => {
    form.value.normal_balance = NORMAL_BALANCE_BY_TYPE[newType] || 'DR'
    // Reset subtype + parent when switching types so stale selections from a different
    // account type don't leak into validation or the new filtered options.
    form.value.account_subtype = ''
    form.value.parent_id = ''
    if (props.open && parentAccounts.value.length > 0) {
      form.value.gl_code = generateGlCode(newType, null)
    }
  },
)

watch(
  () => form.value.parent_id,
  (newParentId) => {
    if (!props.open || parentAccounts.value.length === 0) return
    form.value.gl_code = generateGlCode(form.value.account_type, findParent(newParentId))
  },
)

// Parents are header/control accounts of the same account type — you can't nest an
// asset under a liability header. Sort by GL code so the tree reads top-down.
const parentOptions = computed(() => {
  return parentAccounts.value
    .filter((acc) => acc.is_control && acc.account_type === form.value.account_type)
    .sort((a, b) => a.gl_code.localeCompare(b.gl_code))
    .map((acc) => ({
      id: acc.id,
      name: `${acc.gl_code} - ${acc.name}`,
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
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >Account Type <span class="text-red-500">*</span></label
            >
            <div
              v-if="lockedAccountType"
              class="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300"
            >
              {{ accountTypeLabel }}
            </div>
            <select
              v-else
              v-model="form.account_type"
              class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
              <option value="EQUITY">Equity</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
            <span v-if="errors.account_type" class="text-xs text-red-500">{{
              errors.account_type[0]
            }}</span>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >Account Name <span class="text-red-500">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="e.g. Cash in Hand"
            />
            <span v-if="errors.name" class="text-xs text-red-500">{{ errors.name[0] }}</span>
          </div>
        </div>

        <!-- Subtype: dropdown for Asset/Liability, free-text otherwise -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >Account Subtype</label
          >
          <select
            v-if="subtypeOptions"
            v-model="form.account_subtype"
            class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          >
            <option value="" disabled>Select subtype</option>
            <option v-for="option in subtypeOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
          <input
            v-else
            v-model="form.account_subtype"
            type="text"
            class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            placeholder="e.g. Operating Income"
          />
          <span v-if="errors.account_subtype" class="text-xs text-red-500">{{
            errors.account_subtype[0]
          }}</span>
        </div>

        <!-- Normal Balance (derived from Account Type, read-only) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >Normal Balance <span class="text-red-500">*</span></label
          >
          <div
            class="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300"
          >
            {{ normalBalanceLabel }}
          </div>
          <span v-if="errors.normal_balance" class="text-xs text-red-500">{{
            errors.normal_balance[0]
          }}</span>
        </div>

        <!-- Parent Account -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >Parent Account (Optional)</label
          >
          <SearchableSelect
            v-model="form.parent_id"
            :options="parentOptions"
            placeholder="Search for account..."
            state="parent_account"
          />
          <span v-if="errors.parent_id" class="text-xs text-red-500">{{
            errors.parent_id[0]
          }}</span>
        </div>
      </div>
    </template>
  </Drawer>
</template>
