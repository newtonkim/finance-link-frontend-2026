<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { InputError, Label, Spinner } from '@/Global'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'
import { savingsProductsApi, type SavingsProduct } from '@/tenant/apis/savingsProducts/api'
import { membersApi } from '@/tenant/apis/members/membersApi'
import { toast } from 'vue-sonner'

interface MemberOption { id: number; name: string; member_number: string }
interface MemberDetails {
  id: number
  name: string
  member_number: string
  status: string
  savings_accounts: Array<{ id: number; account_no: string; account_type: string }>
}

const props = defineProps<{ savingsProducts: SavingsProduct[] }>()
const emit = defineEmits<{ success: [] }>()

const open = ref(false)
const processing = ref(false)
const errors = ref<Record<string, any>>({})
const showChargeDropdown = ref(false)

const memberSelectValue = ref<string | number>('')
const memberLoading = ref(false)
const memberOptions = ref<MemberOption[]>([])
const selectedMember = ref<MemberDetails | null>(null)

const form = ref({
  member_id: 0,
  savings_product_id: '' as string | number,
  account_type: '',
  is_new_account: true,
  initial_deposit: '' as string | number,
  opening_balance: '' as string | number,
  consider_min_balance: false,
  credited_account_id: '' as string | number,
  charges: [] as number[],
  status: 'active',
})

const productOptions = computed(() =>
  (props.savingsProducts ?? []).map(p => ({ id: p.id!, name: p.name }))
)

const selectedProductCharges = computed(() => {
  if (!form.value.savings_product_id) return []
  return props.savingsProducts.find(p => p.id === Number(form.value.savings_product_id))?.charges ?? []
})

const memberSelectOptions = computed(() =>
  (memberOptions.value ?? []).map(m => ({ id: m.id, name: `${m.name} — ${m.member_number}` }))
)

const creditedAccountOptions = computed(() =>
  (selectedMember.value?.savings_accounts ?? []).map(a => ({ id: a.id, name: `${a.account_no} — ${a.account_type}` }))
)

const memberHasAccounts = computed(() => (selectedMember.value?.savings_accounts?.length ?? 0) > 0)

const isNewAccountOptions = [{ id: 'yes', name: 'Yes' }, { id: 'no', name: 'No' }]
const minBalanceOptions = [{ id: 'no', name: 'No' }, { id: 'yes', name: 'Yes' }]
const isNewAccountValue = computed(() => form.value.is_new_account ? 'yes' : 'no')
const minBalanceValue = computed(() => form.value.consider_min_balance ? 'yes' : 'no')

const getChargeNameById = (id: number) =>
  selectedProductCharges.value.find(c => c.id === id)?.type ?? `Charge ${id}`
const isChargeSelected = (id: number) => form.value.charges.includes(id)
const toggleCharge = (chargeId: number) => {
  const idx = form.value.charges.indexOf(chargeId)
  if (idx > -1) form.value.charges.splice(idx, 1)
  else form.value.charges.push(chargeId)
}

async function searchMembers(query: string) {
  memberLoading.value = true
  try {
    const res = await membersApi.list({ search: query || undefined, page: 1 })
    const list = res.data?.data ?? []
    memberOptions.value = list.map((m: any) => ({ id: m.id, name: m.name, member_number: m.member_number }))
  } catch {
    memberOptions.value = []
  } finally {
    memberLoading.value = false
  }
}

async function fetchMemberDetails(memberId: number) {
  try {
    const res = await membersApi.show(memberId)
    const body = res.data
    const memberData: Record<string, any> = body?.data?.member ?? body?.member ?? body?.data ?? body ?? {}
    selectedMember.value = {
      id: memberData.id,
      name: memberData.name,
      member_number: memberData.member_number,
      status: memberData.status,
      savings_accounts: memberData.savings_accounts ?? [],
    }
  } catch (err: any) {
    selectedMember.value = null
    toast.error(err?.response?.data?.message ?? 'Failed to load member details.')
  }
}

watch(memberSelectValue, async (val) => {
  const memberId = Number(val || 0)
  if (!memberId) {
    selectedMember.value = null
    form.value.member_id = 0
    return
  }
  form.value.member_id = memberId
  const opt = memberOptions.value.find(o => o.id === memberId)
  if (opt) await fetchMemberDetails(opt.id)
})

watch(() => form.value.savings_product_id, async (newVal) => {
  if (!newVal) return
  const product = props.savingsProducts.find(p => p.id === Number(newVal))
  if (product) {
    form.value.account_type = product.type
    if (!product.charges) {
      try {
        const res = await savingsProductsApi.get(Number(newVal))
        const full = res.data?.data ?? res.data
        const idx = props.savingsProducts.findIndex(p => p.id === Number(newVal))
        if (idx > -1) props.savingsProducts[idx] = { ...props.savingsProducts[idx], ...full }
        const updated = props.savingsProducts.find(p => p.id === Number(newVal))
        form.value.charges = updated?.charges?.map(c => c.id!) ?? []
      } catch {}
      return
    }
    form.value.charges = product.charges?.map(c => c.id!) ?? []
  }
})

function openDrawer() {
  errors.value = {}
  selectedMember.value = null
  memberSelectValue.value = ''
  memberOptions.value = []
  form.value = {
    member_id: 0,
    savings_product_id: '',
    account_type: '',
    is_new_account: true,
    initial_deposit: '',
    opening_balance: '',
    consider_min_balance: false,
    credited_account_id: '',
    charges: [],
    status: 'active',
  }
  open.value = true
  searchMembers('')
}

async function submit() {
  errors.value = {}
  if (!form.value.member_id) {
    errors.value.member_id = 'Member is required.'
    return
  }
  if (!form.value.savings_product_id) {
    errors.value.savings_product_id = 'Savings product is required.'
    return
  }
  if (memberHasAccounts.value) {
    errors.value.member_id = 'This member already has savings accounts.'
    return
  }
  processing.value = true
  try {
    await savingsAccountsApi.store(form.value)
    toast.success('Savings account created successfully.')
    open.value = false
    emit('success')
  } catch (err: any) {
    if (err?.response?.status === 422) {
      errors.value = err.response.data.errors || {}
    } else {
      toast.error(err?.response?.data?.message ?? 'Failed to create savings account.')
    }
  } finally {
    processing.value = false
  }
}

defineExpose({ openDrawer })
</script>

<template>
  <Transition name="drawer-fade">
    <div v-if="open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="open = false"></div>
      <Transition name="drawer-slide">
        <aside
          class="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl ring-1 ring-black/5"
          role="dialog"
          aria-label="Add Savings Account"
        >
          <div class="flex h-full flex-col">
            <div class="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <div>
                <h3 class="text-[15px] font-bold text-neutral-900">Add Savings Account</h3>
                <p class="text-xs text-neutral-500">Create a savings account for eligible members.</p>
              </div>
              <button type="button" @click="open = false"
                class="h-8 w-8 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors">
                ✕
              </button>
            </div>

            <form @submit.prevent="submit" class="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <!-- Member Search -->
              <div class="space-y-2">
                <Label>Member</Label>
                <SearchableSelect
                  :modelValue="memberSelectValue"
                  @update:modelValue="memberSelectValue = $event"
                  :options="memberSelectOptions"
                  placeholder="Search by name or member number"
                  state="create-account-member"
                />
                <InputError v-if="errors.member_id" :message="errors.member_id" />
                <div v-if="selectedMember" class="mt-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                  <div class="text-sm font-semibold text-neutral-900">{{ selectedMember.name }}</div>
                  <div class="text-xs text-neutral-500">Member #{{ selectedMember.member_number }} · {{ selectedmember?.status }}</div>
                  <p v-if="memberHasAccounts" class="mt-2 text-xs font-semibold text-amber-600">
                    This member already has {{ selectedMember.savings_accounts.length }} savings account(s).
                  </p>
                  <p v-else class="mt-2 text-xs text-emerald-600 font-semibold">
                    Eligible: no existing savings account.
                  </p>
                </div>
              </div>

              <!-- Savings Product -->
              <div class="space-y-2">
                <Label>Account Type</Label>
                <SearchableSelect
                  :modelValue="form.savings_product_id"
                  @update:modelValue="form.savings_product_id = $event"
                  :options="productOptions"
                  placeholder="Select savings product"
                  state="create-account-product"
                  :error="errors.savings_product_id"
                />
              </div>

              <!-- Is New Account -->
              <div class="space-y-2">
                <Label>Is New Account</Label>
                <SearchableSelect
                  :modelValue="isNewAccountValue"
                  @update:modelValue="form.is_new_account = $event === 'yes'"
                  :options="isNewAccountOptions"
                  placeholder="Select"
                  state="create-account-is-new"
                />
              </div>

              <!-- New Account fields -->
              <template v-if="form.is_new_account">
                <div class="space-y-2">
                  <Label>Charges</Label>
                  <div class="relative">
                    <div @click="showChargeDropdown = !showChargeDropdown"
                      class="min-h-[46px] cursor-pointer rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                      <template v-if="form.charges.length">
                        <span v-for="cid in form.charges" :key="cid"
                          class="mr-1 inline-flex items-center gap-1 rounded-md border border-bg-nfuko-yellow/20 bg-bg-nfuko-yellow/10 px-2.5 py-1 text-[11px] font-semibold text-bg-nfuko-yellow">
                          {{ getChargeNameById(cid) }}
                        </span>
                      </template>
                      <span v-else class="text-xs text-neutral-400">Select charges</span>
                    </div>
                    <div v-if="showChargeDropdown"
                      class="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
                      <div v-if="!selectedProductCharges.length" class="px-4 py-3 text-sm text-neutral-400">
                        Select an account type first
                      </div>
                      <button v-for="charge in selectedProductCharges" :key="charge.id" type="button"
                        @click="toggleCharge(charge.id!)"
                        class="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-50">
                        <span class="capitalize">{{ charge.type }}</span>
                        <span class="text-xs text-neutral-400">{{ isChargeSelected(charge.id!) ? 'Selected' : '' }}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="space-y-2">
                  <Label>Initial Deposit</Label>
                  <input v-model="form.initial_deposit" type="number" step="0.01" min="0"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary" />
                </div>

                <div class="space-y-2">
                  <Label>Consider Minimum Balance</Label>
                  <SearchableSelect
                    :modelValue="minBalanceValue"
                    @update:modelValue="form.consider_min_balance = $event === 'yes'"
                    :options="minBalanceOptions"
                    placeholder="Select"
                    state="create-account-min-balance"
                  />
                </div>
              </template>

              <!-- Existing Account Credit -->
              <template v-else>
                <div>
                  <Label>Credited Account</Label>
                  <SearchableSelect
                    :modelValue="form.credited_account_id"
                    @update:modelValue="form.credited_account_id = $event"
                    :options="creditedAccountOptions"
                    placeholder="Select account"
                    state="create-account-credited"
                    :disabled="!creditedAccountOptions.length"
                  />
                  <p v-if="!creditedAccountOptions.length" class="mt-1 text-xs text-amber-600">
                    This member has no existing savings account to credit.
                  </p>
                </div>
              </template>

              <div class="space-y-2">
                <Label>Status</Label>
                <select v-model="form.status"
                  class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary">
                  <option value="active">Active</option>
                  <option value="dormant">Dormant</option>
                </select>
              </div>
            </form>

            <div class="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
              <button type="button" @click="open = false"
                class="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
                Cancel
              </button>
              <button type="button" @click="submit" :disabled="processing || memberHasAccounts"
                class="inline-flex items-center gap-2 rounded-full bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white hover:bg-nfuko-primary/90 transition-colors disabled:opacity-60">
                <Spinner v-if="processing" class="h-4 w-4" />
                Create Account
              </button>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.2s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.25s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }
</style>
