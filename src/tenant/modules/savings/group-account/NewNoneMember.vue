<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { Form, getSystemSetting, pickAsettingKeyValue, formatMoneyValue } from '@/Global';
import { AlertCircle, TrendingUp } from 'lucide-vue-next';
const emits = defineEmits(['update:form']);
const OptionList = reactive({
  memberTypeOptions: [{ id: 'new_member', name: 'New Member' }, { id: 'existing_member', name: 'Existing Member' }],
  roleOptions: [{ id: 'member', name: 'Member' }, { id: 'chairman', name: 'Group Chairman' }, { id: 'treasurer', name: 'Group Treasurer' }, { id: 'secretary', name: 'Group Secretary' }],
  salutationOptions: [{ id: 'Mr', name: 'Mr' }, { id: 'Mrs', name: 'Mrs' }, { id: 'Ms', name: 'Ms' }, { id: 'Dr', name: 'Dr' }, { id: 'Prof', name: 'Prof' }],
  genderOptions: [{ id: 'male', name: 'Male' }, { id: 'female', name: 'Female' }, { id: 'other', name: 'Other' }],
  maritalOptions: [{ id: 'single', name: 'Single' }, { id: 'married', name: 'Married' }, { id: 'divorced', name: 'Divorced' }, { id: 'widowed', name: 'Widowed' }]
})
const loading = ref(true)
const settingList = ref({})
const additionalForm = ref({ shares_quantity: 0 });
const errors = ref({ shares_quantity: 0 });
const currencyCode = computed(() => `${pickAsettingKeyValue('default-currency') || 'UGX'}`);
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
const fields = ref<any[]>([
    {
      label: 'Account Code',
      name: 'account_code',
      type: 'select',
      required: false,
      url:'group-account-savings/collect-group-saving-account-list'+`?group_id=${props.data?.item?.id}`,
      dataOnMount: true,
      selectOnOneItem: true,

    },
  {
    label: 'Group role',
    name: 'member_role',
    type: 'select',
    required: false,
    options: OptionList.roleOptions,
    value: 'member',
    placeholder: 'Select group role',
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
      // maxDate: new Date(),
    max: new Date().toISOString().split('T')[0],

    required: true,
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
    required: true,
    placeholder: 'Enter Other Contacts',
  },
  {
    label: 'Mobile Money Number',
    name: 'mobile_money_number',
    type: 'phone',
    required: true,
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
    required: true,
    placeholder: 'Enter national id (NIN)',
  },
  {
    label: 'Marital Status',
    name: 'marital_status',
    type: 'select',
    required: true,
    options: OptionList.maritalOptions,
    placeholder: 'Enter Marital Status',
  },
  {
    label: 'Nationality',
    name: 'nationality',
    type: 'nationality',
    required: true,
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
    placeholder: 'Enter profile picture',
  },
  {
    label: 'Next of Kin',
    name: 'next_of_kin',
    type: 'text',
    required: true,
    placeholder: 'Enter Next of Kin',
  },
  {
    label: 'Next of Kin Contact',
    name: 'next_of_kin_contact',
    type: 'phone',
    required: true,
    placeholder: 'Enter Next of Kin Contact',
  },
  {
    label: 'opening balance',
    name: 'opening_balance',
    type: 'money',
    required: true,
    placeholder: 'Enter opening balance',
  },
  {
    label: 'joined date',
    name: 'joined_date',
    type: 'date',
    max: new Date().toISOString().split('T')[0],

    required: true,
    placeholder: 'Referred by',
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
const sharePrice = computed(() => Number((settingList.value as any)?.['sacco-share-price-value'] ?? 0));
const minSharesRequired = computed(() => Number((settingList.value as any)?.['sacco-share-on-member-creation-create-share-minimum-value'] ?? 0));
const totalShareInvestment = computed(() => Number(additionalForm.value?.shares_quantity ?? 0) * sharePrice.value);
function formatMoney(amount: number | string | null | undefined, minimumFractionDigits = 2) {
  return `${currencyCode.value} ${formatMoneyValue(amount ?? 0, minimumFractionDigits)}`;
}
function checkForSettings() {
  const checkForVaailableSetting = getSystemSetting()
  settingList.value = {
    "hide-initial-deposit-field": (checkForVaailableSetting['hide-initial-deposit-field'] ?? 0),
    "sacco-members-free-input-code": (checkForVaailableSetting['sacco-members-free-input-code'] ?? 0),
    "sacco-share-price-value": parseFloat(checkForVaailableSetting['sacco-share-price-value'] ?? 0),
    "sacco-share-on-member-creation-create-share-minimum-value": parseFloat(checkForVaailableSetting['sacco-share-on-member-creation-create-share-minimum-value'] ?? 0)
  }
}
const sharesError = computed(() => {
  if (additionalForm.value.shares_quantity < minSharesRequired.value) return `Minimum is ${minSharesRequired.value}`
  return ''
})

watch(
  () => fields.value,
  (val) => {
    const codeIndex = val.findIndex(f => f.name === 'code');
    const fullNameIndex = val.findIndex(f => f.name === 'full_name');

    if (settingList.value['hide-initial-deposit-field']) {
      const initalDepositIndex = val.findIndex(f => f.name === 'inital_deposit')
      const referredByIndex = val.findIndex(f => f.name === 'referred_by')
      if (initalDepositIndex === -1 && referredByIndex !== 1) {
        fields.value.splice(referredByIndex + 1, 0, {
          label: 'inital deposit',
          name: 'inital_deposit',
          type: 'number',
          required: true,
          placeholder: 'Select initial deposit',
        })
      }
    }
    if (settingList.value['sacco-members-free-input-code']) {
      if (codeIndex === -1 && fullNameIndex !== -1) {
        fields.value.splice(fullNameIndex + 1, 0, {
          label: 'free input code',
          name: 'code',
          type: 'text',
          value: 'BDP-',
          required: false,
          placeholder: 'Enter code',
        })
      }
    } else {
      if (codeIndex !== -1) {
        fields.value.splice(codeIndex, 1)
      }
    }
    emits('update:form', val)
  },
  { deep: true }
)

onMounted(() => {
  promtValueOnUpdate()
  checkForSettings()
})
</script>
<template>
  <div class="h-[75vh] overflow-auto card shadow-md px-4 py-3 bg-white dark:bg-neutral-800 rounded-md">
    <span v-if='loadingMount'></span>
    <Form :action="data?.action" v-else parentStyle="grid grid-cols-2 gap-x-5 gap-y-4" v-model:form="fields" />
    <div v-setting='"sacco-share-on-member-creation-create-share-account-at-the-same-time"'
      class="mt-6 rounded-2xl border border-nfuko-primary-200 bg-nfuko-primary-50/60 overflow-hidden">
      <!-- Section header -->
      <div class="flex items-center gap-2.5 px-5 py-3 bg-nfuko-primary-100/80 border-b border-nfuko-primary-200">
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
            at <strong>{{ formatMoney(sharePrice, 0) }}</strong> each
            (total:
            <strong>
              {{ formatMoney(sharePrice * minSharesRequired, 0) }}
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
                :min="minSharesRequired"
                :placeholder="`Min. ${minSharesRequired}`"
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
                  {{ additionalForm.shares_quantity || 0 }} shares × {{ formatMoney(sharePrice, 0) }}
                </p>
                <p class="text-[18px] font-black text-nfuko-primary-700 font-mono leading-tight">
                  {{ formatMoney(totalShareInvestment) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
