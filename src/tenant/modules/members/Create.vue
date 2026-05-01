<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { Form, getSystemSetting, tryCatch } from '@/Global';
import { AlertCircle, TrendingUp } from 'lucide-vue-next';
const emits = defineEmits(['update:form']);
import { memberAccountApi } from '@/tenant/apis'
import debounce from 'lodash/debounce'
import { pomPinia } from 'septor-store'

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
    label: 'products',
    name: 'product_id',
    type: 'select',
    required: false,
    placeholder: 'Search products',
    url: "global/savings-products",
    dataOnMount: true,
    selectOnOneItem: true,

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
        }
      ],
    },
    change: async (val: any) => {
      const amount = val?.target ? val.target.value : val
      // alert()
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
          field: 'member_type',
          condition: (val: any) => val == 'new_member' && !settingList?.value['system-used-by-money-lender']
        },

      ],
    }
  },
  {
    label: 'Payment Mode',
    name: 'payment_method',
    type: 'select',
    required: false,
    options: [
      { id: 'cash', name: 'Cash' },
      { id: 'bank_transfer', name: 'Bank Transfer' },
      { id: 'mobile_money', name: 'Mobile Money' },
      { id: 'cheque', name: 'Cheque' },
      { id: 'teller', name: 'Teller' },
      { id: 'ussd', name: 'USSD' },
    ],
    placeholder: 'payment mothod',
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
    label: 'Full Name',
    name: 'full_name',
    type: 'text',
    required: true,
    placeholder: 'Enter Full Name',
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
    max: new Date().toISOString().split('T')[0],
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
    placeholder: 'join date ',
  },
  {
    label: 'referred by',
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
    "hide-initial-deposit-field": (checkForVaailableSetting?.['sacco-members-hide-initial-deposit-field'] ?? 0),
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