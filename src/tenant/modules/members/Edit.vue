<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { Form, getSystemSetting } from '@/Global';
import { AlertCircle, TrendingUp, Share2 } from 'lucide-vue-next';

interface Option {
  id: string | number;
  name: string;
}

const OptionList = reactive<{
  memberTypeOptions: Option[];
  salutationOptions: Option[];
  genderOptions: Option[];
  maritalOptions: Option[];
}>({
  memberTypeOptions: [{ id: 'new_member', name: 'New Member' }, { id: 'existing_member', name: 'Existing Member' }],
  salutationOptions: [{ id: 'Mr', name: 'Mr' }, { id: 'Mrs', name: 'Mrs' }, { id: 'Ms', name: 'Ms' }, { id: 'Dr', name: 'Dr' }, { id: 'Prof', name: 'Prof' }],
  genderOptions: [{ id: 'male', name: 'Male' }, { id: 'female', name: 'Female' }, { id: 'other', name: 'Other' }],
  maritalOptions: [{ id: 'single', name: 'Single' }, { id: 'married', name: 'Married' }, { id: 'divorced', name: 'Divorced' }, { id: 'widowed', name: 'Widowed' }]
})
const loading = ref(true)
const settingList = ref<Record<string, string | number | boolean>>({})
const additionalForm = ref({ shares_quantity: 0 });
const errors = ref<Record<string, string | number>>({ shares_quantity: 0 });
const sharesError = ref('')
interface Member {
  id: number;
  member_type: string;
  full_name: string;
  salutation: string;
  sex: string;
  dob: string;
  primary_contact: string;
  other_contacts: string;
  MM_number: string;
  email: string;
  NIN: string;
  marital_status: string;
  from: string;
  address: string;
  profile: string;
  nokin: string;
  next_contact: string;
  joined_date: string;
  referred_by: string | number;
  memeber_code: string;
  share_no: number;
  action?: string;
}

const props = defineProps({
  data: {
    type: Object as () => Member,
    default: () => ({} as Member),
  },
})

interface FormField {
  label: string;
  name: string;
  type: string;
  value?: unknown;
  options?: Option[];
  props?: Record<string, unknown>;
  required?: boolean;
  hidden?: boolean;
  placeholder?: string;
  error?: string;
  suffix?: string;
  url?: string;
  dataOnMount?: boolean;
  selectOnOneItem?: boolean;
  dependsOn?: {
    conditions: {
      field: string;
      condition: (val: unknown) => boolean;
    }[];
  };
  change?: (value: unknown, field?: FormField, index?: number) => void;
  max?: string;
}

const fields = ref<FormField[]>([])
watch(() => additionalForm.value, (val) => {
  const field = fields.value.find(f => f.name === 'shares_quantity')
  if (field) {
    field.value = val.shares_quantity
  } else {
    fields.value.push({
      label: 'shares_quantity',
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
    fields.value = [
      {
        hidden: true,
        label: 'id',
        name: 'id',
        type: 'text',
        required: true,
        value: props.data.id,
        placeholder: '',
      },
      {
        label: 'Member type',
        name: 'member_type',
        value: props.data.member_type,
        type: 'select',
        required: true,
        placeholder: 'Search member type',
        // change: (value: any, field: any, index: number) => {
        //   const existsIndex = fields.value.findIndex(f => f.name === 'member_id')
        //   if (value === 'existing_member') {
        //     if (existsIndex === -1) {
        //       fields.value.splice(index + 1, 0, {
        //         label: 'products',
        //         name: 'product_id',
        //         type: 'select',
        //         required: true,
        //         placeholder: 'Search products',
        //         url: "global/savings-products",
        //       });
        //     }
        //   } else {
        //     if (existsIndex !== -1) {
        //       fields.value.splice(existsIndex, 1);
        //     }
        //   }
        // },

        options: OptionList.memberTypeOptions
      },
      //  {
      //   label: 'products',
      //   name: 'product_id',
      //   type: 'select',
      //   required: false,
      //   placeholder: 'Search products',
      //   url: "global/savings-products",
      //   dataOnMount: true,
      //   selectOnOneItem: true,

      //   dependsOn: {
      //     conditions: [
      //       {
      //         field: 'member_type',
      //         condition: (val: unknown) => !settingList?.value['system-used-by-money-lender']
      //       }
      //     ],
      //   },
      // },
      {
        label: 'Full Name',
        name: 'full_name',
        type: 'text',
        required: true,
        placeholder: 'Enter Full Name',
        value: props.data.full_name,

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
              condition: (val: any) => settingList?.value['sacco-members-free-input-code'] as boolean
            }
          ],
        }

      },
      //  {
      //   label: 'inital deposit',
      //   name: 'inital_deposit',
      //   type: 'money',
      //   required: true,
      //   placeholder: 'Select initial deposit',
      //   dependsOn: {
      //     conditions: [
      //       {
      //         field: 'member_type',
      //         condition: (val: unknown) => val === 'new_member'
      //       }
      //     ],
      //   },
      //   change: async (val: unknown) => {
      //     const amount = val?.target ? val.target.value : val
      //     // alert()
      //     watchChangeInProductOrCharges(fields, amount)
      //   },
      // },
      {
        label: 'Salutation',
        name: 'Salutation',
        type: 'select',
        value: props.data.salutation,
        required: true,
        placeholder: 'Search Salutation',
        options: OptionList.salutationOptions

      },
      {
        label: 'gender',
        name: 'gender',
        type: 'select',
        required: true,
        value: props.data.sex,

        placeholder: 'Search gender',
        options: OptionList.genderOptions
      },
      {
        label: 'Date Of Birth',
        name: 'date_of_birth',
        type: 'datec',
        required: true,
        value: props.data.dob,
        // maxDate: new Date(),
        max: new Date().toISOString().split('T')[0],

        props: { placeholder: 'Select Start & End Dates' },
      },
      {
        label: 'Primary Contact',
        name: 'primary_contact',
        type: 'phone',
        required: true,
        value: props.data.primary_contact,

        placeholder: 'Enter Primary Contact',
      },
      {
        label: 'Other Contacts',
        name: 'other_contacts',
        type: 'phone',
        value: props.data.other_contacts,

        required: false,
        placeholder: 'Enter Other Contacts',
      },
      {
        label: 'Mobile Money Number',
        name: 'mobile_money_number',
        type: 'phone',
        required: false,
        value: props.data.MM_number,

        placeholder: 'Enter Primary Contact',
      },
      {
        label: 'Email',
        name: 'email',
        type: 'text',
        value: props.data.email,

        required: true,
        placeholder: 'Enter Email',
      },
      {
        label: 'NATIONAL ID (NIN)',
        name: 'national_id',
        value: props.data.NIN,

        type: 'text',
        required: settingList.value['sacco-members-member-nin-mandatory'] as boolean,
        placeholder: 'Enter national id (NIN)',
      },
      {
        label: 'Marital Status',
        name: 'marital_status',
        value: props.data.marital_status,

        type: 'select',
        required: false,
        options: OptionList.maritalOptions,
        placeholder: 'Enter Marital Status',
      },
      {
        label: 'Nationality',
        name: 'nationality',
        type: 'nationality',
        value: props.data.from,

        required: true,
        placeholder: 'Enter Nationality',
      },
      {
        label: 'Address',
        name: 'address',
        value: props.data.address,
        required: !!settingList.value['sacco-on-create-member-address-mandatory'],

        type: 'textarea',
        placeholder: 'Enter Address',
      },
      {
        label: 'profile picture',
        name: 'profile_picture',
        type: 'profile',
        required: false,
        value: props.data.profile,

        placeholder: 'Enter prifile picture',
      },
      {
        label: 'Next of Kin',
        name: 'next_of_kin',
        value: props.data.nokin,

        type: 'text',
        required: !!settingList.value['sacco-members-member-next-of-kin-nin-mandatory'],

        placeholder: 'Enter Next of Kin',
      },
      {
        label: 'Next of Kin Contact',
        name: 'next_of_kin_contact',
        value: props.data.next_contact,

        type: 'phone',
        required: !!settingList.value['sacco-members-member-next-of-kin-nin-mandatory'],

        placeholder: 'Enter Next of Kin Contact',
      },

      {
        label: 'joined date',
        name: 'joined_date',
        value: props.data.joined_date
          ? props.data.joined_date.split(' ')[0]
          : '',
        max: new Date().toISOString().split('T')[0],

        type: 'date',
        required: true,
        placeholder: 'join date ',
      },
      {
        label: 'referred by',
        name: 'referred_by',
        type: 'select',
        value: props.data.referred_by,
        required: false,
        url: 'staff/users-drop-down',
        placeholder: 'Referred by',
        dataOnMount: true,
      },
    ]

    additionalForm.value.shares_quantity = props.data?.share_no
  }
  loading.value = false
}
const settingsStore = ref<Record<string, unknown> | null>(null) // Or import and use the actual store if available


const loadingMount = computed(() => loading.value)
function checkForSettings() {
  const checkForVaailableSetting = getSystemSetting()
  settingList.value = {

    "sacco-on-create-member-address-mandatory": (checkForVaailableSetting?.['sacco-on-create-member-address-mandatory'] ?? 0),
    "sacco-members-member-nin-mandatory": (checkForVaailableSetting?.['sacco-on-create-member-nin-mandatory'] ?? 0),
    "sacco-members-member-next-of-kin-nin-mandatory": (checkForVaailableSetting?.['sacco-on-create-member-next-of-kin-nin-mandatory'] ?? 0),
    // "sacco-members-member-next-of-kin-contact-mandatory": (checkForVaailableSetting?.['sacco-members-member-next-of-kin-contact-mandatory'] ?? 0),
    "hide-initial-deposit-field": (checkForVaailableSetting?.['sacco-members-show-initial-deposit-field'] ?? 0),
    "system-used-by-money-lender": (checkForVaailableSetting?.['system-used-by-money-lenders'] ?? 0),
    "sacco-members-free-input-code": (checkForVaailableSetting?.['sacco-members-free-input-code'] ?? 0),
    "sacco-share-price-value": parseFloat(checkForVaailableSetting?.['sacco-share-price-value'] ?? 0),
    "sacco-share-on-member-creation-create-share-minimum-value": parseFloat(checkForVaailableSetting?.['sacco-share-on-member-creation-create-share-minimum-value'] ?? 0)
  }

}


onMounted(() => {
  promtValueOnUpdate()
  checkForSettings()
  // console.log(props.data);

})
</script>
<template>
  <!-- {{ props.data }} -->
  <div class="card shadow-md p-4  bg-white dark:bg-neutral-800 rounded-md h-[85vh] overflow-y-auto">
    <span v-if='loadingMount'></span>
    <Form :action="data?.action" v-else parentStyle="grid  grid-cols-2 gap-4 md:gap-6" v-model:form="fields" />
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

      <div class="p-5 space-y-4">
        <div class="flex items-start gap-3 px-4 py-3 rounded-xl bg-white border border-nfuko-primary-200">
          <AlertCircle class="h-4 w-4 text-nfuko-primary-600 shrink-0 mt-0.5" />
          <p class="text-[12px] text-nfuko-primary-800 leading-relaxed">
            This SACCO requires a minimum of
            <strong>{{ settingList?.['sacco-share-on-member-creation-create-share-minimum-value'] }} share(s)</strong>
            at <strong>UGX {{ settingList?.['sacco-share-price-value'] }}</strong> each

            (total:
            <strong>
              UGX {{
                Number(settingList?.['sacco-share-price-value'] ?? 1) *
                Number(settingList?.['sacco-share-on-member-creation-create-share-minimum-value'] ?? 0)
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
                :min="(settingsStore?.minSharesOnOnboarding as number)"
                :placeholder="`Min. ${settingsStore?.minSharesOnOnboarding ?? ''}`"
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
                    (additionalForm.shares_quantity * Number(settingList?.['sacco-share-price-value'] ??
                      0)).toLocaleString('en-US', {
                        minimumFractionDigits: 2
                  }) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>