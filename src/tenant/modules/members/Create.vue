<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { Form, getSystemSetting, tryCatch } from '@/Global';
import { AlertCircle, TrendingUp } from 'lucide-vue-next';
const emits = defineEmits(['update:form']);
import { memberAccountApi } from '@/tenant/apis'
import debounce from 'lodash/debounce'
import { pomPinia } from 'septor-store'
import { memmberSettingApi } from '@/tenant/apis/members/settings.ts'
const { onBoardingProductGeneralCharges } = memmberSettingApi()
const Store = pomPinia()
const { getProductCharges } = memberAccountApi()
const OptionList = reactive({
  memberTypeOptions: [{ id: 'new_member', name: 'New Member' }, { id: 'existing_member', name: 'Existing Member' }],
  salutationOptions: [{ id: 'Mr', name: 'Mr' }, { id: 'Mrs', name: 'Mrs' }, { id: 'Ms', name: 'Ms' }, { id: 'Dr', name: 'Dr' }, { id: 'Prof', name: 'Prof' }],
  genderOptions: [{ id: 'male', name: 'Male' }, { id: 'female', name: 'Female' }, { id: 'other', name: 'Other' }],
  maritalOptions: [{ id: 'single', name: 'Single' }, { id: 'married', name: 'Married' }, { id: 'divorced', name: 'Divorced' }, { id: 'widowed', name: 'Widowed' }]
})
const loading = ref(true)
const settingList = ref({})
const additionalForm = ref({ shares_quantity: 0 });
const errors = ref({ shares_quantity: 0 });
const props = defineProps({
  data: {
    type: Object,
    default: {},
  },
})
const today = new Date();
const minAgeDate = new Date(
  today.getFullYear() - 18,
  today.getMonth(),
  today.getDate()
);
const fields = ref<any[]>([
  {
    label: 'Member type',
    name: 'member_type',
    type: 'select',
    required: true,
    placeholder: 'Search member type',
    class: "no-print",

    options: OptionList.memberTypeOptions
  },
  {
    label: 'Full Name',
    name: 'full_name',
    type: 'text',
    required: true,
    placeholder: 'Enter Full Name',
  },
  {
    label: 'saving products',
    name: 'product_id',
    type: 'select',
    required: false,
    reClean: true,
    placeholder: 'Search products',
    url: "global/savings-products",
    dataOnMount: true,
    selectOnOneItem: true,
    change: async (val: any) => {
      watchChangeInProductOrCharges(fields,)
    },
    dependsOn: {
      conditions: [
        {
          field: 'member_type',
          condition: (val: any) => !settingList?.value['system-used-by-money-lender']
        }
      ],
    },
  },

  {
    label: 'is share holder',
    name: 'is_share_holder',
    type: 'select',
    required: false,
    placeholder: 'Search products',
    options: [
      { id: '1', name: 'Yes' },
      { id: '0', name: 'No' },
    ],
    dependsOn: {
      conditions: [
        {
          field: 'member_type',
          condition: (val: any) => val === 'existing_member'
        }
      ],
    },

  },
  {
    label: 'inital deposit',
    name: 'inital_deposit',
    type: 'money',
    required: true,
    placeholder: 'Select initial deposit',
    dependsOn: {
      conditions: [
        {
          field: 'member_type',
          condition: (val: any) => val === 'new_member'
        },
        {
          field: 'member_type',
          condition: (val: any) => settingList?.value['hide-initial-deposit-field']
        },
      ],
    },
    change: async (val: any) => {
      watchChangeInProductOrCharges(fields,)
    },
  },

  {
    label: 'Transactional charges',
    name: 'charges',
    type: 'text',
    required: true,
    disabled: true,
    placeholder: 'Enter charges',
    dependsOn: {
      conditions: [
        {
          field: 'member_type',
          condition: (val: any) => val == 'new_member' && !settingList?.value['system-used-by-money-lender'] && settingList?.value['hide-initial-deposit-field']
        },

      ],
    }
  },

  {
    label: 'General Charge',
    name: 'general_registration_charges',
    type: 'text',
    disabled: true,
    placeholder: 'Auto-populated when a product is selected',
    hidden: true,
    helper: '',
  },

  {
    label: 'payment mode (Debit Account)',
    name: 'payment_mode_id',
    type: 'select',
    url: "global/chart-of-accounts",
    data: { account_type: 'ASSET' },
    dataOnMount: true,
    options: [],
    required: true,

    // selectDefaultIndex: 0,
    placeholder: 'Select income account',
    dependsOn: {
      conditions: [
        {
          field: 'inital_deposit',
          condition: (val: any) => val && !settingList?.value['system-used-by-money-lender'] && settingList?.value['hide-initial-deposit-field']
        },

      ],
    }
  },
  {
    label: 'opening balance',
    name: 'opening_balance',
    type: 'money',
    required: true,
    placeholder: 'Enter opening balance',
    dependsOn: {
      conditions: [
        {
          field: 'member_type',
          condition: (val: any) => val === 'existing_member'
        }
      ],
    },
  },

  {
    label: 'Member Code',
    name: 'code',
    type: 'text',
    required: false,
    placeholder: 'Enter custom member code',
    dependsOn: {
      conditions: [
        {
          field: 'full_name',
          condition: (val: any) => settingList?.value['sacco-members-free-input-code']
        }
      ],
    }

  },
  {
    label: 'Salutation',
    name: 'Salutation',
    type: 'select',
    required: true,
    placeholder: 'Search Salutation',
    options: OptionList.salutationOptions
  },
  {
    label: 'gender',
    name: 'gender',
    type: 'select',
    required: true,
    placeholder: 'Search gender',
    options: OptionList.genderOptions
  },
  {
    label: 'Date Of Birth',
    name: 'date_of_birth',
    type: 'date',
    required: true,
    max: minAgeDate.toISOString().split('T')[0],
    // maxDate: new Date(),
    props: { placeholder: 'Select Start & End Dates' },
  },
  {
    label: 'Primary Contact',
    name: 'primary_contact',
    type: 'phone',
    required: true,
    placeholder: 'Enter Primary Contact',
  },
  {
    label: 'Other Contacts',
    name: 'other_contacts',
    type: 'phone',
    required: false,
    placeholder: 'Enter Other Contacts',
  },
  {
    label: 'Mobile Money Number',
    name: 'mobile_money_number',
    type: 'phone',
    required: false,
    placeholder: 'Enter Primary Contact',
  },
  {
    label: 'Email',
    name: 'email',
    type: 'text',
    required: true,
    placeholder: 'Enter Email',
  },
  {
    label: 'NATIONAL ID (NIN)',
    name: 'national_id',
    type: 'text',
    required: settingList.value['sacco-members-member-nin-mandatory'],

    placeholder: 'Enter national id (NIN)',
  },
  {
    label: 'Marital Status',
    name: 'marital_status',
    type: 'select',
    required: false,
    options: OptionList.maritalOptions,
    placeholder: 'Enter Marital Status',
  },

  {
    label: 'Nationality',
    name: 'nationality',
    type: 'nationality',
    required: true,
    value: 'Ugandan',
    placeholder: 'Enter Nationality',
  },
  {
    label: 'Address',
    name: 'address',
    type: 'textarea',
    required: true,
    placeholder: 'Enter Address',
  },
  {
    label: 'profile picture',
    name: 'profile_picture',
    type: 'profile',
    required: false,
    placeholder: 'Enter prifile picture',
    class: "no-print"
  },
  {
    label: 'Next of Kin',
    name: 'next_of_kin',
    type: 'text',
    required: settingList.value['sacco-members-member-next-of-kin-nin-mandatory'],
    placeholder: 'Enter Next of Kin',
  },
  {
    label: 'Next of Kin Contact',
    name: 'next_of_kin_contact',
    type: 'phone',
    required: settingList.value['sacco-members-member-next-of-kin-nin-mandatory'],
    placeholder: 'Enter Next of Kin Contact',
  },

  {
    label: 'joined date',
    name: 'joined_date',
    type: 'date',
    required: true,
    max: new Date().toISOString().split('T')[0],
    value: new Date().toISOString().split('T')[0],
    placeholder: 'join date ',
  },
  {
    label: 'referred by (staff who brought this member)',
    name: 'referred_by',
    type: 'select',
    required: false,
    url: 'staff/users-drop-down',
    placeholder: 'Referred by',
    dataOnMount: true,
  },
]);

watch(() => additionalForm.value, (val) => {
  const field = fields.value.find(f => f.name === 'shares_quantity')
  if (field) {
    field.value = val.shares_quantity
  } else {
    fields.value.push({
      name: 'shares_quantity',
      value: val.shares_quantity,
      required: true,
      type: 'text',
      hidden: true
    })
  }
}, { deep: true })

async function promtValueOnUpdate() {
  loading.value = true
  if (props.data) {
    const data = { tenant_id: props.data.tenant_id, plan: props.data.plan_id, date: [props.data.starts, props.data.expires], status: props.data.status }
    await Object.entries(data).forEach(([key, value]) => {
      const field = fields.value.find((f: any) => f.name === key)
      if (field) field.value = value
    });

  } else {
    additionalForm.value = { shares_quantity: 0 }
  }
  loading.value = false
}

const loadingMount = computed(() => loading.value)
function checkForSettings() {
  const checkForVaailableSetting = getSystemSetting()
  settingList.value = {
    "sacco-on-create-member-address-mandatory": (checkForVaailableSetting?.['sacco-on-create-member-address-mandatory'] ?? 0),
    "sacco-members-member-nin-mandatory": (checkForVaailableSetting?.['sacco-on-create-member-nin-mandatory'] ?? 0),
    "sacco-members-member-next-of-kin-nin-mandatory": (checkForVaailableSetting?.['sacco-on-create-member-next-of-kin-nin-mandatory'] ?? 0),
    "hide-initial-deposit-field": (checkForVaailableSetting?.['sacco-members-show-initial-deposit-field'] ?? 0),
    "system-used-by-money-lender": (checkForVaailableSetting?.['system-used-by-money-lenders'] ?? 0),
    "sacco-members-free-input-code": (checkForVaailableSetting?.['sacco-members-free-input-code'] ?? 0),
    "sacco-share-price-value": parseFloat(checkForVaailableSetting?.['sacco-share-price-value'] ?? 0),
    "sacco-share-on-member-creation-create-share-minimum-value": parseFloat(checkForVaailableSetting?.['sacco-share-on-member-creation-create-share-minimum-value'] ?? 0)
  }
}
const sharesError = computed(() => {
  const min = settingList.value?.['sacco-share-on-member-creation-create-share-minimum-value'] ?? 0;
  if (additionalForm.value.shares_quantity < min) return `Minimum is ${min}`
  return ''
})

const watchChangeInProductOrCharges = debounce(async (fields: any) => {
  const finedProduct = fields.value.find((f: any) => f.name === 'product_id')
  const chargeField = fields.value.find((f: any) => f.name === 'charges')
  const generalChargeField = fields.value.find((f: any) => f.name === 'general_registration_charges')
  const amountField = fields.value.find((f: any) => f.name === 'inital_deposit')

  if (!finedProduct || !finedProduct.value) return

  // 1) Registration (on_registration) charges → populate the new General Charge field.
  let regCharges: any[] = []
  let regSum = 0
  try {
    const regRes = await onBoardingProductGeneralCharges({ id: finedProduct.value })
    regCharges = Array.isArray(regRes) ? regRes : (regRes?.data ?? [])
    regSum = regCharges.reduce((acc: number, c: any) => acc + Number(c?.charge_amount ?? 0), 0)
  } catch {
    regCharges = []
    regSum = 0
  }

  if (generalChargeField) {
    if (regCharges.length > 0) {
      const breakdown = regCharges.map((c: any) => `${c?.name}: ${c?.charge_amount}`).join(', ')
      generalChargeField.value = `${regSum} (charges)`
      generalChargeField.hidden = false
      generalChargeField.helper = `<span class="font-bold text-red-500 text-xs">Registration charges for this product: <span class='text-neutral-900'>${breakdown}</span></span>`
    } else {
      generalChargeField.value = ''
      generalChargeField.hidden = true
      generalChargeField.helper = ''
    }
  }

  // 2) Deposit-event (transactional) fee → populate the existing Transactional charges field.
  //    NO LONGER summed with registration charges.
  if (chargeField && amountField?.value) {
    tryCatch(async () => {
      const depositRes: any = await getProductCharges({
        product_id: finedProduct.value,
        amount: amountField.value,
        type: 'deposit',
      })
      const depositFee = Number(depositRes?.cost ?? 0)
      chargeField.value = depositFee > 0 ? `${depositFee} (charges)` : ''
      chargeField.hidden = depositFee <= 0
      chargeField.helper = depositFee > 0
        ? `<span class="font-bold text-red-500 text-xs">Transaction charge: <span class='text-neutral-900'>${depositFee}</span></span>`
        : ''
    })
  }

  // 3) Initial-deposit sufficiency hint — surface a red helper under the
  //    Initial Deposit field when deposit < regSum. Backend rejects too;
  //    this is a UX assist.
  if (amountField) {
    const deposit = Number(amountField.value ?? 0)
    if (regSum > 0 && deposit > 0 && deposit < regSum) {
      amountField.helper = `<span class="font-bold text-red-500 text-xs">Initial deposit must be at least UGX ${regSum} to cover registration charges.</span>`
    } else {
      amountField.helper = ''
    }
  }
}, 900)
onMounted(() => {
  promtValueOnUpdate()
  checkForSettings()
})

defineExpose({ fields, watchChangeInProductOrCharges })
</script>
<template>
  <card class="card shadow-md px-4 py-3 bg-white dark:bg-neutral-800 rounded-md h -[86vh] over flow-y-auto border-0">
    <span v-if='loadingMount'></span>
    <Form :action="data?.action" v-else parentStyle="grid  grid-cols-2 gap-3" v-model:form="fields" />
    <div v-setting='"sacco-share-on-member-creation-create-share-account-at-the-same-time"'
      class="mt-0 rounded-2xl border border-nfuko-primary-200 bg-nfuko-primary-50/60 overflow-hidden">
      <!-- Section header -->
      <div class="flex items-center   px-5 py-3 bg-nfuko-primary-100/80 border-b border-nfuko-primary-200">
        <Share2 class="h-4 w-4 text-nfuko-primary-700" />
        <span class="text-[12px] font-bold text-nfuko-primary-800 uppercase tracking-wider">Share Purchase</span>
        <span
          class="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-nfuko-primary-600 text-white uppercase tracking-wide">
          Required
        </span>
      </div>

      <div class="p-5 space-y-3">
        <div class="flex items-start gap-3 px-4 py-3 rounded-xl bg-white border border-nfuko-primary-200">
          <AlertCircle class="h-4 w-4 text-nfuko-primary-600 shrink-0 mt-0.5" />
          <p class="text-[12px] text-nfuko-primary-800 leading-relaxed">
            This SACCO requires a minimum of
            <strong>{{ settingList?.['sacco-share-on-member-creation-create-share-minimum-value'] }} share(s)</strong>
            at <strong>UGX {{ settingList?.['sacco-share-price-value'] }}</strong> each

            (total:
            <strong>
              UGX {{
                (settingList?.['sacco-share-price-value'] ?? 1) *
                (settingList?.['sacco-share-on-member-creation-create-share-minimum-value'] ?? 0)
              }}
            </strong>)
            to register a member.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div class="grid gap-1.5">
            <label class="text-sm font-semibold text-neutral-700">Number of Shares to Purchase <span
                class="text-red-500">*</span>
            </label>
            <div class="flex overflow-hidden rounded-xl border focus-within:ring-1 transition-all"
              :class="sharesError ? 'border-red-400 focus-within:ring-red-300' : 'border-neutral-200 focus-within:border-nfuko-primary-400 focus-within:ring-nfuko-primary-300'">
              <span
                class="flex items-center border-r border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-500">
                Shares
              </span>
              <input v-model.number="additionalForm.shares_quantity" type="number"
                :min="settingList?.['sacco-share-on-member-creation-create-share-minimum-value']"
                :placeholder="`Min. ${settingList?.['sacco-share-on-member-creation-create-share-minimum-value']}`"
                class="flex-1 bg-white px-4 py-3 text-sm font-mono font-bold text-neutral-800 outline-none placeholder:text-neutral-400" />
            </div>
            <p v-if="sharesError" class="text-[11px] text-red-600 font-medium">{{ sharesError }}</p>
            <p v-else-if="errors.shares_quantity" class="text-[11px] text-red-600">{{ errors.shares_quantity }}</p>
          </div>
          <div class="grid gap-1.5">
            <label class="text-sm font-semibold text-neutral-700">Total Share Investment</label>
            <div
              class="flex items-center gap-3 rounded-xl border border-nfuko-primary-200 bg-white px-4 py-3 min-h-[48px]">
              <TrendingUp class="h-4 w-4 text-nfuko-primary-600 shrink-0" />
              <div>
                <p class="text-[11px] text-neutral-500 font-medium uppercase tracking-wide">
                  {{ additionalForm.shares_quantity || 0 }} shares × UGX {{ settingList?.['sacco-share-price-value'] }}
                </p>
                <p class="text-[18px] font-black text-nfuko-primary-700 font-mono leading-tight">
                  UGX {{
                    additionalForm.shares_quantity * settingList?.['sacco-share-price-value']?.toLocaleString('en-US', {
                      minimumFractionDigits: 2
                    }) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <br />
    <br />

  </card>
</template>