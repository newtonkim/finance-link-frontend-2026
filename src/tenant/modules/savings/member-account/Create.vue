<template>
  <div class="flex flex-col h-full px-1">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <span class="size-8 animate-spin rounded-full border-[3px] border-[#052659]/20 border-t-[#052659]"></span>
    </div>

    <template v-else>
      <!-- Member / new account header -->
      <div class="rounded-2xl bg-gradient-to-br from-[#052659] to-[#0a3a7a] p-5 text-white shadow-sm mb-6 relative overflow-hidden">
        <div class="absolute -top-8 -right-8 size-32 rounded-full bg-white/10 blur-2xl"></div>
        <div class="relative flex items-center gap-4">
          <div class="size-12 rounded-2xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center shrink-0 font-black text-lg">
            {{ memberInitials }}
          </div>
          <div class="min-w-0">
            <p class="text-[10px] uppercase tracking-wider text-white/60 font-bold">New Savings Account</p>
            <h3 class="text-lg font-black mt-0.5 truncate">{{ memberName }}</h3>
            <button v-if="memberCode" type="button" @click="copyCode"
              class="flex items-center gap-1.5 mt-0.5 text-white/75 hover:text-white text-[12px] font-mono transition-colors">
              {{ memberCode }}
              <component :is="copied ? Check : Copy" :size="12" :class="copied ? 'text-white' : ''" />
            </button>
          </div>
          <div class="ml-auto shrink-0 hidden sm:flex">
            <PiggyBank :size="40" class="text-white/30" />
          </div>
        </div>
      </div>

      <!-- Account details form -->
      <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">
          <Wallet :size="13" /> Account Details
        </p>
        <Form :action="data?.action" parentStyle="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5" v-model:form="fields" />

        <!-- Live initial-deposit summary -->
        <div v-if="enteredDeposit > 0 || enteredCharge > 0"
          class="mt-5 rounded-xl border border-gray-100 bg-gray-50/70 divide-y divide-gray-100">
          <div class="flex items-center justify-between px-4 py-2.5">
            <span class="text-[13px] font-medium text-gray-500">Initial deposit</span>
            <span class="text-[13px] font-bold text-gray-800 tabular-nums">{{ currencyCode }} {{ formatMoneyValue(enteredDeposit) }}</span>
          </div>
          <div class="flex items-center justify-between px-4 py-2.5">
            <span class="text-[13px] font-medium text-gray-500">Charges</span>
            <span class="text-[13px] font-bold text-gray-800 tabular-nums">{{ currencyCode }} {{ formatMoneyValue(enteredCharge) }}</span>
          </div>
          <div class="flex items-center justify-between px-4 py-3 bg-white rounded-b-xl">
            <span class="flex items-center gap-1.5 text-[13px] font-bold text-gray-700"><ReceiptText :size="14" class="text-[#052659]" /> Total to collect</span>
            <span class="text-base font-black text-[#052659] tabular-nums">{{ currencyCode }} {{ formatMoneyValue(totalToCollect) }}</span>
          </div>
        </div>
      </div>

      <!-- Note -->
      <div class="mt-5 flex items-start gap-2.5 rounded-xl bg-amber-50/60 border border-amber-100 px-4 py-3">
        <Info :size="15" class="text-amber-500 shrink-0 mt-0.5" />
        <p class="text-[12px] text-amber-700 leading-relaxed">
          Opening this account posts the initial deposit and any charges immediately to the member's account and the general ledger.
        </p>
      </div>
    </template>
  </div>

</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { PiggyBank, Wallet, Copy, Check, Info, ReceiptText } from 'lucide-vue-next'
import { exptendAformField, Form, formatMoneyValue, getSystemSetting, tryCatch } from '@/Global'
import { memberAccountApi } from '@/tenant/apis'
import { useCurrencyStore } from '@/stores/currency'
import debounce from 'lodash/debounce'

const { currencyCode } = storeToRefs(useCurrencyStore())
const { getProductCharges } = memberAccountApi()

const emits = defineEmits(['update:form']),
  loading = ref(true),
  settingList = ref({}),
  yesNoOptions = [
    { id: 1, name: 'Yes' },
    { id: '0', name: 'No' },
  ],
  props = defineProps({
    data: {
      type: Object,
      default: {},
    },
    disableMemberFields: {
      type: Boolean,
      default: false,
      required: false
    }
  }),
  fields = ref<any[]>([
    {
      label: 'Member',
      name: 'member',
      type: 'select',
      required: true,
      url: 'global/member-dropdown-list',
      placeholder: 'select a member',
      dataOnMount: true,
      value: props?.data?.member_id,
      disabled: props?.disableMemberFields,


    },

    {
      label: 'free input code',
      name: 'code',
      value: settingList.value?.['free-code'],
      type: 'text',
      required: false,
      placeholder: 'Enter code',
      dependsOn: {
        conditions: [

          {
            condition: (val) => settingList.value?.['free-code'],
            field: 'member',
          },
        ],
      }
    },
    {
      label: 'savings product',
      name: 'product_id',
      type: 'select',
      required: true,
      options: [],
      placeholder: 'Enter a savings product',
      url: 'global/savings-products',
      dataOnMount: true,
      change: async (val: any) => {
        const amount = fields.value.find((f: any) => f.name === 'in_deposit')?.value
        if (amount)
          watchChangeInProductOrCharges(fields, amount)

      }
    },

    {
      label: 'is New Account',
      name: 'new_account',
      type: 'select',
      required: true,
      options: yesNoOptions,
      value: 1,
      // disabled: true,
      placeholder: 'Enter is New Account',
    }, 
    {
      label: 'inital deposit',
      name: 'in_deposit',
      type: 'number',
      value: 0,
      required: true,
      placeholder: 'Select initial deposit',

      dependsOn: {
        conditions: [
          {
            field: 'new_account',
            condition: (val: any) => settingList.value['hide-initial-deposit-field'],
            // condition: (val: any) => Number(val) === 1 && !settingList.value['hide-initial-deposit-field'],
          },
          // {
          //   field: 'cm_balance',
          //   condition: (val: any) => Number(val) >= 0
          // },
        ],
      },
      change: async (val: any) => {
        const amount = val?.target ? val.target.value : val
        watchChangeInProductOrCharges(fields, amount)
      },
    },
    {
      label: 'charges',
      name: 'charges',
      type: 'text',
      required: true,
      disabled: true,
      placeholder: 'Enter charges',
      dependsOn: {
        conditions: [
          {
            field: 'in_deposit',
            condition: (val: any) => Number(val) > 0 && settingList.value['hide-initial-deposit-field'],
          },
          {
            field: 'product_id',
            condition: (val: any) => !!val,
          },
        ],
      }
    },
    {
      label: 'payment mode (Debit Account)',
      name: 'payment_mode_id',
      type: 'select',
      url: "global/chart-of-accounts",
      data: { account_type: 'ASSET' },
      dataOnMount: true,
    required: true,

      options: [],
      placeholder: 'Select income account',
      // condition: (val: string) => ['on_registration', 'on_loan_application'].includes(val)
    },
    {
      label: 'Status',
      name: 'Status',
      type: 'select',
      value: 'active',
      required: true,
      options: [
        { id: 'active', name: 'active' },
        { name: 'dormant', id: 'dormant' },
      ],
      placeholder: 'Enter account Status',
    },
  ] as any[])
// ── Header context + live initial-deposit summary ───────────────────────────
const memberName = computed(() => props.data?.full_name || props.data?.member_name || 'New Account')
const memberCode = computed(() => props.data?.memeber_code || props.data?.member_code || '')
const memberInitials = computed(() => {
  const words = String(memberName.value).trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return String(memberName.value).slice(0, 2).toUpperCase()
})

const enteredDeposit = computed(() => {
  const f = fields.value.find((x: any) => x.name === 'in_deposit')
  const n = Number(f?.value)
  return isNaN(n) ? 0 : n
})
const enteredCharge = computed(() => {
  const f = fields.value.find((x: any) => x.name === 'charges')
  const match = String(f?.value ?? '').match(/[\d,.]+/)
  const n = match ? Number(match[0].replace(/,/g, '')) : 0
  return isNaN(n) ? 0 : n
})
const totalToCollect = computed(() => enteredDeposit.value + enteredCharge.value)

const copied = ref(false)
function copyCode() {
  if (!memberCode.value) return
  navigator.clipboard?.writeText(String(memberCode.value)).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  })
}

async function promtValueOnUpdate() {
  loading.value = true
  if (props.data) {
    const data = {
      tenant_id: props.data.tenant_id,
      plan: props.data.plan_id,
      date: [props.data.starts, props.data.expires],
      status: props.data.status,
    }
    await Object.entries(data).forEach(([key, value]) => {
      const field = fields.value.find((f: any) => f.name === key)
      if (field) field.value = value
    })
  }
  loading.value = false
}
function checkForSettings() {
  const checkForVaailableSetting = getSystemSetting()

  settingList.value = {
    'hide-initial-deposit-field': checkForVaailableSetting?.['sacco-members-show-initial-deposit-field'] ?? 0,
    'free-code': checkForVaailableSetting?.['sacco-savings-accounts-free-input-code'] ?? 0,
  }
  console.log(checkForVaailableSetting);
}
const watchChangeInProductOrCharges = debounce(async (fields: any, amount: any) => {
  const finedProduct = fields.value.find((f: any) => f.name === 'product_id')
  const chargeField = fields.value.find((f: any) => f.name === 'charges')

  if (!finedProduct || !finedProduct.value) return

  tryCatch(async () => {
    const res: any = await getProductCharges({
      product_id: finedProduct.value,
      amount: amount,
      type: 'deposit',
    })

    if (chargeField) {
      chargeField.value = `${res?.cost ?? 0} (charges)`
      chargeField.hidden = false
      chargeField.label = 'charges'
    }
  })
}, 900)

onMounted(() => {
  promtValueOnUpdate()
  checkForSettings()
}) 
</script>
